from datetime import datetime, timedelta
from app.budget_api import get_objectid_for_budget
from app.ynab_api import get_scheduled_transactions
from app.categories_api import get_categories_for_budget
from app.accounts_api import get_accounts_for_budget
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
    """
    Calculate projected balances for a budget over a specified period.
    
    Args:
        budget_uuid: The UUID of the budget
        days_ahead: Number of days to project into the future
        simulations: Optional list of simulation scenarios to include
        
    Returns:
        Dictionary containing daily projections with changes and balances
    """
    budget_id = get_objectid_for_budget(budget_uuid)
    future_transactions = get_scheduled_transactions(budget_uuid)
    categories = get_categories_for_budget(budget_id)
    accounts = get_accounts_for_budget(budget_id)
    
    # Perform balance prediction logic here
    projected_balances = project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead, simulations)
    return projected_balances


def project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead=30, simulations=None):
    """
    Project daily balances with detailed reasons for changes.
    
    Args:
        accounts: List of account objects with balances
        categories: List of budget categories
        future_transactions: List of scheduled future transactions
        days_ahead: Number of days to project into the future
        simulations: Optional list of simulation scenarios
        
    Returns:
        OrderedDict containing daily projections sorted by date
    """
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
    """Calculate the total initial balance across all accounts (in thousands)."""
    return sum(account['balance'] for account in accounts) / 1000  # Convert to thousands


def initialize_daily_projection(initial_balance, days_ahead):
    """
    Initialize the daily projection dictionary with empty entries.
    
    Args:
        initial_balance: Starting balance for the projection
        days_ahead: Number of days to project into the future
        
    Returns:
        Dictionary with initialized daily entries
    """
    daily_projection = {}
    # Start with current day (day 0) up to days_ahead
    current_date = datetime.now().date()
    daily_projection[current_date.isoformat()] = {
        "balance": 0,  # Start with 0, balance will be calculated later
        "changes": [{
            "reason": "Initial Balance",
            "amount": initial_balance,
            "category": "Starting Balance"
        }]
    }
    
    # Add the following days
    for day in range(1, days_ahead + 1):
        date = (current_date + timedelta(days=day)).isoformat()
        daily_projection[date] = {
            "balance": 0,  # Start with 0, balance will be calculated later
            "changes": []
        }
    return daily_projection


def add_future_transactions_to_projection(daily_projection, future_transactions):
    """
    Add scheduled future transactions to the daily projection.
    
    Args:
        daily_projection: Dictionary containing daily projections
        future_transactions: List of scheduled transactions
        
    Returns:
        Dictionary mapping category names to sets of scheduled dates
    """
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
    """Process all categories with NEED type goals."""
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
    """
    Process a single NEED category and its spending targets.
    
    Args:
        daily_projection: Dictionary containing daily projections
        category: Category object with target information
        target: Target configuration for the category
        scheduled_dates_by_category: Dictionary of already scheduled dates
        days_ahead: Number of days to project into the future
    """
    target_amount = target.get("goal_target", 0) / 1000  # Convert to thousands
    current_balance = category.get("balance", 0) / 1000  # Convert to thousands
    global_overall_left = target.get("goal_overall_left")  # This could be None
    if global_overall_left is None:  # Explicitly handle None
        global_overall_left = 0
    global_overall_left /= 1000  # Convert to thousands

    # Pass the current balance to apply_need_category_spending
    # That function will determine if the balance should be used (only for current month)
    apply_need_category_spending(
        daily_projection,
        category,
        target,
        current_balance,
        target_amount,
        days_ahead,
        global_overall_left
    )


def apply_need_category_spending(daily_projection, category, target, current_balance, target_amount, days_ahead, global_overall_left):
    """
    Apply spending patterns for a NEED category based on its target configuration.
    
    Args:
        daily_projection: Dictionary containing daily projections
        category: Category object with target information
        target: Target configuration for the category
        current_balance: Current balance in the category
        target_amount: Target amount for the category
        days_ahead: Number of days to project into the future
        global_overall_left: Remaining amount in the overall goal
    """
    today = datetime.now().date()
    applied_months = set()
    cadence_interval = None
    cadence_config = None

    # Retrieve goal information
    goal_target_month = target.get("goal_target_month")
    goal_cadence_frequency = target.get("goal_cadence_frequency")
    goal_day = target.get("goal_day")  # Retrieve goal_day if available
    goal_cadence = target.get("goal_cadence")

    if goal_cadence_frequency:
        cadence_config = CADENCE_CONFIG.get(goal_cadence, {"type": "monthly", "interval": 1})  # Default to monthly
        cadence_interval = cadence_config["interval"] * goal_cadence_frequency  # Apply multiplier to interval

    # Parse goal_target_month if it exists
    if goal_target_month:
        goal_target_month = datetime.strptime(goal_target_month, '%Y-%m-%d').date()

    for month_offset in range((days_ahead // 30) + 1):
        # Determine target year and month
        target_year = today.year + ((today.month - 1 + month_offset) // 12)
        target_month = ((today.month - 1 + month_offset) % 12) + 1
        target_date = datetime(target_year, target_month, 1).date()

        # Determine spending date
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        spending_day = goal_day if goal_day and 1 <= goal_day <= days_in_month else days_in_month
        spending_date = datetime(target_year, target_month, spending_day).date()
        date_str = spending_date.isoformat()

        # Skip if already applied for this cadence period
        if target_date in applied_months:
            continue

        is_current_month = today.year == target_year and today.month == target_month

        # Calculate scheduled transactions for this month
        month_start = datetime(target_year, target_month, 1).date()
        month_end = datetime(target_year, target_month, days_in_month).date()
        scheduled_amount = 0
        for day in range(days_in_month):
            check_date = (month_start + timedelta(days=day)).isoformat()
            if check_date in daily_projection:
                for change in daily_projection[check_date]["changes"]:
                    if change["reason"] == "Scheduled Transaction" and change["category"] == category["name"]:
                        scheduled_amount += abs(change["amount"])  # Use abs() since changes are negative

        # Handle yearly cadence (goal_cadence 13) separately
        if goal_cadence == 13:  # Yearly cadence
            if goal_target_month and spending_date >= goal_target_month:
                # Only apply if we're at or past the target month
                if spending_date.month == goal_target_month.month and spending_date.year >= goal_target_month.year:
                    remaining_amount = global_overall_left if global_overall_left > 0 else target_amount
                    remaining_amount = max(0, remaining_amount - scheduled_amount)
                    if remaining_amount > 0:
                        apply_transaction(daily_projection, date_str, remaining_amount, category["name"], "Yearly Payment")
                    applied_months.add(target_date)
            continue

        # Handle current month targets
        if is_current_month:
            # For the current month, use the current balance as spending
            if current_balance > 0:
                apply_transaction(daily_projection, date_str, current_balance, category["name"], "Current Month Balance")
            continue

        # Handle goal_target_month logic for non-yearly cadences
        if goal_target_month:
            if target_date == goal_target_month:
                if global_overall_left > 0:
                    remaining_amount = max(0, global_overall_left - scheduled_amount)
                    if remaining_amount > 0:
                        apply_transaction(daily_projection, date_str, remaining_amount, category["name"], "Remaining Spending (Goal Target)")
                applied_months.add(target_date)
                continue
            elif target_date > goal_target_month and cadence_interval:
                months_since_goal = (target_date.year - goal_target_month.year) * 12 + (target_date.month - goal_target_month.month)
                if months_since_goal % cadence_interval == 0:
                    remaining_amount = max(0, target_amount - scheduled_amount)
                    if remaining_amount > 0:
                        apply_transaction(daily_projection, date_str, remaining_amount, category["name"], f"Recurring Spending ({cadence_config['type'].capitalize()} every {goal_cadence_frequency})")
                    applied_months.add(target_date)
                continue

        # If no goal_target_month is provided, apply spending at the specific day or end of the month
        if not goal_target_month:
            if is_current_month:
                if current_balance > 0:
                    apply_transaction(daily_projection, date_str, current_balance, category["name"], "Current Month Balance")
            else:
                remaining_amount = max(0, target_amount - scheduled_amount)
                if remaining_amount > 0:
                    apply_transaction(daily_projection, date_str, remaining_amount, category["name"], "Future Month Target")


def apply_transaction(daily_projection, date_str, amount, category_name, reason):
    """Helper function to add transactions to the daily projection."""
    if date_str in daily_projection:
        daily_projection[date_str]["changes"].append({
            "reason": reason,
            "amount": -amount,  # Negative for expenses
            "category": category_name
        })


def add_simulations_to_projection(daily_projection, simulations):
    """Add simulation scenarios to the daily projection."""
    if not simulations:
        return

    for sim in simulations:
        sim_date = sim["date"]
        sim_amount = float(sim["amount"])  # Convert string to float
        sim_reason = sim.get("reason", "Simulation")
        sim_category = sim.get("category", "Miscellaneous")

        if sim_date in daily_projection:
            daily_projection[sim_date]["changes"].append({
                "amount": sim_amount,
                "category": sim_category,
                "reason": sim_reason,
                "is_simulation": True
            })


def calculate_running_balance(daily_projection, initial_balance, days_ahead):
    """
    Calculate running balances for each day in the projection.
    
    Args:
        daily_projection: Dictionary containing daily projections
        initial_balance: Starting balance for the calculation
        days_ahead: Number of days to calculate balances for
    """
    running_balance = 0  # Start with 0 since initial_balance is already added as a change
    for day in range(days_ahead + 1):
        current_date = (datetime.now().date() + timedelta(days=day)).isoformat()
        day_entry = daily_projection[current_date]

        # Apply changes and calculate new balance
        day_entry["balance_diff"] = sum(change["amount"] for change in day_entry["changes"])
        running_balance += day_entry["balance_diff"]

        # Update balance
        day_entry["balance"] = running_balance