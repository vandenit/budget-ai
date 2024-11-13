from datetime import datetime, timedelta

def project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead=30):
    # Initialize starting balance from all accounts
    initial_balance = sum(account['balance'] for account in accounts) / 1000  # Convert to thousands
    daily_projection = {}

    # Prepare daily projection for the specified period
    for day in range(days_ahead + 1):
        date = (datetime.now().date() + timedelta(days=day)).isoformat()
        daily_projection[date] = {
            "balance": f"{initial_balance}€",
            "changes": []  # Track reasons for balance changes
        }

    # Apply scheduled transactions
    for txn in future_transactions:
        transaction_date = datetime.strptime(txn['date_next'], '%Y-%m-%d').date().isoformat()
        amount_eur = txn['amount'] / 1000  # Convert to thousands
        
        if transaction_date in daily_projection:
            daily_projection[transaction_date]["changes"].append({
                "reason": "Scheduled Transaction",
                "amount": f"{amount_eur}€",
                "category": txn['category_name'],
                "account": txn['account_name'],
                "payee": txn['payee_name'],
                "memo": txn['memo']
            })

    # Process only "NEED" categories with a specific `goal_day` within the target object
    for category in categories:
        target = category.get("target")
        if target and target.get("goal_type") == "NEED" and target.get("goal_day") is not None:
            goal_day = target["goal_day"]
            target_amount = target.get("goal_target", 0) / 1000  # Convert to thousands

            # Schedule the payment on `goal_day` for each month within the `days_ahead` period
            current_date = datetime.now().date()
            for month in range((days_ahead // 30) + 1):  # Approximate number of months in `days_ahead`
                try:
                    # Calculate the goal date for this month by adding the month offset
                    goal_date = (current_date + timedelta(days=month * 30)).replace(day=goal_day)
                except ValueError:
                    # Skip if the month doesn't have the specified day (e.g., February 30)
                    continue
                
                date_str = goal_date.isoformat()
                # Only add the category adjustment if it hasn't been added for this day
                if date_str in daily_projection and not any(change.get("category") == category["name"] for change in daily_projection[date_str]["changes"]):
                    daily_projection[date_str]["changes"].append({
                        "reason": "Planned NEED Category Spending",
                        "amount": f"{-target_amount}€",
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
