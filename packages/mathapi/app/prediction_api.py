from datetime import datetime, timedelta
from budget_api import get_objectid_for_budget
from ynab_api import get_scheduled_transactions
from categories_api import get_categories_for_budget
from accounts_api import get_accounts_for_budget
import calendar


def projected_balances_for_budget(budget_uuid, days_ahead=300, simulations=None):
    budget_id = get_objectid_for_budget(budget_uuid)
    future_transactions = get_scheduled_transactions(budget_uuid)
    categories = get_categories_for_budget(budget_id)
    accounts = get_accounts_for_budget(budget_id)
    
    # Perform balance prediction logic here
    projected_balances = project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead, simulations)
    return projected_balances


def calculate_typical_spending_day(typical_spending_pattern, target_date):
    """Calculate the typical spending day of the month."""
    days_in_month = calendar.monthrange(target_date.year, target_date.month)[1]
    return int(round(typical_spending_pattern * days_in_month))


def project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead=120, simulations=None):
    initial_balance = calculate_initial_balance(accounts)
    daily_projection = initialize_daily_projection(initial_balance, days_ahead)

    scheduled_dates_by_category = add_future_transactions_to_projection(daily_projection, future_transactions)

    process_need_categories(daily_projection, categories, scheduled_dates_by_category, days_ahead)

    add_simulations_to_projection(daily_projection, simulations)

    calculate_running_balance(daily_projection, initial_balance, days_ahead)
    projected_balances = {date: data for date, data in daily_projection.items() if data["changes"]}

    return projected_balances


def calculate_initial_balance(accounts):
    return sum(account['balance'] for account in accounts) / 1000  # Convert to thousands


def initialize_daily_projection(initial_balance, days_ahead):
    daily_projection = {}
    for day in range(days_ahead + 1):
        date = (datetime.now().date() + timedelta(days=day)).isoformat()
        daily_projection[date] = {
            "balance": f"{initial_balance}€",
            "changes": []
        }
    return daily_projection


def add_future_transactions_to_projection(daily_projection, future_transactions):
    scheduled_dates_by_category = {}
    for txn in future_transactions:
        transaction_date = datetime.strptime(txn['date_next'], '%Y-%m-%d').date().isoformat()
        category_name = txn['category_name']
        amount_eur = txn['amount'] / 1000  # Convert to thousands

        if transaction_date in daily_projection:
            daily_projection[transaction_date]["changes"].append({
                "reason": "Scheduled Transaction",
                "amount": f"{amount_eur}€",
                "category": category_name,
                "account": txn['account_name'],
                "payee": txn['payee_name'],
                "memo": txn['memo']
            })

            if category_name not in scheduled_dates_by_category:
                scheduled_dates_by_category[category_name] = set()
            scheduled_dates_by_category[category_name].add(transaction_date)

    return scheduled_dates_by_category


def process_need_categories(daily_projection, categories, scheduled_dates_by_category, days_ahead):
    for category in categories:
        target = category.get("target")

        if target and target.get("goal_type") == "NEED":
            process_need_category(
                daily_projection,
                category,
                target,
                scheduled_dates_by_category,
                days_ahead
            )


def process_need_category(daily_projection, category, target, scheduled_dates_by_category, days_ahead):
    target_amount = target.get("goal_target", 0) / 1000  # Convert to thousands
    current_balance = category.get("balance", 0) / 1000  # Convert to thousands
    goal_target_month = target.get("goal_target_month")

    if goal_target_month:
        apply_target_month(daily_projection, category, target, current_balance, target_amount, goal_target_month, scheduled_dates_by_category)
    else:
        apply_typical_spending_pattern(daily_projection, category, target, current_balance, target_amount, days_ahead, scheduled_dates_by_category)


def apply_target_month(daily_projection, category, target, current_balance, target_amount, goal_target_month, scheduled_dates_by_category):
    target_date = datetime.strptime(goal_target_month, '%Y-%m-%d').date().isoformat()

    month_key = target_date[:7]  # Year and month (YYYY-MM)
    if category["name"] in scheduled_dates_by_category:
        if any(date.startswith(month_key) for date in scheduled_dates_by_category[category["name"]]):
            return

    amount_to_add = current_balance if datetime.now().date().isoformat()[:7] == target_date[:7] else target_amount
    if target_date in daily_projection:
        daily_projection[target_date]["changes"].append({
            "reason": "Planned NEED Category Spending (Target Month)",
            "amount": f"{-amount_to_add}€",
            "category": category["name"]
        })


def apply_typical_spending_pattern(daily_projection, category, target, current_balance, target_amount, days_ahead, scheduled_dates_by_category):
    today = datetime.now().date()
    typical_spending_pattern = category.get("typicalSpendingPattern", 0.0)
    applied_months = set()

    for month in range((days_ahead // 30) + 1):
        target_date = (today.replace(day=1) + timedelta(days=month * 30)).replace(day=1)
        typical_day = calculate_typical_spending_day(typical_spending_pattern, target_date)

        try:
            spending_date = target_date.replace(day=typical_day)
        except ValueError:
            continue

        date_str = spending_date.isoformat()
        if target.get("goal_day") is None:
            last_day_of_month = target_date.replace(
                day=calendar.monthrange(target_date.year, target_date.month)[1]
            )
            date_str = last_day_of_month.isoformat()

        amount_to_add = current_balance if month == 0 else target_amount
        if category["name"] in scheduled_dates_by_category and date_str in scheduled_dates_by_category[category["name"]]:
            continue

        month_key = (target_date.year, target_date.month)
        if month_key in applied_months:
            continue

        applied_months.add(month_key)

        if date_str in daily_projection:
            daily_projection[date_str]["changes"].append({
                "reason": "Planned NEED Category Spending",
                "amount": f"{-amount_to_add}€",
                "category": category["name"]
            })


def add_simulations_to_projection(daily_projection, simulations):
    if not simulations:
        return

    for sim in simulations:
        sim_date = sim["date"]
        sim_amount = sim["amount"]
        sim_reason = sim.get("reason", "Simulation")
        sim_category = sim.get("category", "Miscellaneous")

        if sim_date in daily_projection:
            daily_projection[sim_date]["changes"].append({
                "amount": f"{sim_amount}€",
                "category": sim_category,
                "reason": sim_reason,
                "is_simulation": True
            })
        else:
            daily_projection[sim_date] = {
                "balance": "0€",
                "changes": [{
                    "amount": f"{sim_amount}€",
                    "category": sim_category,
                    "reason": sim_reason,
                    "is_simulation": True
                }]
            }


def calculate_running_balance(daily_projection, initial_balance, days_ahead):
    running_balance = initial_balance
    for day in range(days_ahead + 1):
        current_date = (datetime.now().date() + timedelta(days=day)).isoformat()
        day_entry = daily_projection[current_date]

        day_entry["balance"] = f"{running_balance}€"
        for change in day_entry["changes"]:
            change_amount = float(change["amount"].replace("€", ""))
            running_balance += change_amount
        day_entry["balance"] = f"{running_balance}€"
