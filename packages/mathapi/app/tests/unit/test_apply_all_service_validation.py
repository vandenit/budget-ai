#!/usr/bin/env python3
"""
Test script for apply_all_categories_service validation.
Tests the validation logic that skips "Ready to Assign" and "Uncategorized" categories.
"""

import unittest
from unittest.mock import patch, MagicMock
import logging

# Mock MongoDB dependencies before importing the modules
with patch('app.models.MongoClient'), patch('app.models.client'), patch('app.models.db'):
    # Import the service function we want to test
    from app.ynab_service import apply_all_categories_service

class TestApplyAllServiceValidation(unittest.TestCase):

    def setUp(self):
        """Set up test data"""
        self.test_budget_uuid = "test-budget-123"

        self.test_categories = [
            {"name": "Groceries", "uuid": "cat-groceries"},
            {"name": "Transportation", "uuid": "cat-transport"},
            {"name": "Uncategorized", "uuid": "cat-uncategorized"}
        ]

        self.test_original_transactions = [
            {
                "id": "tx-1",
                "payee_name": "Good Store",
                "amount": -25.50,
                "date": "2024-05-26",
                "memo": ""
            },
            {
                "id": "tx-2",
                "payee_name": "Bad Store",
                "amount": -15.00,
                "date": "2024-05-26",
                "memo": ""
            },
            {
                "id": "tx-3",
                "payee_name": "Another Store",
                "amount": -35.75,
                "date": "2024-05-26",
                "memo": ""
            }
        ]

    @patch('app.ynab_service.get_objectid_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.MongoPayeeMappingsManager')
    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.SimpleAISuggestionsService')
    def test_apply_all_skips_ready_to_assign(self, mock_cache_service, mock_fetch, mock_mappings,
                                           mock_get_categories, mock_get_transactions, mock_get_budget_id):
        """Test that apply_all_categories_service skips 'Ready to Assign' categories"""

        # Setup mocks
        mock_get_budget_id.return_value = "budget-id-123"
        mock_get_transactions.return_value = self.test_original_transactions
        mock_get_categories.return_value = self.test_categories

        mock_mappings_instance = MagicMock()
        mock_mappings.return_value = mock_mappings_instance

        mock_fetch.return_value = {"status": "success"}  # Successful YNAB update

        # Transactions with categories including "Ready to Assign"
        transactions_with_categories = [
            {
                "transaction_id": "tx-1",
                "suggested_category_name": "Groceries",
                "is_manual_change": False
            },
            {
                "transaction_id": "tx-2",
                "suggested_category_name": "Ready to Assign",  # Should be skipped
                "is_manual_change": False
            },
            {
                "transaction_id": "tx-3",
                "suggested_category_name": "Transportation",
                "is_manual_change": True
            }
        ]

        result = apply_all_categories_service(self.test_budget_uuid, transactions_with_categories)

        # Should only process tx-1 and tx-3, skip tx-2 with "Ready to Assign"
        self.assertEqual(len(result["updated_transactions"]), 2)
        self.assertEqual(len(result["failed_transactions"]), 0)

        # Verify the right transactions were processed
        updated_ids = [tx["transaction_id"] for tx in result["updated_transactions"]]
        self.assertIn("tx-1", updated_ids)
        self.assertIn("tx-3", updated_ids)
        self.assertNotIn("tx-2", updated_ids)

        # Verify YNAB fetch was called only 2 times (not 3)
        self.assertEqual(mock_fetch.call_count, 2)

    @patch('app.ynab_service.get_objectid_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.MongoPayeeMappingsManager')
    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.SimpleAISuggestionsService')
    def test_apply_all_skips_uncategorized(self, mock_cache_service, mock_fetch, mock_mappings,
                                         mock_get_categories, mock_get_transactions, mock_get_budget_id):
        """Test that apply_all_categories_service skips 'Uncategorized' categories"""

        # Setup mocks
        mock_get_budget_id.return_value = "budget-id-123"
        mock_get_transactions.return_value = self.test_original_transactions
        mock_get_categories.return_value = self.test_categories

        mock_mappings_instance = MagicMock()
        mock_mappings.return_value = mock_mappings_instance

        mock_fetch.return_value = {"status": "success"}

        # Transactions with categories including "Uncategorized"
        transactions_with_categories = [
            {
                "transaction_id": "tx-1",
                "suggested_category_name": "Groceries",
                "is_manual_change": False
            },
            {
                "transaction_id": "tx-2",
                "suggested_category_name": "Uncategorized",  # Should be skipped
                "is_manual_change": False
            }
        ]

        result = apply_all_categories_service(self.test_budget_uuid, transactions_with_categories)

        # Should only process tx-1, skip tx-2 with "Uncategorized"
        self.assertEqual(len(result["updated_transactions"]), 1)
        self.assertEqual(result["updated_transactions"][0]["transaction_id"], "tx-1")

        # Verify YNAB fetch was called only once
        self.assertEqual(mock_fetch.call_count, 1)

    @patch('app.ynab_service.get_objectid_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.MongoPayeeMappingsManager')
    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.SimpleAISuggestionsService')
    @patch('app.ynab_service.logging')
    def test_apply_all_logs_skipped_transactions(self, mock_logging, mock_cache_service, mock_fetch,
                                               mock_mappings, mock_get_categories, mock_get_transactions,
                                               mock_get_budget_id):
        """Test that skipped transactions are properly logged"""

        # Setup mocks
        mock_get_budget_id.return_value = "budget-id-123"
        mock_get_transactions.return_value = self.test_original_transactions
        mock_get_categories.return_value = self.test_categories

        mock_mappings_instance = MagicMock()
        mock_mappings.return_value = mock_mappings_instance

        transactions_with_categories = [
            {
                "transaction_id": "tx-1",
                "suggested_category_name": "Ready to Assign",
                "is_manual_change": False
            },
            {
                "transaction_id": "tx-2",
                "suggested_category_name": "Uncategorized",
                "is_manual_change": False
            }
        ]

        result = apply_all_categories_service(self.test_budget_uuid, transactions_with_categories)

        # Should skip both transactions
        self.assertEqual(len(result["updated_transactions"]), 0)

        # Verify logging was called for both skipped transactions
        mock_logging.info.assert_any_call(
            "Skipping transaction tx-1 - AI suggested 'Ready to Assign' (keeping uncategorized)"
        )
        mock_logging.info.assert_any_call(
            "Skipping transaction tx-2 - AI suggested 'Uncategorized' (keeping uncategorized)"
        )

    @patch('app.ynab_service.get_objectid_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.MongoPayeeMappingsManager')
    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.SimpleAISuggestionsService')
    def test_apply_all_learns_manual_changes(self, mock_cache_service, mock_fetch, mock_mappings,
                                           mock_get_categories, mock_get_transactions, mock_get_budget_id):
        """Test that manual changes are learned as payee mappings"""

        # Setup mocks
        mock_get_budget_id.return_value = "budget-id-123"
        mock_get_transactions.return_value = self.test_original_transactions
        mock_get_categories.return_value = self.test_categories

        mock_mappings_instance = MagicMock()
        mock_mappings.return_value = mock_mappings_instance

        mock_fetch.return_value = {"status": "success"}

        transactions_with_categories = [
            {
                "transaction_id": "tx-1",
                "suggested_category_name": "Groceries",
                "is_manual_change": True  # Manual change should be learned
            },
            {
                "transaction_id": "tx-2",
                "suggested_category_name": "Transportation",
                "is_manual_change": False  # AI suggestion, no learning
            }
        ]

        result = apply_all_categories_service(self.test_budget_uuid, transactions_with_categories)

        # Should learn from the manual change
        self.assertEqual(result["learned_mappings"], 1)

        # Verify mapping was added for the manual change
        mock_mappings_instance.add_mapping.assert_called_once_with("Good Store", "Groceries")

    @patch('app.ynab_service.get_objectid_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.MongoPayeeMappingsManager')
    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.SimpleAISuggestionsService')
    def test_apply_all_handles_invalid_category(self, mock_cache_service, mock_fetch, mock_mappings,
                                              mock_get_categories, mock_get_transactions, mock_get_budget_id):
        """Test that invalid categories are handled properly"""

        # Setup mocks
        mock_get_budget_id.return_value = "budget-id-123"
        mock_get_transactions.return_value = self.test_original_transactions
        mock_get_categories.return_value = self.test_categories

        mock_mappings_instance = MagicMock()
        mock_mappings.return_value = mock_mappings_instance

        transactions_with_categories = [
            {
                "transaction_id": "tx-1",
                "suggested_category_name": "Nonexistent Category",  # Invalid category
                "is_manual_change": False
            }
        ]

        result = apply_all_categories_service(self.test_budget_uuid, transactions_with_categories)

        # Should fail gracefully
        self.assertEqual(len(result["updated_transactions"]), 0)
        self.assertEqual(len(result["failed_transactions"]), 1)
        self.assertEqual(result["failed_transactions"][0]["transaction_id"], "tx-1")
        self.assertIn("not found", result["failed_transactions"][0]["error"])


def test_apply_all_service_validation():
    """Test runner function"""
    print('🛡️ Test Apply All Service Validation')
    print('=' * 50)

    # Run the unit tests
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestApplyAllServiceValidation)
    runner = unittest.TextTestRunner(verbosity=2)

    print('\n🧪 Running service validation tests...\n')
    result = runner.run(suite)

    if result.wasSuccessful():
        print('\n✅ All apply-all service validation tests passed!')
    else:
        print(f'\n❌ {len(result.failures)} failures, {len(result.errors)} errors')

        if result.failures:
            print('\n💥 Failures:')
            for test, traceback in result.failures:
                print(f"  {test}: {traceback}")

        if result.errors:
            print('\n🚨 Errors:')
            for test, traceback in result.errors:
                print(f"  {test}: {traceback}")

    return result.wasSuccessful()


if __name__ == "__main__":
    test_apply_all_service_validation()