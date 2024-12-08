from datetime import datetime, timedelta
from budget_api import get_objectid_for_budget
from ynab_api import get_scheduled_transactions
from categories_api import get_categories_for_budget
from accounts_api import get_accounts_for_budget
from collections import OrderedDict
import calendar
import logging


def projected_balances_for_budget(budget_uuid, days_ahead=300, simulations=None):
    budget_id = get_objectid_for_budget(budget_uuid)
    future_transactions = get_scheduled_transactions(budget_uuid)
    categories = get_categories_for_budget(budget_id)
    accounts = get_accounts_for_budget(budget_id)
    
    # Perform balance prediction logic here
    projected_balances = project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead, simulations)
    return projected_balances


def project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead=30, simulations=None):
    initial_balance = calculate_initial_balance(accounts)
    daily_projection = initialize_daily_projection(initial_balance, days_ahead)

    scheduled_dates_by_category = add_future_transactions_to_projection(daily_projection, future_transactions)

    process_need_categories(daily_projection, categories, scheduled_dates_by_category, days_ahead)

    add_simulations_to_projection(daily_projection, simulations)

    calculate_running_balance(daily_projection, initial_balance, days_ahead)
    projected_balances = {date: data for date, data in daily_projection.items() if data["changes"]}
    sorted_projected_balances = OrderedDict(sorted(projected_balances.items(), key=lambda item: item[0]))
    
    return sorted_projected_balances        


def calculate_initial_balance(accounts):
    return sum(account['balance'] for account in accounts) / 1000  # Convert to thousands


def initialize_daily_projection(initial_balance, days_ahead):
    daily_projection = {}
    for day in range(days_ahead + 1):
        date = (datetime.now().date() + timedelta(days=day)).isoformat()
        daily_projection[date] = {
            "balance": initial_balance,  # Keep raw numeric value
            "changes": []
        }
    return daily_projection


def add_future_transactions_to_projection(daily_projection, future_transactions):
    scheduled_dates_by_category = {}
    for txn in future_transactions:
        transaction_date = datetime.strptime(txn['date_next'], '%Y-%m-%d').date().isoformat()
        category_name = txn['category_name']
        amount = txn['amount'] / 1000  # Convert to thousands

        if transaction_date in daily_projection:
            daily_projection[transaction_date]["changes"].append({
                "reason": "Scheduled Transaction",
                "amount": amount,  # Keep raw numeric value
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

    apply_need_category_spending(
        daily_projection,
        category,
        target,
        current_balance,
        target_amount,
        days_ahead,
        scheduled_dates_by_category
    )

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
            "amount": -amount_to_add,  # Keep raw numeric value
            "category": category["name"]
        })


def calculate_typical_spending_day(typical_spending_pattern, target_date):
    """Calculate the typical spending day of the month."""
    days_in_month = calendar.monthrange(target_date.year, target_date.month)[1]
    return int(round(typical_spending_pattern * days_in_month))

def apply_need_category_spending(daily_projection, category, target, current_balance, target_amount, days_ahead, scheduled_dates_by_category):
    today = datetime.now().date()
    applied_months = set()

    for month_offset in range((days_ahead // 30) + 1):
        # Calculate the target year and month
        target_year = today.year + ((today.month - 1 + month_offset) // 12)
        target_month = ((today.month - 1 + month_offset) % 12) + 1
        days_in_month = calendar.monthrange(target_year, target_month)[1]

        # Use the day from the target if provided, otherwise default to the last day of the month
        target_day = target.get("goal_target_day", days_in_month)
        try:
            spending_date = datetime(target_year, target_month, target_day).date()
        except ValueError:
            spending_date = datetime(target_year, target_month, days_in_month).date()  # Fallback to last day of month

        date_str = spending_date.isoformat()

        # Skip if spending for this category already exists in the same month
        month_key = (target_year, target_month)
        if category["name"] in scheduled_dates_by_category and any(
            date.startswith(f"{target_year}-{target_month:02d}")
            for date in scheduled_dates_by_category[category["name"]]
        ):
            logging.warning(f"Skipping {date_str} for {category['name']} due to scheduling conflict")
            continue

        # Avoid reapplying for the same month
        if month_key in applied_months:
            logging.warning(f"Skipping already applied month: {month_key}")
            continue

        applied_months.add(month_key)

        # Determine the amount to add for this spending date
        amount_to_add = current_balance if month_offset == 0 else target_amount

        # Apply the spending to the daily projection
        if date_str in daily_projection:
            daily_projection[date_str]["changes"].append({
                "reason": "Planned NEED Category Spending",
                "amount": -amount_to_add,  # Negative for spending
                "category": category["name"]
            })
        else:
            daily_projection[date_str] = {
                "balance": 0.0,  # Initialize with numeric value
                "changes": [{
                    "reason": "Planned NEED Category Spending",
                    "amount": -amount_to_add,  # Negative for spending
                    "category": category["name"]
                }]
            }

def add_simulations_to_projection(daily_projection, simulations):
    if not simulations:
        return

    for sim in simulations:
        sim_date = sim["date"]
        sim_amount = float(sim["amount"])  # Convert string to float
        sim_reason = sim.get("reason", "Simulation")
        sim_category = sim.get("category", "Miscellaneous")

        if sim_date in daily_projection:
            daily_projection[sim_date]["changes"].append({
                "amount": sim_amount,  # Use raw numeric value
                "category": sim_category,
                "reason": sim_reason,
                "is_simulation": True
            })
        else:
            daily_projection[sim_date] = {
                "balance": 0.0,  # Initialize with numeric value
                "changes": [{
                    "amount": sim_amount,  # Use raw numeric value
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

        # Apply changes and calculate new balance
        day_entry["balance_diff"] = sum(change["amount"] for change in day_entry["changes"])
        running_balance += day_entry["balance_diff"]

        # Update balance
        day_entry["balance"] = running_balance
