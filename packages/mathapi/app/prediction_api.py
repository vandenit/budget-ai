from datetime import datetime, timedelta
from budget_api import get_objectid_for_budget
from ynab_api import get_scheduled_transactions
from categories_api import get_categories_for_budget
from accounts_api import get_accounts_for_budget
from collections import OrderedDict
import calendar
import logging

CADENCE_CONFIG = {
    1: {"type": "monthly", "interval": 1},       # Monthly cadence
    3: {"type": "quarterly", "interval": 3},    # Quarterly cadence
    13: {"type": "yearly", "interval": 12},     # Special case: Yearly with an irregular identifier
    # Add other cadence configurations as needed
}


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


def apply_need_category_spending(daily_projection, category, target, current_balance, target_amount, days_ahead, scheduled_dates_by_category):
    today = datetime.now().date()
    applied_months = set()
    cadence_interval = None
    cadence_config = None
    # Retrieve goal information
    goal_target_month = target.get("goal_target_month")
    goal_cadence_frequency = target.get("goal_cadence_frequency")  # Default to 1 if None
    if goal_cadence_frequency is None:
        goal_cadence_frequency = 1  # Fallback to 1 if it is None
    else:
        cadence_config = CADENCE_CONFIG.get(target.get("goal_cadence", 1), {"type": "monthly", "interval": 1})  # Default to monthly
        cadence_interval = cadence_config["interval"] * goal_cadence_frequency  # Apply multiplier to interval

    # Parse goal_target_month if it exists
    if goal_target_month:
        goal_target_month = datetime.strptime(goal_target_month, '%Y-%m-%d').date()

    for month_offset in range((days_ahead // 30) + 1):
        # Determine target year and month
        target_year = today.year + ((today.month - 1 + month_offset) // 12)
        target_month = ((today.month - 1 + month_offset) % 12) + 1
        target_date = datetime(target_year, target_month, 1).date()

        # Calculate spending date (end of the month by default)
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        spending_date = datetime(target_year, target_month, days_in_month).date()
        date_str = spending_date.isoformat()

        # Skip if already applied for this cadence period
        if target_date in applied_months:
            continue

        # Handle goal_target_month logic
        if goal_target_month and target_date == goal_target_month:
            remaining_amount = target_amount - current_balance
            if remaining_amount > 0:
                apply_transaction(daily_projection, date_str, remaining_amount, category["name"], "Remaining Spending (Goal Target)")
            continue

        # Process recurrences based on cadence interval
        if goal_target_month and target_date > goal_target_month and cadence_interval:
            months_since_goal = (target_date.year - goal_target_month.year) * 12 + (target_date.month - goal_target_month.month)
            if months_since_goal % cadence_interval == 0:
                apply_transaction(daily_projection, date_str, target_amount, category["name"], f"Recurring Spending ({cadence_config['type'].capitalize()} every {goal_cadence_frequency})")
            continue

        # If no goal_target_month is provided, apply spending at the end of the month
        if not goal_target_month:
            apply_transaction(daily_projection, date_str, target_amount, category["name"], "Spending (No Target Month)")
            continue

def apply_transaction(daily_projection, date_str, amount, category_name, reason):
    """Hulpfunctie om transacties toe te voegen aan daily_projection."""
    if date_str in daily_projection:
        daily_projection[date_str]["changes"].append({
            "reason": reason,
            "amount": -amount,  # Negatief voor uitgaven
            "category": category_name
        })
    else:
        daily_projection[date_str] = {
            "balance": 0.0,  # Initieer saldo
            "changes": [{
                "reason": reason,
                "amount": -amount,
                "category": category_name
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
