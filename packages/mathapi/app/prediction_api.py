from datetime import datetime, timedelta
from collections import defaultdict

def project_daily_balances_with_reasons(accounts, categories, future_transactions, days_ahead=30):
    # Initialize the starting balance from all accounts
    initial_balance = sum(account['balance'] for account in accounts) / 1000  # Convert to thousands and add € symbol
    print(f"Initial Balance: {initial_balance}€")
    # Prepare a dictionary to hold daily projections
    daily_projection = {}
    
    # Populate the initial balance entry
    for day in range(days_ahead + 1):
        date = (datetime.now().date() + timedelta(days=day)).isoformat()  # Convert date to string format
        daily_projection[date] = {
            "balance": f"{initial_balance}€",
            "changes": []  # Holds reason for each change
        }

    # Step 1: Apply scheduled transactions
    for txn in future_transactions:
        transaction_date = datetime.strptime(txn['date_next'], '%Y-%m-%d').date().isoformat()
        amount_eur = txn['amount'] / 1000  # Convert to thousands and add € symbol
        
        if transaction_date in daily_projection:
            print(f"added transaction in projection Transaction Date: {transaction_date}, Transaction formatted amount: {amount_eur}€, Transaction Category: {txn['category_name']}, Transaction Account: {txn['account_name']}")
            daily_projection[transaction_date]["balance"] = f"{daily_projection[transaction_date]['balance']}€"
            daily_projection[transaction_date]["changes"].append({
                "reason": "Scheduled Transaction",
                "amount": f"{amount_eur}€",
                "category": txn['category_name'],
                "account": txn['account_name'],
                "payee": txn['payee_name'],
                "memo": txn['memo']
            })
            print(f"Daily Projection: {daily_projection[transaction_date]}")


    # Step 3: Calculate the running balance with reasons
    running_balance = initial_balance
    for day in range(days_ahead + 1):
        current_date = (datetime.now().date() + timedelta(days=day)).isoformat()
        day_entry = daily_projection[current_date]
        
        # Initialize today's balance with the previous day's running balance
        day_entry["balance"] = f"{running_balance}€"
        
        # Apply each change in today's 'changes' to the running balance
        for change in day_entry["changes"]:
            change_amount = float(change["amount"].replace("€", ""))
            running_balance += change_amount  # Apply the change to running balance
        
        # Update day's balance to reflect all changes
        day_entry["balance"] = f"{running_balance}€"
    
    return daily_projection
