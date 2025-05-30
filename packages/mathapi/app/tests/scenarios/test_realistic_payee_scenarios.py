#!/usr/bin/env python3
"""
Test script for realistic payee scenarios with extra numbers and variations.
This shows how fuzzy matching handles real-world transaction data.
"""

from app.payee_mappings import PayeeMappingsManager

def test_realistic_payee_scenarios():
    print("🧪 Testing Realistic Payee Scenarios")
    print("=" * 50)
    
    # Test budget UUID
    budget_uuid = "test-realistic-123"
    
    # Initialize manager
    manager = PayeeMappingsManager(budget_uuid)
    
    print(f"📋 Budget: {budget_uuid}")
    print()
    
    # Add base mappings (clean names)
    print("➕ Adding base mappings...")
    manager.add_mapping("Rush rush", "Eating out")
    manager.add_mapping("Albert Heijn", "Groceries") 
    manager.add_mapping("Shell", "Transportation")
    manager.add_mapping("McDonald's", "Eating out")
    manager.add_mapping("NS", "Transportation")
    
    print()
    
    # Test realistic variations
    print("🔍 Testing realistic payee variations:")
    realistic_scenarios = [
        # Your example
        "Rush Rush 1231244",
        "RUSH RUSH 567890", 
        
        # Albert Heijn variations
        "Albert Heijn 1234",
        "ALBERT HEIJN Amsterdam",
        "Albert Heijn BV 9999",
        
        # Shell variations  
        "Shell 123456",
        "SHELL Station 789",
        "Shell Nederland BV",
        
        # McDonald's variations
        "McDonald's Amsterdam",
        "MCDONALD'S 12345",
        "McDonalds Drive",
        
        # NS variations
        "NS International 456",
        "Nederlandse Spoorwegen",
        "NS Reizen BV",
        
        # Partial matches
        "Rush",
        "Albert", 
        "McDonald",
        
        # Edge cases
        "Rush rush coffee shop",
        "Albert Heijn supermarket",
        "Shell petrol station"
    ]
    
    for payee in realistic_scenarios:
        print(f"\n🎯 Testing: '{payee}'")
        
        # Try exact match first
        exact_match = manager.get_exact_mapping(payee)
        if exact_match:
            print(f"  ✅ EXACT: '{payee}' → {exact_match}")
            continue
        
        # Try fuzzy match
        fuzzy_match = manager.get_fuzzy_mapping(payee, threshold=80)  # Lower threshold for testing
        if fuzzy_match:
            matched_payee, category, score = fuzzy_match
            print(f"  ✅ FUZZY: '{payee}' → {category}")
            print(f"     📊 Matched: '{matched_payee}' (similarity: {score}%)")
        else:
            print(f"  ❌ NO MATCH: '{payee}' (would use OpenAI API)")
    
    print()
    
    # Test with different thresholds
    print("📊 Testing different similarity thresholds for 'Rush Rush 1231244':")
    test_payee = "Rush Rush 1231244"
    
    for threshold in [70, 75, 80, 85, 90]:
        fuzzy_match = manager.get_fuzzy_mapping(test_payee, threshold=threshold)
        if fuzzy_match:
            matched_payee, category, score = fuzzy_match
            print(f"  Threshold {threshold}%: ✅ → {category} (score: {score}%)")
        else:
            print(f"  Threshold {threshold}%: ❌ No match")
    
    print()
    
    # Test the smart fallback
    print("🚀 Testing smart fallback (production behavior):")
    production_scenarios = [
        "Rush Rush 1231244",
        "Albert Heijn 5678", 
        "Unknown Store 9999"
    ]
    
    for payee in production_scenarios:
        result = manager.get_mapping_with_fallback(payee)
        if result:
            category, match_type, matched_payee = result
            print(f"  ✅ '{payee}' → {category} ({match_type.upper()} match)")
        else:
            print(f"  ❌ '{payee}' → Would use OpenAI API (no mapping found)")
    
    print()
    
    # Cleanup
    print("🧹 Cleaning up test mappings...")
    for payee in ["Rush rush", "Albert Heijn", "Shell", "McDonald's", "NS"]:
        manager.remove_mapping(payee)
    
    print("✅ Test completed!")


if __name__ == "__main__":
    test_realistic_payee_scenarios() 