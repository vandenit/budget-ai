import pytest
import unittest
from unittest.mock import patch, Mock, MagicMock
import json

from app.ynab_service import (
    apply_suggested_categories_batch_service,
    suggest_categories_only_batch_service,
    start_batch_categorization_job,
    check_batch_job_status,
    apply_batch_results_to_ynab
)


class TestBatchService(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures."""
        self.budget_uuid = "test-budget-uuid"
        self.budget_id = "test-budget-id"
        
        self.sample_transactions = [
            {
                "id": "txn-1",
                "payee_name": "Supermarket ABC",
                "amount": -2500,
                "date": "2024-01-15",
                "memo": "Weekly groceries"
            },
            {
                "id": "txn-2", 
                "payee_name": "Gas Station XYZ",
                "amount": -4500,
                "date": "2024-01-16",
                "memo": ""
            }
        ]
        
        self.sample_categories = [
            {"name": "Groceries", "uuid": "cat-1"},
            {"name": "Transportation", "uuid": "cat-2"},
            {"name": "Dining Out", "uuid": "cat-3"}
        ]
        
        self.category_suggestions = {
            "txn-1": "Groceries",
            "txn-2": "Transportation"
        }

    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.suggest_categories_batch')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_apply_suggested_categories_batch_service_success(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories, 
        mock_suggest_batch, mock_fetch
    ):
        """Test successful batch categorization and application."""
        # Setup mocks
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = self.sample_transactions
        mock_get_categories.return_value = self.sample_categories
        mock_suggest_batch.return_value = self.category_suggestions
        mock_fetch.return_value = {"success": True}  # Mock successful YNAB update
        
        result = apply_suggested_categories_batch_service(self.budget_uuid)
        
        # Verify the result structure
        self.assertIn("updated_transactions", result)
        self.assertIn("failed_transactions", result)
        self.assertIn("total_processed", result)
        self.assertIn("total_updated", result)
        self.assertIn("total_failed", result)
        
        # Verify 2 transactions were processed
        self.assertEqual(result["total_processed"], 2)
        self.assertEqual(result["total_updated"], 2)
        self.assertEqual(result["total_failed"], 0)
        
        # Verify fetch was called for each transaction
        self.assertEqual(mock_fetch.call_count, 2)
        
        # Verify the first transaction update
        updated_txn = result["updated_transactions"][0]
        self.assertEqual(updated_txn["transaction_id"], "txn-1")
        self.assertEqual(updated_txn["suggested_category"], "Groceries")
        self.assertIn("AI batch suggested", updated_txn["memo"])

    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_apply_suggested_categories_batch_service_no_transactions(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories
    ):
        """Test batch service when no uncategorized transactions exist."""
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = []
        mock_get_categories.return_value = self.sample_categories
        
        result = apply_suggested_categories_batch_service(self.budget_uuid)
        
        self.assertEqual(result["message"], "No uncategorized transactions found")

    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.suggest_categories_batch')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_apply_suggested_categories_batch_service_with_failures(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories, 
        mock_suggest_batch, mock_fetch
    ):
        """Test batch service with some failed updates."""
        # Setup mocks
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = self.sample_transactions
        mock_get_categories.return_value = self.sample_categories
        mock_suggest_batch.return_value = {
            "txn-1": "Groceries",
            "txn-2": "NonExistentCategory"  # This will cause a failure
        }
        mock_fetch.return_value = {"success": True}
        
        result = apply_suggested_categories_batch_service(self.budget_uuid)
        
        # Verify mixed results
        self.assertEqual(result["total_processed"], 2)
        self.assertEqual(result["total_updated"], 1)  # Only one should succeed
        self.assertEqual(result["total_failed"], 1)   # One should fail
        
        # Check the failed transaction
        failed_txn = result["failed_transactions"][0]
        self.assertEqual(failed_txn["transaction_id"], "txn-2")
        self.assertIn("NonExistentCategory", failed_txn["error"])

    @patch('app.ynab_service.suggest_categories_batch')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_suggest_categories_only_batch_service(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories, mock_suggest_batch
    ):
        """Test suggestion-only batch service (no updates to YNAB)."""
        # Setup mocks
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = self.sample_transactions
        mock_get_categories.return_value = self.sample_categories
        mock_suggest_batch.return_value = self.category_suggestions
        
        result = suggest_categories_only_batch_service(self.budget_uuid)
        
        # Verify the result structure
        self.assertIn("suggested_transactions", result)
        self.assertIn("total_processed", result)
        
        # Verify 2 transactions were processed
        self.assertEqual(result["total_processed"], 2)
        self.assertEqual(len(result["suggested_transactions"]), 2)
        
        # Check first suggestion
        suggestion = result["suggested_transactions"][0]
        self.assertEqual(suggestion["transaction_id"], "txn-1")
        self.assertEqual(suggestion["payee_name"], "Supermarket ABC")
        self.assertEqual(suggestion["suggested_category_name"], "Groceries")

    @patch('app.ynab_service.suggest_categories_batch_async')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_start_batch_categorization_job(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories, mock_suggest_async
    ):
        """Test starting an asynchronous batch categorization job."""
        # Setup mocks
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = self.sample_transactions
        mock_get_categories.return_value = self.sample_categories
        mock_suggest_async.return_value = "batch-123"
        
        result = start_batch_categorization_job(self.budget_uuid)
        
        # Verify the result
        self.assertEqual(result["batch_id"], "batch-123")
        self.assertEqual(result["total_transactions"], 2)
        self.assertIn("Batch job started", result["message"])

    @patch('app.ynab_service.suggest_categories_batch_async')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_start_batch_categorization_job_failure(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories, mock_suggest_async
    ):
        """Test starting batch job when async submission fails."""
        # Setup mocks
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = self.sample_transactions
        mock_get_categories.return_value = self.sample_categories
        mock_suggest_async.return_value = None  # Simulate failure
        
        result = start_batch_categorization_job(self.budget_uuid)
        
        # Verify the error result
        self.assertIn("error", result)
        self.assertIsNone(result["batch_id"])

    @patch('app.ynab_service.get_batch_status_and_results')
    def test_check_batch_job_status_completed(self, mock_get_status):
        """Test checking batch job status when completed."""
        mock_get_status.return_value = ("completed", ["result1", "result2"], None)
        
        result = check_batch_job_status("batch-123")
        
        self.assertEqual(result["batch_id"], "batch-123")
        self.assertEqual(result["status"], "completed")
        self.assertTrue(result["has_results"])
        self.assertIsNone(result["error_message"])

    @patch('app.ynab_service.get_batch_status_and_results')
    def test_check_batch_job_status_in_progress(self, mock_get_status):
        """Test checking batch job status when still in progress."""
        mock_get_status.return_value = ("in_progress", None, None)
        
        result = check_batch_job_status("batch-123")
        
        self.assertEqual(result["status"], "in_progress")
        self.assertFalse(result["has_results"])

    @patch('app.ynab_service.fetch')
    @patch('app.ynab_service.parse_category_suggestions')
    @patch('app.ynab_service.get_batch_status_and_results')
    @patch('app.ynab_service.get_categories_for_budget')
    @patch('app.ynab_service.get_uncategorized_transactions')
    @patch('app.ynab_service.get_objectid_for_budget')
    def test_apply_batch_results_to_ynab_success(
        self, mock_get_budget_id, mock_get_transactions, mock_get_categories,
        mock_get_status, mock_parse_suggestions, mock_fetch
    ):
        """Test applying completed batch results to YNAB transactions."""
        # Setup mocks
        mock_get_budget_id.return_value = self.budget_id
        mock_get_transactions.return_value = self.sample_transactions
        mock_get_categories.return_value = self.sample_categories
        mock_get_status.return_value = ("completed", ["batch_result1", "batch_result2"], None)
        mock_parse_suggestions.return_value = self.category_suggestions
        mock_fetch.return_value = {"success": True}
        
        result = apply_batch_results_to_ynab(self.budget_uuid, "batch-123")
        
        # Verify successful application
        self.assertEqual(result["batch_id"], "batch-123")
        self.assertEqual(result["total_updated"], 2)
        self.assertEqual(result["total_failed"], 0)
        
        # Verify transactions were updated
        updated_txn = result["updated_transactions"][0]
        self.assertEqual(updated_txn["transaction_id"], "txn-1")
        self.assertEqual(updated_txn["suggested_category"], "Groceries")
        self.assertIn("AI batch applied", updated_txn["memo"])

    @patch('app.ynab_service.get_batch_status_and_results')
    def test_apply_batch_results_to_ynab_not_completed(self, mock_get_status):
        """Test applying batch results when job is not completed."""
        mock_get_status.return_value = ("in_progress", None, None)
        
        result = apply_batch_results_to_ynab(self.budget_uuid, "batch-123")
        
        # Should return error for non-completed job
        self.assertIn("error", result)
        self.assertIn("not completed", result["error"])
        self.assertEqual(result["status"], "in_progress")

    @patch('app.ynab_service.get_batch_status_and_results')
    def test_apply_batch_results_to_ynab_no_results(self, mock_get_status):
        """Test applying batch results when no results are available."""
        mock_get_status.return_value = ("completed", None, None)
        
        result = apply_batch_results_to_ynab(self.budget_uuid, "batch-123")
        
        # Should return error for missing results
        self.assertIn("error", result)
        self.assertIn("No results available", result["error"])

    def test_memo_handling(self):
        """Test that memos are properly handled for different batch operations."""
        # Test with existing memo
        transaction_with_memo = {
            "id": "txn-1",
            "payee_name": "Test",
            "amount": -1000,
            "date": "2024-01-01",
            "memo": "Existing memo"
        }
        
        # Test memo concatenation logic
        existing_memo = transaction_with_memo.get("memo") or ""
        updated_memo_batch = f"{existing_memo} AI batch suggested".strip()
        updated_memo_applied = f"{existing_memo} AI batch applied".strip()
        
        self.assertEqual(updated_memo_batch, "Existing memo AI batch suggested")
        self.assertEqual(updated_memo_applied, "Existing memo AI batch applied")
        
        # Test with empty memo
        transaction_without_memo = {
            "id": "txn-2",
            "payee_name": "Test",
            "amount": -1000,
            "date": "2024-01-01",
            "memo": ""
        }
        
        empty_memo = transaction_without_memo.get("memo") or ""
        updated_memo_empty = f"{empty_memo} AI batch suggested".strip()
        
        self.assertEqual(updated_memo_empty, "AI batch suggested")


if __name__ == '__main__':
    unittest.main() 