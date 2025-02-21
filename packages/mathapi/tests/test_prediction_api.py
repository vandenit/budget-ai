import pytest
from datetime import datetime, timedelta
from app.prediction_api import (
    calculate_initial_balance,
    initialize_daily_projection,
    add_future_transactions_to_projection,
    calculate_running_balance,
    add_simulations_to_projection,
    process_need_categories,
    process_need_category,
    apply_need_category_spending
)
import calendar

def test_calculate_initial_balance():
    # Test data
    accounts = [
        {"balance": 1000},  # 1.0 after division by 1000
        {"balance": 2000},  # 2.0 after division by 1000
    ]
    
    expected_balance = 3.0  # (1000 + 2000) / 1000
    assert calculate_initial_balance(accounts) == expected_balance

def test_initialize_daily_projection():
    initial_balance = 1000.0
    days_ahead = 2
    
    result = initialize_daily_projection(initial_balance, days_ahead)
    
    # We expect 3 dates (today + 2 days ahead)
    assert len(result) == 3
    
    # Check structure of the entries
    for date, data in result.items():
        assert "balance" in data
        assert "changes" in data
        assert isinstance(data["changes"], list)
        
    # Check initial balance entry
    today = datetime.now().date().isoformat()
    assert result[today]["changes"][0] == {
        "reason": "Initial Balance",
        "amount": initial_balance,
        "category": "Starting Balance"
    }

def test_add_future_transactions_to_projection():
    # Setup test data
    base_date = datetime.now().date()
    daily_projection = {
        base_date.isoformat(): {"balance": 0, "changes": []},
        (base_date + timedelta(days=1)).isoformat(): {"balance": 0, "changes": []}
    }
    
    future_transactions = [
        {
            "date_next": base_date.isoformat(),
            "category_name": "Groceries",
            "amount": -50000,  # -50.0 after division by 1000
            "account_name": "Checking",
            "payee_name": "Supermarket",
            "memo": "Weekly groceries"
        }
    ]
    
    result = add_future_transactions_to_projection(daily_projection, future_transactions)
    
    # Verify the transaction was added correctly
    assert len(daily_projection[base_date.isoformat()]["changes"]) == 1
    added_transaction = daily_projection[base_date.isoformat()]["changes"][0]
    assert added_transaction["amount"] == -50.0
    assert added_transaction["category"] == "Groceries"
    assert added_transaction["reason"] == "Scheduled Transaction"
    
    # Verify scheduled_dates_by_category
    assert "Groceries" in result
    assert base_date.isoformat() in result["Groceries"]

def test_add_simulations_to_projection():
    # Setup test data
    base_date = datetime.now().date()
    daily_projection = {
        base_date.isoformat(): {"balance": 0, "changes": []}
    }
    
    simulations = [
        {
            "date": base_date.isoformat(),
            "amount": "-100.0",
            "reason": "Test Simulation",
            "category": "Test Category"
        }
    ]
    
    add_simulations_to_projection(daily_projection, simulations)
    
    # Verify simulation was added
    assert len(daily_projection[base_date.isoformat()]["changes"]) == 1
    added_sim = daily_projection[base_date.isoformat()]["changes"][0]
    assert added_sim["amount"] == -100.0
    assert added_sim["reason"] == "Test Simulation"
    assert added_sim["category"] == "Test Category"
    assert added_sim["is_simulation"] is True

def test_calculate_running_balance():
    # Setup test data
    base_date = datetime.now().date()
    daily_projection = {
        base_date.isoformat(): {
            "balance": 0,
            "changes": [{"amount": 1000.0}]  # Initial balance
        },
        (base_date + timedelta(days=1)).isoformat(): {
            "balance": 0,
            "changes": [{"amount": -200.0}]  # Expense
        }
    }
    
    calculate_running_balance(daily_projection, 1000.0, 1)
    
    # Verify running balances
    assert daily_projection[base_date.isoformat()]["balance"] == 1000.0
    assert daily_projection[(base_date + timedelta(days=1)).isoformat()]["balance"] == 800.0

@pytest.fixture
def base_daily_projection():
    base_date = datetime.now().date()
    projection = {}
    
    # Create a projection for 365 days
    for day in range(366):
        date = (base_date + timedelta(days=day)).isoformat()
        projection[date] = {
            "balance": 0,
            "changes": []
        }
    
    return projection

def test_process_need_category_monthly():
    base_date = datetime.now().date()
    daily_projection = {}
    
    # Add data for a full year
    current_date = base_date
    while current_date < (base_date + timedelta(days=365)):
        daily_projection[current_date.isoformat()] = {"balance": 0, "changes": []}
        current_date += timedelta(days=1)
    
    category = {
        "name": "Rent",
        "balance": 0,
        "target": {
            "goal_type": "NEED",
            "goal_target": 100000,  # €100 after division by 1000
            "goal_cadence": 1,  # Monthly
            "goal_cadence_frequency": 1,
            "goal_day": 1,  # First of the month
            "goal_overall_left": 100000
        }
    }
    
    scheduled_dates = {}
    
    process_need_category(
        daily_projection,
        category,
        category["target"],
        scheduled_dates,
        365  # days_ahead
    )
    
    # Check if a payment was scheduled for next month
    next_month = (base_date.replace(day=1) + timedelta(days=32)).replace(day=1)
    next_month_str = next_month.isoformat()
    
    assert next_month_str in daily_projection
    changes = [c for c in daily_projection[next_month_str]["changes"] 
              if c["category"] == "Rent"]
    assert len(changes) == 1
    assert changes[0]["amount"] == -100.0

def test_process_need_category_quarterly():
    base_date = datetime.now().date()
    daily_projection = {
        base_date.isoformat(): {"balance": 0, "changes": []}
    }
    
    # Add data for a full year
    current_date = base_date
    while current_date < (base_date + timedelta(days=365)):
        daily_projection[current_date.isoformat()] = {"balance": 0, "changes": []}
        current_date += timedelta(days=1)
    
    category = {
        "name": "Insurance",
        "balance": 0,
        "target": {
            "goal_type": "NEED",
            "goal_target": 300000,  # €300 after division by 1000
            "goal_cadence": 3,  # Quarterly
            "goal_cadence_frequency": 1,
            "goal_day": 15,  # 15th of the month
            "goal_overall_left": 300000
        }
    }
    
    scheduled_dates = {}
    
    process_need_category(
        daily_projection,
        category,
        category["target"],
        scheduled_dates,
        365  # days_ahead
    )
    
    # Calculate the next quarter date
    def next_quarter_date(date):
        # Round down to the nearest quarter
        month = ((date.month - 1) // 3) * 3 + 1
        next_quarter = date.replace(month=month, day=15)
        if next_quarter <= date:
            if month + 3 > 12:
                next_quarter = next_quarter.replace(year=next_quarter.year + 1, month=(month + 3) - 12)
            else:
                next_quarter = next_quarter.replace(month=month + 3)
        return next_quarter
    
    next_quarter = next_quarter_date(base_date)
    next_quarter_str = next_quarter.isoformat()
    
    assert next_quarter_str in daily_projection
    changes = [c for c in daily_projection[next_quarter_str]["changes"] 
              if c["category"] == "Insurance"]
    assert len(changes) == 1
    assert changes[0]["amount"] == -300.0

def test_process_need_category_yearly():
    base_date = datetime.now().date()
    daily_projection = {}
    
    # Add data for two years
    current_date = base_date
    while current_date < (base_date + timedelta(days=730)):
        daily_projection[current_date.isoformat()] = {"balance": 0, "changes": []}
        current_date += timedelta(days=1)
    
    # Set the target_month to 2 months from now
    target_month = (base_date + timedelta(days=60)).replace(day=1)
    target_month_str = target_month.isoformat()
    
    category = {
        "name": "Taxes",
        "balance": 0,
        "target": {
            "goal_type": "NEED",
            "goal_target": 1200000,  # €1200 after division by 1000
            "goal_cadence": 13,  # Yearly
            "goal_cadence_frequency": 1,
            "goal_target_month": target_month_str,
            "goal_day": 15,
            "goal_overall_left": 1200000
        }
    }
    
    scheduled_dates = {}
    
    process_need_category(
        daily_projection,
        category,
        category["target"],
        scheduled_dates,
        730  # days_ahead
    )
    
    # Check if payment was scheduled for the target month
    target_date = target_month.replace(day=15).isoformat()
    
    assert target_date in daily_projection
    changes = [c for c in daily_projection[target_date]["changes"] 
              if c["category"] == "Taxes"]
    assert len(changes) == 1
    assert changes[0]["amount"] == -1200.0

def test_process_need_categories():
    base_date = datetime.now().date()
    daily_projection = {}
    
    # Add data for a full year
    current_date = base_date
    while current_date < (base_date + timedelta(days=365)):
        daily_projection[current_date.isoformat()] = {"balance": 0, "changes": []}
        current_date += timedelta(days=1)
    
    categories = [
        {
            "name": "Rent",
            "balance": 0,
            "target": {
                "goal_type": "NEED",
                "goal_target": 100000,
                "goal_cadence": 1,
                "goal_cadence_frequency": 1,
                "goal_day": 1,
                "goal_overall_left": 100000
            }
        },
        {
            "name": "No Target",
            "balance": 0
        },
        {
            "name": "Other Type",
            "balance": 0,
            "target": {
                "goal_type": "SAVINGS",
                "goal_target": 50000
            }
        }
    ]
    
    scheduled_dates = {}
    
    process_need_categories(daily_projection, categories, scheduled_dates, 365)
    
    # Verify that only the NEED category was processed
    next_month = (base_date.replace(day=1) + timedelta(days=32)).replace(day=1)
    next_month_str = next_month.isoformat()
    
    assert next_month_str in daily_projection
    changes = [c for c in daily_projection[next_month_str]["changes"] 
              if c["category"] == "Rent"]
    assert len(changes) == 1
    
    # Verify other categories were not processed
    all_changes = []
    for date, data in daily_projection.items():
        all_changes.extend(data["changes"])
    
    assert not any(c["category"] == "No Target" for c in all_changes)
    assert not any(c["category"] == "Other Type" for c in all_changes)

@pytest.fixture
def base_projection():
    """Create a base projection for testing different spending scenarios."""
    base_date = datetime.now().date()
    projection = {}
    
    # Create projection starting from the first of the current month
    start_date = base_date.replace(day=1)
    # Create projection for 2 years
    for day in range(730):
        date = (start_date + timedelta(days=day)).isoformat()
        projection[date] = {
            "balance": 0,
            "changes": []
        }
    
    return projection

def test_yearly_cadence_with_target_month(base_projection):
    """Test yearly cadence (13) with a target month specified."""
    base_date = datetime.now().date()
    target_month = (base_date + timedelta(days=60)).replace(day=1)
    
    category = {
        "name": "Yearly Tax",
        "target": {
            "goal_type": "NEED",
            "goal_target": 1200000,  # €1200
            "goal_cadence": 13,  # Yearly
            "goal_cadence_frequency": 1,
            "goal_target_month": target_month.isoformat(),
            "goal_day": 15
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        0,  # current_balance
        1200.0,  # target_amount
        730,  # days_ahead
        1200.0  # global_overall_left
    )
    
    # Check if payment was scheduled for target month
    target_date = target_month.replace(day=15).isoformat()
    changes = [c for c in base_projection[target_date]["changes"] 
              if c["category"] == "Yearly Tax"]
    
    assert len(changes) == 1
    assert changes[0]["amount"] == -1200.0
    assert changes[0]["reason"] == "Yearly Payment"

def test_current_month_with_balance(base_projection):
    """Test handling of current month with existing balance."""
    today = datetime.now().date()
    
    # Set the spending day to 1 for consistency
    spending_day = 1
    current_month_date = today.replace(day=spending_day).isoformat()
    
    category = {
        "name": "Current Month Category",
        "target": {
            "goal_type": "NEED",
            "goal_target": 100000,  # €100
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": spending_day
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        50.0,  # current_balance
        100.0,  # target_amount
        30,  # days_ahead
        100.0  # global_overall_left
    )
    
    # Check if current balance was applied
    changes = [c for c in base_projection[current_month_date]["changes"] 
              if c["category"] == "Current Month Category"]
    
    assert len(changes) == 1
    assert changes[0]["amount"] == -50.0
    assert changes[0]["reason"] == "Current Month Balance"

def test_recurring_monthly_spending(base_projection):
    """Test regular monthly spending pattern."""
    base_date = datetime.now().date()
    category = {
        "name": "Monthly Rent",
        "target": {
            "goal_type": "NEED",
            "goal_target": 100000,  # €100
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": 1
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        0,  # current_balance
        100.0,  # target_amount
        60,  # days_ahead
        100.0  # global_overall_left
    )
    
    # Check next month's payment
    next_month = (base_date.replace(day=1) + timedelta(days=32)).replace(day=1)
    next_month_str = next_month.isoformat()
    
    changes = [c for c in base_projection[next_month_str]["changes"] 
              if c["category"] == "Monthly Rent"]
    
    assert len(changes) == 1
    assert changes[0]["amount"] == -100.0
    assert changes[0]["reason"] == "Future Month Target"

def test_quarterly_spending_with_target_month(base_projection):
    """Test quarterly spending with a specific target month."""
    base_date = datetime.now().date()
    target_month = (base_date + timedelta(days=60)).replace(day=1)
    
    category = {
        "name": "Quarterly Insurance",
        "target": {
            "goal_type": "NEED",
            "goal_target": 300000,  # €300
            "goal_cadence": 3,  # Quarterly
            "goal_cadence_frequency": 1,
            "goal_target_month": target_month.isoformat(),
            "goal_day": 15
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        0,  # current_balance
        300.0,  # target_amount
        365,  # days_ahead
        300.0  # global_overall_left
    )
    
    # Calculate expected payment dates
    payment_date = target_month.replace(day=15)
    payment_dates = []
    while payment_date < (base_date + timedelta(days=365)):
        payment_dates.append(payment_date)
        # Add 3 months
        year = payment_date.year + ((payment_date.month + 2) // 12)
        month = ((payment_date.month + 2) % 12) + 1
        payment_date = payment_date.replace(year=year, month=month)
    
    # Verify payments
    for date in payment_dates:
        date_str = date.isoformat()
        changes = [c for c in base_projection[date_str]["changes"] 
                  if c["category"] == "Quarterly Insurance"]
        assert len(changes) == 1
        assert changes[0]["amount"] == -300.0

def test_spending_with_scheduled_transactions(base_projection):
    """Test spending calculation when there are already scheduled transactions."""
    base_date = datetime.now().date()
    next_month = (base_date.replace(day=1) + timedelta(days=32)).replace(day=1)
    
    # Add a scheduled transaction
    base_projection[next_month.isoformat()]["changes"].append({
        "reason": "Scheduled Transaction",
        "amount": -50.0,
        "category": "Monthly Bills"
    })
    
    category = {
        "name": "Monthly Bills",
        "target": {
            "goal_type": "NEED",
            "goal_target": 100000,  # €100 target
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": 1
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        0,  # current_balance
        100.0,  # target_amount
        60,  # days_ahead
        100.0  # global_overall_left
    )
    
    # Verify that only the remaining amount was added
    changes = [c for c in base_projection[next_month.isoformat()]["changes"] 
              if c["category"] == "Monthly Bills"]
    
    assert len(changes) == 2  # Original scheduled + remaining amount
    scheduled = next(c for c in changes if c["reason"] == "Scheduled Transaction")
    remaining = next(c for c in changes if c["reason"] == "Future Month Target")
    assert scheduled["amount"] == -50.0
    assert remaining["amount"] == -50.0  # Remaining amount to reach target 