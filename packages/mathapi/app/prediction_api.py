from datetime import datetime, timedelta
import calendar

def calculate_typical_spending_day(typical_spending_pattern, target_date):
    """Calculate the typical spending day of the month."""
    days_in_month = calendar.monthrange(target_date.year, target_date.month)[1]
    return int(round(typical_spending_pattern * days_in_month))

def project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead=30):
    # Initialize the starting balance from all accounts
    initial_balance = sum(account['balance'] for account in accounts) / 1000  # Convert to thousands
    daily_projection = {}

    # Prepare daily projection for the specified period
    for day in range(days_ahead + 1):
        date = (datetime.now().date() + timedelta(days=day)).isoformat()
        daily_projection[date] = {
            "balance": f"{initial_balance}€",
            "changes": []
        }

    # Create a set of dates with scheduled transactions by category
    scheduled_dates_by_category = {}
    for txn in future_transactions:
        transaction_date = datetime.strptime(txn['date_next'], '%Y-%m-%d').date().isoformat()
        category_name = txn['category_name']
        amount_eur = txn['amount'] / 1000  # Convert to thousands
        
        # Add the scheduled transaction to daily projection and track dates for each category
        if transaction_date in daily_projection:
            daily_projection[transaction_date]["changes"].append({
                "reason": "Scheduled Transaction",
                "amount": f"{amount_eur}€",
                "category": category_name,
                "account": txn['account_name'],
                "payee": txn['payee_name'],
                "memo": txn['memo']
            })
            # Track scheduled dates by category name
            if category_name not in scheduled_dates_by_category:
                scheduled_dates_by_category[category_name] = set()
            scheduled_dates_by_category[category_name].add(transaction_date)

    # Process "NEED" categories with typical spending patterns
    for category in categories:
        target = category.get("target")
        
        if target and target.get("goal_type") == "NEED":
            target_amount = target.get("goal_target", 0) / 1000  # Convert to thousands
            current_balance = category.get("balance", 0) / 1000  # Convert to thousands

            # Check if the category has a specific target month
            goal_target_month = target.get("goal_target_month")
            if goal_target_month:
                target_date = datetime.strptime(goal_target_month, '%Y-%m-%d').date().isoformat()
                
                # Skip if a scheduled transaction already exists for this category in that month
                month_key = (target_date[:7])  # Year and month (YYYY-MM)
                if category["name"] in scheduled_dates_by_category:
                    if any(date.startswith(month_key) for date in scheduled_dates_by_category[category["name"]]):
                        continue
                
                # Apply the entire balance or remaining balance on the target month date
                if datetime.now().date().isoformat()[:7] == target_date[:7]:  # Current month
                    amount_to_add = current_balance
                else:
                    amount_to_add = target_amount

                # Add to the projection only on the goal target date
                if target_date in daily_projection:
                    daily_projection[target_date]["changes"].append({
                        "reason": "Planned NEED Category Spending (Target Month)",
                        "amount": f"{-amount_to_add}€",
                        "category": category["name"]
                    })

            else:
                # Categories without a specific goal target month continue with typical spending pattern logic
                today = datetime.now().date()
                typical_spending_pattern = category.get("typicalSpendingPattern", 0.0)
                
                # Track if a planned spending has been applied for this category in a specific month
                applied_months = set()

                for month in range((days_ahead // 30) + 1):  # Iterate over months within days_ahead
                    target_date = (today.replace(day=1) + timedelta(days=month * 30)).replace(day=1)
                    typical_day = calculate_typical_spending_day(typical_spending_pattern, target_date)
                    try:
                        spending_date = target_date.replace(day=typical_day)
                    except ValueError:
                        continue  # Skip if the month doesn't have the specified day

                    date_str = spending_date.isoformat()

                    # If goal_day is None, use the last day of the month
                    if target.get("goal_day") is None:
                        last_day_of_month = target_date.replace(
                            day=calendar.monthrange(target_date.year, target_date.month)[1]
                        )
                        date_str = last_day_of_month.isoformat()

                    # Apply only remaining balance in the current month
                    if month == 0:
                        amount_to_add = current_balance
                    else:
                        amount_to_add = target_amount

                    # Skip if there is already a scheduled transaction for this category on this date
                    if category["name"] in scheduled_dates_by_category and date_str in scheduled_dates_by_category[category["name"]]:
                        continue

                    # Avoid reapplying in the same month
                    month_key = (target_date.year, target_date.month)
                    if month_key in applied_months:
                        continue
                    applied_months.add(month_key)

                    # Add planned spending to the daily projection
                    if date_str in daily_projection:
                        daily_projection[date_str]["changes"].append({
                            "reason": "Planned NEED Category Spending",
                            "amount": f"{-amount_to_add}€",
                            "category": category["name"]
                        })

    # Calculate the running balance with applied changes
    running_balance = initial_balance
    for day in range(days_ahead + 1):
        current_date = (datetime.now().date() + timedelta(days=day)).isoformat()
        day_entry = daily_projection[current_date]
        
        # Set today’s balance to the running balance so far
        day_entry["balance"] = f"{running_balance}€"
        
        # Apply each change to the running balance
        for change in day_entry["changes"]:
            change_amount = float(change["amount"].replace("€", ""))
            running_balance += change_amount  # Apply the change to the running balance
        
        # Finalize the day's balance after all changes
        day_entry["balance"] = f"{running_balance}€"
    
    return daily_projection
