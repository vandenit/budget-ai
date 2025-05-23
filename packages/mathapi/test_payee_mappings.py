#!/usr/bin/env python3
"""
Test script for the new payee mappings functionality.
This shows how the AI now "remembers" which payees should map to which categories.
"""

from app.payee_mappings import PayeeMappingsManager

def test_payee_mappings():
    print("🧪 Testing Payee Mappings Functionality")
    print("=" * 50)
    
    # Test budget UUID
    budget_uuid = "test-budget-123"
    
    # Initialize manager
    manager = PayeeMappingsManager(budget_uuid)
    
    print(f"📋 Budget: {budget_uuid}")
    print(f"📁 Mappings file: {manager.mappings_file}")
    print()
    
    # Add some test mappings
    print("➕ Adding test mappings...")
    manager.add_mapping("Rush rush", "Eating out")
    manager.add_mapping("Albert Heijn", "Groceries") 
    manager.add_mapping("NS International", "Transportation")
    manager.add_mapping("McDonald's", "Eating out")
    manager.add_mapping("Shell", "Transportation")
    
    print()
    
    # Show all mappings
    print("📝 Current mappings:")
    mappings = manager.get_all_mappings()
    for payee, category in mappings.items():
        print(f"  '{payee}' → {category}")
    
    print()
    
    # Test exact matching
    print("🎯 Testing exact matching:")
    test_payees_exact = ["rush rush", "RUSH RUSH", "Albert Heijn"]
    
    for payee in test_payees_exact:
        result = manager.get_exact_mapping(payee)
        if result:
            print(f"  ✅ '{payee}' → {result}")
        else:
            print(f"  ❌ '{payee}' → No exact match")
    
    print()
    
    # Test fuzzy matching
    print("🔍 Testing fuzzy matching:")
    test_payees_fuzzy = ["Rush", "Albert", "McDonald", "NS", "Shell tankstation"]
    
    for payee in test_payees_fuzzy:
        result = manager.get_fuzzy_mapping(payee)
        if result:
            matched_payee, category, score = result
            print(f"  ✅ '{payee}' → {category} (matched: '{matched_payee}', score: {score}%)")
        else:
            print(f"  ❌ '{payee}' → No fuzzy match")
    
    print()
    
    # Test with fallback
    print("🚀 Testing with fallback (exact preferred, fuzzy as backup):")
    test_payees_fallback = ["rush rush", "Albert", "Starbucks", "Unknown Store"]
    
    for payee in test_payees_fallback:
        result = manager.get_mapping_with_fallback(payee)
        if result:
            category, match_type, matched_payee = result
            print(f"  ✅ '{payee}' → {category} ({match_type} match: '{matched_payee}')")
        else:
            print(f"  ❌ '{payee}' → No match found")
    
    print()
    
    # Test prompt generation
    print("📄 AI Prompt context:")
    prompt_context = manager.get_mappings_for_prompt()
    print(prompt_context)
    
    print()
    
    # Cleanup
    print("🧹 Cleaning up test mappings...")
    for payee in ["Rush rush", "Albert Heijn", "NS International", "McDonald's", "Shell"]:
        manager.remove_mapping(payee)
    
    print("✅ Test completed!")


if __name__ == "__main__":
    test_payee_mappings() 