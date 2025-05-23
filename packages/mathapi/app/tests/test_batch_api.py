import pytest
import unittest
from unittest.mock import patch, Mock, MagicMock
import json
from io import BytesIO
from datetime import datetime

from app.ai_api import (
    create_batch_tasks_for_categories,
    submit_batch_job,
    check_batch_status,
    wait_for_batch_completion,
    retrieve_batch_results,
    parse_category_suggestions,
    suggest_categories_batch,
    suggest_categories_batch_async,
    get_batch_status_and_results,
    cancel_batch_job
)


class TestBatchAPI(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures."""
        self.sample_transactions = [
            {
                "id": "txn-1",
                "payee_name": "Supermarket ABC",
                "amount": -2500,
                "date": "2024-01-15"
            },
            {
                "id": "txn-2", 
                "payee_name": "Gas Station XYZ",
                "amount": -4500,
                "date": "2024-01-16"
            }
        ]
        
        self.sample_categories = [
            {"name": "Groceries", "uuid": "cat-1"},
            {"name": "Transportation", "uuid": "cat-2"},
            {"name": "Dining Out", "uuid": "cat-3"}
        ]
        
        self.sample_batch_results = [
            {
                "custom_id": "transaction-txn-1-0",
                "response": {
                    "body": {
                        "choices": [
                            {
                                "message": {
                                    "content": "Groceries"
                                }
                            }
                        ]
                    }
                }
            },
            {
                "custom_id": "transaction-txn-2-1",
                "response": {
                    "body": {
                        "choices": [
                            {
                                "message": {
                                    "content": "Transportation"
                                }
                            }
                        ]
                    }
                }
            }
        ]

    def test_create_batch_tasks_for_categories(self):
        """Test creation of batch tasks from transactions and categories."""
        tasks = create_batch_tasks_for_categories(self.sample_transactions, self.sample_categories)
        
        # Should create 2 tasks for 2 transactions
        self.assertEqual(len(tasks), 2)
        
        # Check structure of first task
        task1 = tasks[0]
        self.assertEqual(task1["custom_id"], "transaction-txn-1-0")
        self.assertEqual(task1["method"], "POST")
        self.assertEqual(task1["url"], "/v1/chat/completions")
        self.assertIn("body", task1)
        self.assertEqual(task1["body"]["model"], "gpt-4o-mini")
        self.assertIn("messages", task1["body"])
        
        # Check that prompt contains transaction details
        prompt = task1["body"]["messages"][0]["content"]
        self.assertIn("Supermarket ABC", prompt)
        self.assertIn("-2500", prompt)
        self.assertIn("2024-01-15", prompt)
        self.assertIn("Groceries, Transportation, Dining Out", prompt)

    def test_create_batch_tasks_empty_transactions(self):
        """Test batch task creation with empty transactions list."""
        tasks = create_batch_tasks_for_categories([], self.sample_categories)
        self.assertEqual(len(tasks), 0)

    @patch('app.ai_api.client')
    def test_submit_batch_job_success(self, mock_client):
        """Test successful batch job submission."""
        # Mock OpenAI client responses
        mock_file = Mock()
        mock_file.id = "file-123"
        mock_client.files.create.return_value = mock_file
        
        mock_batch = Mock()
        mock_batch.id = "batch-456"
        mock_client.batches.create.return_value = mock_batch
        
        tasks = create_batch_tasks_for_categories(self.sample_transactions, self.sample_categories)
        result = submit_batch_job(tasks, "Test batch job")
        
        # Verify batch job was created
        self.assertEqual(result.id, "batch-456")
        
        # Verify file.create was called with BytesIO object
        mock_client.files.create.assert_called_once()
        call_args = mock_client.files.create.call_args
        self.assertEqual(call_args[1]["purpose"], "batch")
        
        # Verify the file object is BytesIO
        file_obj = call_args[1]["file"]
        self.assertIsInstance(file_obj, BytesIO)
        self.assertTrue(hasattr(file_obj, 'name'))
        self.assertTrue(file_obj.name.endswith('.jsonl'))

    @patch('app.ai_api.client')
    def test_submit_batch_job_failure(self, mock_client):
        """Test batch job submission failure."""
        # Mock OpenAI client to raise exception
        mock_client.files.create.side_effect = Exception("API Error")
        
        tasks = create_batch_tasks_for_categories(self.sample_transactions, self.sample_categories)
        result = submit_batch_job(tasks, "Test batch job")
        
        # Should return None on failure
        self.assertIsNone(result)

    @patch('app.ai_api.client')
    def test_check_batch_status(self, mock_client):
        """Test checking batch job status."""
        mock_batch = Mock()
        mock_batch.status = "completed"
        mock_client.batches.retrieve.return_value = mock_batch
        
        result = check_batch_status("batch-123")
        
        self.assertEqual(result.status, "completed")
        mock_client.batches.retrieve.assert_called_once_with("batch-123")

    @patch('app.ai_api.client')
    def test_wait_for_batch_completion_success(self, mock_client):
        """Test waiting for batch completion when job completes."""
        # Mock batch status progression
        mock_batch_in_progress = Mock()
        mock_batch_in_progress.status = "in_progress"
        
        mock_batch_completed = Mock()
        mock_batch_completed.status = "completed"
        
        # Return in_progress first, then completed
        mock_client.batches.retrieve.side_effect = [mock_batch_in_progress, mock_batch_completed]
        
        with patch('time.sleep'):  # Mock sleep to speed up test
            result = wait_for_batch_completion("batch-123", max_wait_time=60)
        
        self.assertEqual(result.status, "completed")

    @patch('app.ai_api.client')
    def test_wait_for_batch_completion_timeout(self, mock_client):
        """Test waiting for batch completion with timeout."""
        mock_batch = Mock()
        mock_batch.status = "in_progress"
        mock_client.batches.retrieve.return_value = mock_batch
        
        with patch('time.sleep'):
            with patch('time.time', side_effect=[0, 61]):  # Simulate timeout
                result = wait_for_batch_completion("batch-123", max_wait_time=60)
        
        self.assertIsNone(result)

    @patch('app.ai_api.client')
    def test_retrieve_batch_results_success(self, mock_client):
        """Test successful batch results retrieval."""
        # Mock batch job with output file
        mock_batch = Mock()
        mock_batch.output_file_id = "output-file-123"
        
        # Mock file content response
        mock_content = Mock()
        jsonl_data = '\n'.join([json.dumps(result) for result in self.sample_batch_results])
        mock_content.content = jsonl_data.encode('utf-8')
        mock_client.files.content.return_value = mock_content
        
        results = retrieve_batch_results(mock_batch)
        
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["custom_id"], "transaction-txn-1-0")
        self.assertEqual(results[1]["custom_id"], "transaction-txn-2-1")

    @patch('app.ai_api.client')
    def test_retrieve_batch_results_no_output_file(self, mock_client):
        """Test batch results retrieval when no output file exists."""
        mock_batch = Mock()
        mock_batch.output_file_id = None
        
        results = retrieve_batch_results(mock_batch)
        
        self.assertEqual(results, [])

    def test_parse_category_suggestions(self):
        """Test parsing batch results into category suggestions."""
        suggestions = parse_category_suggestions(self.sample_batch_results, self.sample_transactions)
        
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions["txn-1"], "Groceries")
        self.assertEqual(suggestions["txn-2"], "Transportation")

    def test_parse_category_suggestions_with_errors(self):
        """Test parsing batch results with malformed data."""
        malformed_results = [
            {
                "custom_id": "transaction-txn-1-0",
                "response": {
                    "body": {
                        "choices": [
                            {
                                "message": {
                                    "content": "Groceries"
                                }
                            }
                        ]
                    }
                }
            },
            {
                "custom_id": "transaction-txn-2-1",  # Valid ID format
                # Missing response field - this will result in None value
            }
        ]
        
        suggestions = parse_category_suggestions(malformed_results, self.sample_transactions)
        
        # Should parse both, but one will be None
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions["txn-1"], "Groceries")
        self.assertIsNone(suggestions["txn-2"])  # This one should be None due to missing response

    @patch('app.ai_api.wait_for_batch_completion')
    @patch('app.ai_api.submit_batch_job')
    @patch('app.ai_api.retrieve_batch_results')
    @patch('app.ai_api.parse_category_suggestions')
    def test_suggest_categories_batch_success(self, mock_parse, mock_retrieve, mock_submit, mock_wait):
        """Test end-to-end batch category suggestion."""
        # Mock the pipeline
        mock_batch = Mock()
        mock_batch.id = "batch-123"
        mock_batch.status = "completed"
        mock_submit.return_value = mock_batch
        mock_wait.return_value = mock_batch
        mock_retrieve.return_value = self.sample_batch_results
        mock_parse.return_value = {"txn-1": "Groceries", "txn-2": "Transportation"}
        
        result = suggest_categories_batch(self.sample_transactions, self.sample_categories)
        
        self.assertEqual(result["txn-1"], "Groceries")
        self.assertEqual(result["txn-2"], "Transportation")

    @patch('app.ai_api.submit_batch_job')
    def test_suggest_categories_batch_async(self, mock_submit):
        """Test asynchronous batch category suggestion."""
        mock_batch = Mock()
        mock_batch.id = "batch-123"
        mock_submit.return_value = mock_batch
        
        batch_id = suggest_categories_batch_async(self.sample_transactions, self.sample_categories)
        
        self.assertEqual(batch_id, "batch-123")

    @patch('app.ai_api.client')
    def test_get_batch_status_and_results_completed(self, mock_client):
        """Test getting batch status when completed."""
        mock_batch = Mock()
        mock_batch.status = "completed"
        mock_batch.output_file_id = "output-123"
        mock_client.batches.retrieve.return_value = mock_batch
        
        # Mock file content
        mock_content = Mock()
        jsonl_data = json.dumps(self.sample_batch_results[0])
        mock_content.content = jsonl_data.encode('utf-8')
        mock_client.files.content.return_value = mock_content
        
        status, results, error = get_batch_status_and_results("batch-123")
        
        self.assertEqual(status, "completed")
        self.assertIsNotNone(results)
        self.assertIsNone(error)

    @patch('app.ai_api.client')
    def test_get_batch_status_and_results_in_progress(self, mock_client):
        """Test getting batch status when still in progress."""
        mock_batch = Mock()
        mock_batch.status = "in_progress"
        mock_client.batches.retrieve.return_value = mock_batch
        
        status, results, error = get_batch_status_and_results("batch-123")
        
        self.assertEqual(status, "in_progress")
        self.assertIsNone(results)
        self.assertIsNone(error)

    @patch('app.ai_api.client')
    def test_cancel_batch_job(self, mock_client):
        """Test cancelling a batch job."""
        mock_batch = Mock()
        mock_batch.status = "cancelled"
        mock_client.batches.cancel.return_value = mock_batch
        
        result = cancel_batch_job("batch-123")
        
        self.assertEqual(result.status, "cancelled")
        mock_client.batches.cancel.assert_called_once_with("batch-123")

    def test_bytesio_file_handling(self):
        """Test that BytesIO objects are properly handled."""
        tasks = create_batch_tasks_for_categories(self.sample_transactions, self.sample_categories)
        
        # Create JSONL content manually to test
        jsonl_content = ""
        for task in tasks:
            jsonl_content += json.dumps(task) + '\n'
        
        jsonl_bytes = jsonl_content.encode('utf-8')
        file_obj = BytesIO(jsonl_bytes)
        file_obj.name = "test_batch.jsonl"
        
        # Test reading back the content
        file_obj.seek(0)
        content = file_obj.read().decode('utf-8')
        lines = content.strip().split('\n')
        
        self.assertEqual(len(lines), 2)
        
        # Parse first line back to JSON
        task_data = json.loads(lines[0])
        self.assertEqual(task_data["custom_id"], "transaction-txn-1-0")
        
        file_obj.close()


if __name__ == '__main__':
    unittest.main() 