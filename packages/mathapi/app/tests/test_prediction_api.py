import unittest
from datetime import datetime, date
from unittest.mock import patch
import json
import os
from dotenv import load_dotenv
from app.prediction_api import projected_balances_for_budget
from app.tests.encryption_helper import EncryptionHelper

class TestPredictionApi(unittest.TestCase):
    def setUp(self):
        # Load environment variables
        load_dotenv()
        
        # Initialize encryption helper
        self.encryption_helper = EncryptionHelper()
        
        # Load test fixtures
        fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
        
        with open(os.path.join(fixtures_dir, 'input_data.json'), 'r') as f:
            self.input_data = json.load(f)
            
        with open(os.path.join(fixtures_dir, 'expected_output.json'), 'r') as f:
            self.expected_output = json.load(f)

        # Mock the current date to match the fixture generation date if it exists
        if 'generation_date' in self.input_data:
            self.generation_date = datetime.fromisoformat(self.input_data['generation_date'])
            self.date_patcher = patch('app.prediction_api.datetime')
            mock_datetime = self.date_patcher.start()
            mock_datetime.now.return_value = self.generation_date
            mock_datetime.strptime.side_effect = datetime.strptime
            mock_datetime.fromisoformat.side_effect = datetime.fromisoformat
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)

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
            actual_changes = sorted(actual_data['changes'], key=lambda x: (x['amount']))
            expected_changes = sorted(expected_data['changes'], key=lambda x: (x['amount']))

            self.assertEqual(
                len(actual_changes),
                len(expected_changes),
                f"Number of changes mismatch for {date_str}"
            )

            for actual, expected in zip(actual_changes, expected_changes):
                # Compare amounts and reasons, but not categories since they're encrypted
                self.assertAlmostEqual(
                    actual['amount'], 
                    expected['amount'], 
                    places=2,
                    msg=f"\nDate: {date_str}\nExpected amount: {expected['amount']}\nActual amount: {actual['amount']}\nReason: {actual['reason']}"
                )
                self.assertEqual(
                    actual['reason'],
                    expected['reason'],
                    f"\nDate: {date_str}\nExpected reason: {expected['reason']}\nActual reason: {actual['reason']}"
                )

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

        # Record the API responses and generation date
        input_data = {
            "scheduled_transactions": get_scheduled_transactions(budget_uuid),
            "categories": get_categories_for_budget(budget_id),
            "accounts": get_accounts_for_budget(budget_id),
            "generation_date": datetime.now().isoformat()
        }

        # Encrypt sensitive data in input
        encrypted_input = self.encryption_helper.encrypt_sensitive_data(input_data)

        # Get the actual projection output
        output_data = projected_balances_for_budget(budget_uuid, days_ahead=365)

        # Encrypt sensitive data in output
        encrypted_output = {}
        for date_str, date_data in output_data.items():
            encrypted_date_data = date_data.copy()
            encrypted_changes = []
            
            for change in date_data['changes']:
                encrypted_change = change.copy()
                if 'category' in encrypted_change:
                    encrypted_change['category'] = self.encryption_helper.encrypt_value(encrypted_change['category'])
                if 'account' in encrypted_change:
                    encrypted_change['account'] = self.encryption_helper.encrypt_value(encrypted_change['account'])
                if 'payee' in encrypted_change and encrypted_change['payee']:
                    encrypted_change['payee'] = self.encryption_helper.encrypt_value(encrypted_change['payee'])
                encrypted_changes.append(encrypted_change)
            
            encrypted_date_data['changes'] = encrypted_changes
            encrypted_output[date_str] = encrypted_date_data

        # Save the fixtures
        fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
        os.makedirs(fixtures_dir, exist_ok=True)

        with open(os.path.join(fixtures_dir, 'input_data.json'), 'w') as f:
            json.dump(encrypted_input, f, indent=4)

        with open(os.path.join(fixtures_dir, 'expected_output.json'), 'w') as f:
            json.dump(encrypted_output, f, indent=4)

    def test_date_mocking(self):
        """Test of de datum correct wordt gemockt naar de generatie datum van de fixtures"""
        from app.prediction_api import datetime as prediction_datetime
        
        # Controleer of we een generation_date hebben
        self.assertIn('generation_date', self.input_data, "Geen generation_date gevonden in fixtures")
        
        # Controleer of de huidige datum in prediction_api overeenkomt met de fixture datum
        current_date = prediction_datetime.now()
        self.assertEqual(
            current_date,
            self.generation_date,
            f"Datum mock werkt niet correct. Verwacht: {self.generation_date}, Kreeg: {current_date}"
        )

        # Test strptime
        test_date = "2025-01-01"
        parsed_date = prediction_datetime.strptime(test_date, "%Y-%m-%d")
        self.assertEqual(
            parsed_date,
            datetime.strptime(test_date, "%Y-%m-%d"),
            "strptime mock werkt niet correct"
        )

        # Test fromisoformat
        test_iso = "2025-01-01T12:00:00"
        parsed_iso = prediction_datetime.fromisoformat(test_iso)
        self.assertEqual(
            parsed_iso,
            datetime.fromisoformat(test_iso),
            "fromisoformat mock werkt niet correct"
        )

    def tearDown(self):
        # Stop the datetime mock if it exists
        if hasattr(self, 'date_patcher'):
            self.date_patcher.stop()

if __name__ == '__main__':
    unittest.main() 