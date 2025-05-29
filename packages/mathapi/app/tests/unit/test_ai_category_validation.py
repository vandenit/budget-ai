#!/usr/bin/env python3
"""
Test script for AI category validation system.
Tests the validation logic added to suggest_category and parse_category_suggestions functions.
"""

import unittest
from unittest.mock import patch, MagicMock
import logging

# Mock MongoDB dependencies before importing the modules
with patch('app.models.MongoClient'), patch('app.models.client'), patch('app.models.db'):
    # Import the functions we want to test
    from app.ai_api import suggest_category, parse_category_suggestions

class TestAICategoryValidation(unittest.TestCase):

    def setUp(self):
        """Set up test data"""
        self.test_categories = [
            {"name": "Groceries", "uuid": "cat-1"},
            {"name": "Transportation", "uuid": "cat-2"},
            {"name": "Entertainment", "uuid": "cat-3"},
            {"name": "Utilities", "uuid": "cat-4"},
            {"name": "Uncategorized", "uuid": "cat-uncategorized"}
        ]

        self.test_transaction = {
            "id": "tx-123",
            "payee_name": "Test Store",
            "amount": -25.50,
            "date": "2024-05-26"
        }

    @patch('app.ai_api.client')
    @patch('app.ai_api.MongoPayeeMappingsManager')
    def test_suggest_category_valid_response(self, mock_mappings, mock_client):
        """Test suggest_category with valid AI response"""
        # Mock mappings manager to return no cached mapping
        mock_mappings_instance = MagicMock()
        mock_mappings_instance.get_mapping_with_fallback.return_value = None
        mock_mappings_instance.get_mappings_for_prompt.return_value = ""
        mock_mappings.return_value = mock_mappings_instance

        # Mock OpenAI response with valid category
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = "Groceries"
        mock_client.chat.completions.create.return_value = mock_response

        result = suggest_category(self.test_transaction, self.test_categories, "test-budget")

        self.assertEqual(result, "Groceries")
        mock_client.chat.completions.create.assert_called_once()

    @patch('app.ai_api.client')
    @patch('app.ai_api.MongoPayeeMappingsManager')
    @patch('app.ai_api.logging')
    def test_suggest_category_invalid_response_exact_case(self, mock_logging, mock_mappings, mock_client):
        """Test suggest_category with invalid AI response (exact case mismatch)"""
        # Mock mappings manager
        mock_mappings_instance = MagicMock()
        mock_mappings_instance.get_mapping_with_fallback.return_value = None
        mock_mappings_instance.get_mappings_for_prompt.return_value = ""
        mock_mappings.return_value = mock_mappings_instance

        # Mock OpenAI response with case-mismatched category
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = "groceries"  # lowercase
        mock_client.chat.completions.create.return_value = mock_response

        result = suggest_category(self.test_transaction, self.test_categories, "test-budget")

        # Should find case-insensitive match
        self.assertEqual(result, "Groceries")
        mock_logging.info.assert_called_with("Found case-insensitive match: 'groceries' → 'Groceries'")

    @patch('app.ai_api.client')
    @patch('app.ai_api.MongoPayeeMappingsManager')
    @patch('app.ai_api.logging')
    def test_suggest_category_invalid_response_no_match(self, mock_logging, mock_mappings, mock_client):
        """Test suggest_category with completely invalid AI response"""
        # Mock mappings manager
        mock_mappings_instance = MagicMock()
        mock_mappings_instance.get_mapping_with_fallback.return_value = None
        mock_mappings_instance.get_mappings_for_prompt.return_value = ""
        mock_mappings.return_value = mock_mappings_instance

        # Mock OpenAI response with non-existent category
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = "Ready to Assign"
        mock_client.chat.completions.create.return_value = mock_response

        result = suggest_category(self.test_transaction, self.test_categories, "test-budget")

        # Should default to "Uncategorized"
        self.assertEqual(result, "Uncategorized")
        mock_logging.warning.assert_any_call(
            "AI suggested invalid category 'Ready to Assign' for payee 'Test Store'. Available: ['Groceries', 'Transportation', 'Entertainment', 'Utilities', 'Uncategorized']"
        )
        mock_logging.warning.assert_any_call(
            "No match found for 'Ready to Assign', defaulting to 'Uncategorized'"
        )

    @patch('app.ai_api.client')
    @patch('app.ai_api.MongoPayeeMappingsManager')
    def test_suggest_category_with_cached_mapping(self, mock_mappings, mock_client):
        """Test suggest_category when payee mapping exists in cache"""
        # Mock mappings manager to return cached mapping
        mock_mappings_instance = MagicMock()
        mock_mappings_instance.get_mapping_with_fallback.return_value = ("Transportation", "exact", "Test Store")
        mock_mappings.return_value = mock_mappings_instance

        result = suggest_category(self.test_transaction, self.test_categories, "test-budget")

        # Should return cached mapping without calling AI
        self.assertEqual(result, "Transportation")
        mock_client.chat.completions.create.assert_not_called()

    def test_parse_category_suggestions_valid_results(self):
        """Test parse_category_suggestions with valid batch results"""
        batch_results = [
            {
                "custom_id": "transaction-tx-123-0",
                "response": {
                    "body": {
                        "choices": [{"message": {"content": "Groceries"}}]
                    }
                }
            },
            {
                "custom_id": "transaction-tx-456-1",
                "response": {
                    "body": {
                        "choices": [{"message": {"content": "Transportation"}}]
                    }
                }
            }
        ]

        transactions = [
            {"id": "tx-123", "payee_name": "Store A"},
            {"id": "tx-456", "payee_name": "Bus Company"}
        ]

        result = parse_category_suggestions(batch_results, transactions, self.test_categories)

        expected = {
            "tx-123": "Groceries",
            "tx-456": "Transportation"
        }

        self.assertEqual(result, expected)

    @patch('app.ai_api.logging')
    def test_parse_category_suggestions_invalid_category(self, mock_logging):
        """Test parse_category_suggestions with invalid category in batch results"""
        batch_results = [
            {
                "custom_id": "transaction-tx-123-0",
                "response": {
                    "body": {
                        "choices": [{"message": {"content": "Ready to Assign"}}]
                    }
                }
            }
        ]

        transactions = [{"id": "tx-123", "payee_name": "Store A"}]

        result = parse_category_suggestions(batch_results, transactions, self.test_categories)

        # Should default invalid category to "Uncategorized"
        expected = {"tx-123": "Uncategorized"}
        self.assertEqual(result, expected)

        mock_logging.warning.assert_any_call(
            "Batch AI suggested invalid category 'Ready to Assign'. Available: ['Groceries', 'Transportation', 'Entertainment', 'Utilities', 'Uncategorized']"
        )

    @patch('app.ai_api.logging')
    def test_parse_category_suggestions_case_insensitive_match(self, mock_logging):
        """Test parse_category_suggestions with case-insensitive category match"""
        batch_results = [
            {
                "custom_id": "transaction-tx-123-0",
                "response": {
                    "body": {
                        "choices": [{"message": {"content": "groceries"}}]  # lowercase
                    }
                }
            }
        ]

        transactions = [{"id": "tx-123", "payee_name": "Store A"}]

        result = parse_category_suggestions(batch_results, transactions, self.test_categories)

        # Should find case-insensitive match
        expected = {"tx-123": "Groceries"}
        self.assertEqual(result, expected)

        mock_logging.info.assert_called_with(
            "Found case-insensitive match: 'groceries' → 'Groceries'"
        )

    def test_parse_category_suggestions_complex_transaction_id(self):
        """Test parse_category_suggestions with complex transaction IDs containing dashes"""
        batch_results = [
            {
                "custom_id": "transaction-txn-abc-123-def-0",
                "response": {
                    "body": {
                        "choices": [{"message": {"content": "Entertainment"}}]
                    }
                }
            }
        ]

        transactions = [{"id": "txn-abc-123-def", "payee_name": "Movie Theater"}]

        result = parse_category_suggestions(batch_results, transactions, self.test_categories)

        # Should correctly parse complex transaction ID
        expected = {"txn-abc-123-def": "Entertainment"}
        self.assertEqual(result, expected)

    def test_parse_category_suggestions_without_categories(self):
        """Test parse_category_suggestions when no categories provided (no validation)"""
        batch_results = [
            {
                "custom_id": "transaction-tx-123-0",
                "response": {
                    "body": {
                        "choices": [{"message": {"content": "Any Category Name"}}]
                    }
                }
            }
        ]

        transactions = [{"id": "tx-123", "payee_name": "Store A"}]

        result = parse_category_suggestions(batch_results, transactions, categories=None)

        # Should accept any category when no validation categories provided
        expected = {"tx-123": "Any Category Name"}
        self.assertEqual(result, expected)

    def test_parse_category_suggestions_malformed_response(self):
        """Test parse_category_suggestions with malformed batch response"""
        batch_results = [
            {
                "custom_id": "transaction-tx-123-0",
                "response": {
                    "body": {
                        # Missing choices array
                    }
                }
            },
            {
                "custom_id": "transaction-tx-456-1",
                # Missing response entirely
            }
        ]

        transactions = [
            {"id": "tx-123", "payee_name": "Store A"},
            {"id": "tx-456", "payee_name": "Store B"}
        ]

        result = parse_category_suggestions(batch_results, transactions, self.test_categories)

        # Should handle malformed responses gracefully
        expected = {"tx-456": None}  # Only tx-456 would be processed (no valid response)
        self.assertEqual(result, expected)


def test_ai_category_validation():
    """Test runner function"""
    print('🧠 Test AI Category Validation System')
    print('=' * 50)

    # Run the unit tests
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestAICategoryValidation)
    runner = unittest.TextTestRunner(verbosity=2)

    print('\n🧪 Running validation tests...\n')
    result = runner.run(suite)

    if result.wasSuccessful():
        print('\n✅ All AI category validation tests passed!')
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
    test_ai_category_validation()