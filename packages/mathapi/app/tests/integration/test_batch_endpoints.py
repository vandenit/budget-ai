import pytest
import unittest
from unittest.mock import patch, Mock
import json

from app.app import app


class TestBatchEndpoints(unittest.TestCase):
    
    def setUp(self):
        """Set up test client."""
        self.app = app.test_client()
        self.app.testing = True
        
        self.budget_uuid = "test-budget-uuid"
        
        self.sample_batch_response = {
            "updated_transactions": [
                {
                    "transaction_id": "txn-1",
                    "status": "updated",
                    "suggested_category": "Groceries",
                    "memo": "Weekly groceries AI batch suggested"
                }
            ],
            "failed_transactions": [],
            "total_processed": 1,
            "total_updated": 1,
            "total_failed": 0
        }
        
        self.sample_suggestions_response = {
            "suggested_transactions": [
                {
                    "transaction_id": "txn-1",
                    "payee_name": "Supermarket ABC",
                    "amount": -2500,
                    "date": "2024-01-15",
                    "suggested_category_name": "Groceries"
                }
            ],
            "total_processed": 1
        }

    def test_suggest_categories_batch_endpoint_success(self):
        """Test GET /uncategorised-transactions/suggest-categories-batch endpoint."""
        with patch('app.app.suggest_categories_only_batch_service') as mock_service:
            mock_service.return_value = self.sample_suggestions_response
            
            response = self.app.get(f'/uncategorised-transactions/suggest-categories-batch?budget_id={self.budget_uuid}')
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data["total_processed"], 1)
            self.assertIn("suggested_transactions", data)

    def test_suggest_categories_batch_endpoint_missing_budget_id(self):
        """Test endpoint without budget_id parameter."""
        response = self.app.get('/uncategorised-transactions/suggest-categories-batch')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("budget_id query parameter is required", data["error"])

    @patch('app.app.suggest_categories_only_batch_service')
    def test_suggest_categories_batch_endpoint_error(self, mock_service):
        """Test endpoint when service raises an exception."""
        mock_service.side_effect = Exception("Service error")
        
        response = self.app.get(f'/uncategorised-transactions/suggest-categories-batch?budget_id={self.budget_uuid}')
        
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_apply_categories_batch_endpoint_success(self):
        """Test POST /uncategorised-transactions/apply-categories-batch endpoint."""
        with patch('app.app.apply_suggested_categories_batch_service') as mock_service:
            mock_service.return_value = self.sample_batch_response
            
            response = self.app.post(f'/uncategorised-transactions/apply-categories-batch?budget_id={self.budget_uuid}')
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data["total_updated"], 1)
            self.assertIn("updated_transactions", data)

    def test_apply_categories_batch_endpoint_missing_budget_id(self):
        """Test apply endpoint without budget_id parameter."""
        response = self.app.post('/uncategorised-transactions/apply-categories-batch')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("budget_id query parameter is required", data["error"])

    def test_start_batch_job_endpoint_success(self):
        """Test POST /uncategorised-transactions/start-batch-job endpoint."""
        mock_response = {
            "message": "Batch job started for 5 transactions",
            "batch_id": "batch-123",
            "total_transactions": 5
        }
        
        with patch('app.app.start_batch_categorization_job') as mock_service:
            mock_service.return_value = mock_response
            
            response = self.app.post(f'/uncategorised-transactions/start-batch-job?budget_id={self.budget_uuid}')
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data["batch_id"], "batch-123")
            self.assertEqual(data["total_transactions"], 5)

    def test_start_batch_job_endpoint_missing_budget_id(self):
        """Test start batch job endpoint without budget_id parameter."""
        response = self.app.post('/uncategorised-transactions/start-batch-job')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("budget_id query parameter is required", data["error"])

    def test_get_batch_job_status_endpoint_success(self):
        """Test GET /batch-jobs/{batch_id}/status endpoint."""
        batch_id = "batch-123"
        mock_response = {
            "batch_id": batch_id,
            "status": "completed",
            "has_results": True,
            "error_message": None
        }
        
        with patch('app.app.check_batch_job_status') as mock_service:
            mock_service.return_value = mock_response
            
            response = self.app.get(f'/batch-jobs/{batch_id}/status')
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data["batch_id"], batch_id)
            self.assertEqual(data["status"], "completed")
            self.assertTrue(data["has_results"])

    @patch('app.app.check_batch_job_status')
    def test_get_batch_job_status_endpoint_error(self, mock_service):
        """Test status endpoint when service raises an exception."""
        batch_id = "batch-123"
        mock_service.side_effect = Exception("Status check error")
        
        response = self.app.get(f'/batch-jobs/{batch_id}/status')
        
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_apply_batch_job_results_endpoint_success(self):
        """Test POST /batch-jobs/{batch_id}/apply-results endpoint."""
        batch_id = "batch-123"
        mock_response = {
            "batch_id": batch_id,
            "updated_transactions": [
                {
                    "transaction_id": "txn-1",
                    "status": "updated",
                    "suggested_category": "Groceries",
                    "memo": "Weekly groceries AI batch applied"
                }
            ],
            "failed_transactions": [],
            "total_updated": 1,
            "total_failed": 0
        }
        
        with patch('app.app.apply_batch_results_to_ynab') as mock_service:
            mock_service.return_value = mock_response
            
            response = self.app.post(f'/batch-jobs/{batch_id}/apply-results?budget_id={self.budget_uuid}')
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data["batch_id"], batch_id)
            self.assertEqual(data["total_updated"], 1)

    def test_apply_batch_job_results_endpoint_missing_budget_id(self):
        """Test apply results endpoint without budget_id parameter."""
        batch_id = "batch-123"
        response = self.app.post(f'/batch-jobs/{batch_id}/apply-results')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("budget_id query parameter is required", data["error"])

    @patch('app.app.apply_batch_results_to_ynab')
    def test_apply_batch_job_results_endpoint_error(self, mock_service):
        """Test apply results endpoint when service raises an exception."""
        batch_id = "batch-123"
        mock_service.side_effect = Exception("Apply results error")
        
        response = self.app.post(f'/batch-jobs/{batch_id}/apply-results?budget_id={self.budget_uuid}')
        
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_endpoint_response_structure(self):
        """Test that all endpoints return proper JSON responses."""
        # Test with mock service responses
        test_cases = [
            ('GET', '/uncategorised-transactions/suggest-categories-batch', 'suggest_categories_only_batch_service'),
            ('POST', '/uncategorised-transactions/apply-categories-batch', 'apply_suggested_categories_batch_service'),
            ('POST', '/uncategorised-transactions/start-batch-job', 'start_batch_categorization_job')
        ]
        
        for method, endpoint, service_name in test_cases:
            with patch(f'app.app.{service_name}') as mock_service:
                mock_service.return_value = {"test": "response"}
                
                if method == 'GET':
                    response = self.app.get(f'{endpoint}?budget_id={self.budget_uuid}')
                else:
                    response = self.app.post(f'{endpoint}?budget_id={self.budget_uuid}')
                
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.content_type, 'application/json')
                data = json.loads(response.data)
                self.assertIsInstance(data, dict)

    def test_batch_job_status_different_statuses(self):
        """Test batch job status endpoint with different status responses."""
        batch_id = "batch-123"
        
        status_responses = [
            {"status": "validating", "has_results": False},
            {"status": "in_progress", "has_results": False},
            {"status": "finalizing", "has_results": False},
            {"status": "completed", "has_results": True},
            {"status": "failed", "has_results": False, "error_message": "Batch job failed"},
            {"status": "cancelled", "has_results": False, "error_message": "Batch job was cancelled"}
        ]
        
        with patch('app.app.check_batch_job_status') as mock_service:
            for status_response in status_responses:
                status_response["batch_id"] = batch_id
                mock_service.return_value = status_response
                
                response = self.app.get(f'/batch-jobs/{batch_id}/status')
                
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                self.assertEqual(data["status"], status_response["status"])
                self.assertEqual(data["has_results"], status_response["has_results"])

    def test_error_handling_consistency(self):
        """Test that all endpoints handle errors consistently."""
        endpoints_and_methods = [
            ('GET', '/uncategorised-transactions/suggest-categories-batch'),
            ('POST', '/uncategorised-transactions/apply-categories-batch'),
            ('POST', '/uncategorised-transactions/start-batch-job'),
            ('POST', f'/batch-jobs/test-batch/apply-results')
        ]
        
        for method, endpoint in endpoints_and_methods:
            # Test missing budget_id (except for status endpoint)
            if 'apply-results' not in endpoint and 'status' not in endpoint:
                if method == 'GET':
                    response = self.app.get(endpoint)
                else:
                    response = self.app.post(endpoint)
                
                self.assertEqual(response.status_code, 400)
                data = json.loads(response.data)
                self.assertIn("budget_id query parameter is required", data["error"])


if __name__ == '__main__':
    unittest.main() 