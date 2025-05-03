import unittest
from datetime import datetime, date
from unittest.mock import patch
import json
import os
from dotenv import load_dotenv
from app.prediction_api import projected_balances_for_budget
from app.tests.encryption_helper import EncryptionHelper

class TestFixturesPredictionApi(unittest.TestCase):
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

        # Just check that we got a non-empty result with the expected structure
        self.assertTrue(len(result) > 0, "Result should not be empty")
        
        # Check a few sample dates to verify structure
        for date_str, data in list(result.items())[:5]:
            self.assertIn('balance', data, "Each date should have a balance")
            self.assertIn('balance_diff', data, "Each date should have a balance_diff")
            self.assertIn('changes', data, "Each date should have changes")
            self.assertTrue(isinstance(data['changes'], list), "Changes should be a list")
            
            # Check each change has required fields
            for change in data['changes']:
                self.assertIn('reason', change, "Each change should have a reason")
                self.assertIn('amount', change, "Each change should have an amount")
                self.assertIn('category', change, "Each change should have a category")

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

if __name__ == '__main__':
    unittest.main() 