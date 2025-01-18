import unittest
from datetime import datetime, date
from unittest.mock import patch
import json
import os
from app.prediction_api import projected_balances_for_budget

class TestPredictionApi(unittest.TestCase):
    def setUp(self):
        # Load test fixtures
        fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
        
        with open(os.path.join(fixtures_dir, 'input_data.json'), 'r') as f:
            self.input_data = json.load(f)
            
        with open(os.path.join(fixtures_dir, 'expected_output.json'), 'r') as f:
            self.expected_output = json.load(f)

    @patch('app.prediction_api.get_scheduled_transactions')
    @patch('app.prediction_api.get_categories_for_budget')
    @patch('app.prediction_api.get_accounts_for_budget')
    def test_projected_balances(self, mock_accounts, mock_categories, mock_transactions):
        # Set up our mocks to return the fixture data
        mock_transactions.return_value = self.input_data['scheduled_transactions']
        mock_categories.return_value = self.input_data['categories']
        mock_accounts.return_value = self.input_data['accounts']

        # Call the function we want to test
        result = projected_balances_for_budget(
            budget_uuid="test-uuid",
            days_ahead=365
        )

        # Convert result to dict for easier comparison
        result_dict = {k: v for k, v in result.items() if k in self.expected_output}

        # Compare only the specific dates we care about
        for date_str, expected_data in self.expected_output.items():
            self.assertIn(date_str, result_dict, f"Missing expected date {date_str} in results")
            
            actual_data = result_dict[date_str]
            
            # Compare balances (with small float tolerance)
            self.assertAlmostEqual(
                actual_data['balance'],
                expected_data['balance'],
                places=2,
                msg=f"Balance mismatch for {date_str}"
            )
            
            self.assertAlmostEqual(
                actual_data['balance_diff'],
                expected_data['balance_diff'],
                places=2,
                msg=f"Balance diff mismatch for {date_str}"
            )

            # Compare changes
            actual_changes = sorted(actual_data['changes'], key=lambda x: (x['category'], x['amount']))
            expected_changes = sorted(expected_data['changes'], key=lambda x: (x['category'], x['amount']))

            self.assertEqual(
                len(actual_changes),
                len(expected_changes),
                f"Number of changes mismatch for {date_str}"
            )

            for actual, expected in zip(actual_changes, expected_changes):
                self.assertEqual(actual['category'], expected['category'])
                self.assertEqual(actual['reason'], expected['reason'])
                self.assertAlmostEqual(actual['amount'], expected['amount'], places=2)

    def test_record_new_fixtures(self):
        """
        This test is used to record new fixtures. Only run this when you want to update the fixtures!
        Set RECORD_FIXTURES=1 environment variable to run this test.
        """
        if not os.getenv('RECORD_FIXTURES'):
            self.skipTest('Skipping fixture recording. Set RECORD_FIXTURES=1 to record new fixtures.')

        # Get the actual responses from the real APIs
        from app.ynab_api import get_scheduled_transactions
        from app.categories_api import get_categories_for_budget
        from app.accounts_api import get_accounts_for_budget
        from app.budget_api import get_objectid_for_budget

        budget_uuid = "1b443ebf-ea07-4ab7-8fd5-9330bf80608c"  # Use your test budget UUID
        budget_id = get_objectid_for_budget(budget_uuid)

        # Record the API responses
        input_data = {
            "scheduled_transactions": get_scheduled_transactions(budget_uuid),
            "categories": get_categories_for_budget(budget_id),
            "accounts": get_accounts_for_budget(budget_id)
        }

        # Get the actual projection output
        output_data = projected_balances_for_budget(budget_uuid, days_ahead=365)

        # Save the fixtures
        fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
        os.makedirs(fixtures_dir, exist_ok=True)

        with open(os.path.join(fixtures_dir, 'input_data.json'), 'w') as f:
            json.dump(input_data, f, indent=4)

        with open(os.path.join(fixtures_dir, 'expected_output.json'), 'w') as f:
            json.dump(output_data, f, indent=4)

if __name__ == '__main__':
    unittest.main() 