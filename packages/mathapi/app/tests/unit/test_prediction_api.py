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
    assert abs(calculate_initial_balance(accounts) - expected_balance) < 0.01

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
            "memo": "Weekly groceries",
            "id": "test-transaction-id"
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
    assert abs(daily_projection[base_date.isoformat()]["balance"] - 1000.0) < 0.01
    assert abs(daily_projection[(base_date + timedelta(days=1)).isoformat()]["balance"] - 800.0) < 0.01

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

@pytest.fixture
def base_projection():
    """Create a base projection for testing different spending scenarios."""
    # Create projection for 2 years starting from Jan 1, 2025
    start_date = datetime(2025, 1, 1).date()
    projection = {}

    # Create projection for 2 years
    for day in range(730):
        date = (start_date + timedelta(days=day)).isoformat()
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


def test_current_month_balance_with_scheduled_transactions_exceeding_balance(base_projection):
    """Test current month balance when scheduled transactions exceed the current balance.
    
    This reproduces the bug where a category has a positive balance but scheduled transactions
    that will consume more than the balance, resulting in a negative effective balance.
    In this case, no additional spending should be predicted.
    
    Example: Sociale bijdrage Afbetaling has €579.92 balance but €1000 in scheduled transactions.
    """
    today = datetime.now().date()
    # Use end of month for spending prediction
    spending_day = 30 if today.month != 2 else 28  # Simplified for test
    current_month_date = today.replace(day=spending_day).isoformat()
    
    # Add scheduled transactions that exceed the current balance
    # Two transactions of €500 each = €1000 total
    base_projection[today.replace(day=20).isoformat()]["changes"].append({
        "reason": "Scheduled Transaction",
        "amount": -500.0,  # €500
        "category": "Sociale bijdrage Afbetaling"
    })
    base_projection[today.replace(day=29).isoformat()]["changes"].append({
        "reason": "Scheduled Transaction", 
        "amount": -500.0,  # €500
        "category": "Sociale bijdrage Afbetaling"
    })
    
    category = {
        "name": "Sociale bijdrage Afbetaling",
        "balance": 579920,  # €579.92 (in milliunits)
        "target": {
            "goal_type": "NEED",
            "goal_target": 1350000,  # €1350 (in milliunits)
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": None,  # End of month
            "goal_target_month": None,
            "goal_overall_left": 432890  # €432.89 (in milliunits)
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        579.92,  # current_balance (in regular units)
        1350.0,  # target_amount (in regular units)
        30,  # days_ahead
        432.89  # global_overall_left (in regular units)
    )
    
    # Check end of current month - should have NO additional spending prediction
    # because scheduled transactions (€1000) exceed current balance (€579.92)
    changes = [c for c in base_projection[current_month_date]["changes"] 
              if c["category"] == "Sociale bijdrage Afbetaling" and c["reason"] == "Current Month Balance"]
    
    assert len(changes) == 0, "Should not predict additional spending when scheduled transactions exceed balance"


def test_current_month_balance_with_scheduled_transactions_partial_consumption(base_projection):
    """Test current month balance when scheduled transactions partially consume the balance.
    
    This tests the case where scheduled transactions consume part of the balance,
    but there's still a positive effective balance remaining.
    
    Example: Eating Out has €188.35 balance with €100 in scheduled transactions.
    Should predict spending of remaining €88.35.
    """
    today = datetime.now().date()
    # Use end of month for spending prediction  
    spending_day = 30 if today.month != 2 else 28  # Simplified for test
    current_month_date = today.replace(day=spending_day).isoformat()
    
    # Add scheduled transaction that partially consumes the balance
    base_projection[today.replace(day=15).isoformat()]["changes"].append({
        "reason": "Scheduled Transaction",
        "amount": -100.0,  # €100
        "category": "Eating Out"
    })
    
    category = {
        "name": "Eating Out",
        "balance": 188350,  # €188.35 (in milliunits)
        "target": {
            "goal_type": "NEED",
            "goal_target": 600000,  # €600 (in milliunits)
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": None,  # End of month
            "goal_target_month": None,
            "goal_overall_left": 0  # Already fully funded
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        188.35,  # current_balance (in regular units)
        600.0,  # target_amount (in regular units)
        30,  # days_ahead
        0  # global_overall_left (in regular units)
    )
    
    # Check end of current month - should predict spending of remaining balance after scheduled transactions
    # Effective balance = €188.35 - €100 = €88.35
    changes = [c for c in base_projection[current_month_date]["changes"] 
              if c["category"] == "Eating Out" and c["reason"] == "Current Month Balance"]
    
    assert len(changes) == 1, "Should predict spending of remaining balance"
    assert abs(changes[0]["amount"] - (-88.35)) < 0.01, f"Should spend remaining balance of €88.35, got {changes[0]['amount']}"


def test_quarterly_category_with_specific_target_date(base_projection):
    """Test quarterly category with goal_target_month set to specific date (like 2025-10-15).
    
    This reproduces the bug where:
    1. Current month incorrectly gets spending prediction when goal_overall_left is 0
    2. Target month (October 15) doesn't get the spending prediction
    3. Wrong recurring pattern starts from wrong month
    
    Example: BTW kwartaal should have payment on October 15, 2025, then every 3 months after.
    """
    today = datetime.now().date()
    
    # Create a category similar to BTW kwartaal
    category = {
        "name": "BTW kwartaal",
        "balance": 0,
        "target": {
            "goal_type": "NEED",
            "goal_target": 8037640,  # €8037.64 (in milliunits)
            "goal_cadence": 1,  # Monthly base
            "goal_cadence_frequency": 3,  # Every 3 months
            "goal_target_month": "2025-10-15",  # October 15, 2025
            "goal_day": None,  # Use end of month
            "goal_overall_left": 0,  # Fully funded
            "goal_overall_funded": 8196610  # €8196.61 (in milliunits)
        }
    }
    
    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        0,  # current_balance
        8037.64,  # target_amount (in regular units)
        365,  # days_ahead
        0  # global_overall_left (in regular units) - fully funded
    )
    
    # Check current month - should have NO spending because goal_overall_left is 0
    current_month_end = today.replace(day=30 if today.month != 2 else 28)
    current_month_changes = [c for c in base_projection[current_month_end.isoformat()]["changes"] 
                           if c["category"] == "BTW kwartaal"]
    
    assert len(current_month_changes) == 0, f"Should not have spending in current month when fully funded, but found: {current_month_changes}"
    
    # Check October 15, 2025 - should have the target spending
    october_15_date = datetime(2025, 10, 15).date().isoformat()
    october_changes = [c for c in base_projection[october_15_date]["changes"] 
                      if c["category"] == "BTW kwartaal"]
    
    assert len(october_changes) == 1, f"Should have spending on October 15, 2025, but found: {october_changes}"
    # Since goal_overall_left is 0, it should use goal_overall_funded amount
    expected_amount = 8196.61  # goal_overall_funded converted to regular units
    assert abs(october_changes[0]["amount"] - (-expected_amount)) < 0.01, f"Should spend €{expected_amount} on October 15"
    
    # Check that no spending happens in January (wrong recurring pattern)
    january_31_date = datetime(2026, 1, 31).date().isoformat()
    january_changes = [c for c in base_projection[january_31_date]["changes"] 
                      if c["category"] == "BTW kwartaal"]
    
    assert len(january_changes) == 0, f"Should not have spending in January 2026, but found: {january_changes}"
    
    # Check that next quarterly payment is in January 15, 2026 (3 months after October 15)
    january_15_date = datetime(2026, 1, 15).date().isoformat()
    january_15_changes = [c for c in base_projection[january_15_date]["changes"] 
                         if c["category"] == "BTW kwartaal"]
    
    assert len(january_15_changes) == 1, "Should have next quarterly payment on January 15, 2026"
    assert abs(january_15_changes[0]["amount"] - (-8037.64)) < 0.01, "Should spend target amount €8037.64 in January"


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

    # Check first payment in target month
    first_payment_date = target_month.replace(day=15).isoformat()
    changes = [c for c in base_projection[first_payment_date]["changes"]
              if c["category"] == "Quarterly Insurance"]

    assert len(changes) == 1, f"Should have payment on {first_payment_date}, but found: {changes}"
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


def test_current_month_salary_prediction_without_balance(base_projection):
    """Test salary predictions for current month (without balance) and future month."""
    # Use current date for testing
    today = datetime.now().date()

    category = {
        "name": "Salery",
        "balance": 0,
        "target": {
            "goal_type": "NEED",
            "goal_target": 7348210,  # €7348.21 (in milliunits)
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": 4,
            "goal_target_month": None,
            "goal_overall_left": 7348210
        }
    }

    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        0,  # current_balance
        7348.21,  # target_amount (in regular units)
        60,  # days_ahead
        7348.21  # global_overall_left (in regular units)
    )

    # Check current month (4th day)
    current_month_date = today.replace(day=4).isoformat()
    current_month_changes = [c for c in base_projection[current_month_date]["changes"]
                  if c["category"] == "Salery"]
    assert len(current_month_changes) == 1, "Should have salary entry for current month 4th"
    assert current_month_changes[0]["amount"] == -7348.21, "Current month salary amount should be correct"
    assert current_month_changes[0]["reason"] == "Current Month Target", "Current month should be marked as Current Month Target"

    # Check next month (4th day)
    next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=4)
    next_month_date = next_month.isoformat()
    next_month_changes = [c for c in base_projection[next_month_date]["changes"]
                   if c["category"] == "Salery"]
    assert len(next_month_changes) == 1, "Should have salary entry for next month 4th"
    assert next_month_changes[0]["amount"] == -7348.21, "Next month salary amount should be correct"
    assert next_month_changes[0]["reason"] == "Future Month Target", "Next month should be marked as Future Month Target"


def test_current_month_salary_prediction_with_balance(base_projection):
    """Test salary predictions when there is a current balance."""
    # Use current date for testing
    today = datetime.now().date()

    category = {
        "name": "Salery",
        "balance": 3674105,  # Half of the target amount (in milliunits)
        "target": {
            "goal_type": "NEED",
            "goal_target": 7348210,  # €7348.21 (in milliunits)
            "goal_cadence": 1,
            "goal_cadence_frequency": 1,
            "goal_day": 4,
            "goal_target_month": None,
            "goal_overall_left": 7348210
        }
    }

    apply_need_category_spending(
        base_projection,
        category,
        category["target"],
        3674.105,  # current_balance (in regular units)
        7348.21,  # target_amount (in regular units)
        60,  # days_ahead
        7348.21  # global_overall_left (in regular units)
    )

    # Check current month (4th day)
    current_month_date = today.replace(day=4).isoformat()
    current_month_changes = [c for c in base_projection[current_month_date]["changes"]
                  if c["category"] == "Salery"]
    assert len(current_month_changes) == 1, "Should have salary entry for current month 4th"
    assert current_month_changes[0]["amount"] == -3674.105, "Current month salary should use current_balance"
    assert current_month_changes[0]["reason"] == "Current Month Balance", "Current month should use current balance"

    # Check next month (4th day)
    next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=4)
    next_month_date = next_month.isoformat()
    next_month_changes = [c for c in base_projection[next_month_date]["changes"]
                   if c["category"] == "Salery"]
    assert len(next_month_changes) == 1, "Should have salary entry for next month 4th"
    assert next_month_changes[0]["amount"] == -7348.21, "Next month salary should use full target amount"
    assert next_month_changes[0]["reason"] == "Future Month Target", "Next month should be marked as Future Month Target"
