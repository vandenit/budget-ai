#!/usr/bin/env python3
"""
Test script for MongoDB-based payee mappings functionality.
This tests the smart preprocessing and MongoDB storage.
"""

import pytest
from app.payee_mappings_mongo import MongoPayeeMappingsManager
import os

@pytest.mark.integration
def test_mongo_payee_mappings():
    print("🧪 Testing MongoDB Payee Mappings Functionality")
    print("=" * 60)
    
    # Check MongoDB connection
    mongodb_uri = os.getenv('MONGODB_URI')
    if not mongodb_uri:
        print("❌ MONGODB_URI not set. Please set it in your .env file.")
        return
    
    print(f"📋 MongoDB URI: {mongodb_uri[:50]}...")
    
    # Test budget UUID
    budget_uuid = "test-mongo-budget-456"
    
    # Initialize MongoDB manager
    manager = MongoPayeeMappingsManager(budget_uuid)
    
    print(f"📁 Using budget: {budget_uuid}")
    print(f"📚 Collection: {manager.collection.name}")
    print()
    
    # Clean up any existing test data first
    print("🧹 Cleaning up any existing test data...")
    existing_mappings = manager.get_all_mappings()
    for payee in existing_mappings.keys():
        manager.remove_mapping(payee)
    
    print()
    
    # Add test mappings
    print("➕ Adding test mappings to MongoDB...")
    manager.add_mapping("Rush rush", "Eating out")
    manager.add_mapping("Albert Heijn", "Groceries") 
    manager.add_mapping("Shell", "Transportation")
    manager.add_mapping("McDonald's", "Eating out")
    manager.add_mapping("NS", "Transportation")
    
    print()
    
    # Show all mappings
    print("📝 Current mappings in MongoDB:")
    mappings = manager.get_all_mappings()
    for payee, category in mappings.items():
        print(f"  '{payee}' → {category}")
    
    print()
    
    # Test your specific example
    print("🎯 Testing your 'Rush Rush 1231244' example:")
    test_scenarios = [
        "Rush Rush 1231244",
        "RUSH RUSH 567890",
        "Albert Heijn 1234",
        "Shell 123456",
        "McDonald's Amsterdam",
        "rush rush",  # Exact match
        "Unknown Store"
    ]
    
    for payee in test_scenarios:
        result = manager.get_mapping_with_fallback(payee)
        if result:
            category, match_type, matched_payee = result
            print(f"  ✅ '{payee}' → {category} ({match_type.upper()} match)")
        else:
            print(f"  ❌ '{payee}' → Would use OpenAI API")
    
    print()
    
    # Test preprocessing
    print("🔧 Testing smart preprocessing:")
    preprocessing_tests = [
        "Rush Rush 1231244",
        "Albert Heijn BV 9999",  
        "Shell Nederland Limited",
        "McDonald's Amsterdam Store"
    ]
    
    for payee in preprocessing_tests:
        preprocessed = manager.test_preprocessing(payee)
        print(f"  '{payee}' → '{preprocessed}'")
    
    print()
    
    # Test statistics
    print("📊 Testing mapping statistics:")
    stats = manager.get_mapping_stats()
    print(f"  Total mappings: {stats.get('total_mappings', 0)}")
    print(f"  Category distribution:")
    for category_stat in stats.get('category_distribution', []):
        category = category_stat['_id']
        count = category_stat['count']
        print(f"    - {category}: {count} mappings")
    
    print()
    
    # Test updates
    print("🔄 Testing mapping updates:")
    # Add duplicate - should update existing
    manager.add_mapping("Rush rush", "Entertainment")  # Change category
    updated_mapping = manager.get_exact_mapping("Rush rush")
    print(f"  Updated 'Rush rush' → {updated_mapping}")
    
    print()
    
    # Test fuzzy matching with different thresholds
    print("📊 Testing fuzzy matching thresholds for 'Rush Rush 1231244':")
    test_payee = "Rush Rush 1231244"
    
    for threshold in [70, 75, 80, 85, 90]:
        fuzzy_match = manager.get_fuzzy_mapping(test_payee, threshold=threshold)
        if fuzzy_match:
            matched_payee, category, score = fuzzy_match
            print(f"  Threshold {threshold}%: ✅ → {category} (score: {score}%)")
        else:
            print(f"  Threshold {threshold}%: ❌ No match")
    
    print()
    
    # Test AI prompt generation
    print("📄 AI Prompt context:")
    prompt_context = manager.get_mappings_for_prompt()
    print(prompt_context)
    
    print()
    
    # Final cleanup
    print("🧹 Final cleanup...")
    final_mappings = manager.get_all_mappings()
    for payee in final_mappings.keys():
        manager.remove_mapping(payee)
    
    print("✅ MongoDB payee mappings test completed!")


if __name__ == "__main__":
    test_mongo_payee_mappings() 