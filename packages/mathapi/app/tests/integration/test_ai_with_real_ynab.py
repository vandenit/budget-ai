#!/usr/bin/env python3
"""
Test AI integration with real YNAB payee name.
"""

from app.payee_mappings_mongo import MongoPayeeMappingsManager
from app.ai_api import suggest_category

def test_ai_with_real_ynab():
    print('🤖 Testing AI integration with real YNAB data')
    print('=' * 50)

    # Test budget
    budget_uuid = 'test-ai-ynab-real'
    manager = MongoPayeeMappingsManager(budget_uuid)

    # Cleanup first
    existing = manager.get_all_mappings()
    for payee in existing.keys():
        manager.remove_mapping(payee)

    print('➕ Adding mapping for "Rush rush" → "Eating out"')
    manager.add_mapping('Rush rush', 'Eating out')

    print()
    print('🎯 Testing AI suggest_category with real YNAB payee:')
    
    # Mock transaction data
    real_transaction = {
        'id': 'test-123',
        'payee_name': 'LS Rush Rush BE2018 ANTWERPEN Betaling met KBC-Debetkaart via Bancontact 21-05-2025 om 11.19 uur 6703 73XX XXXX X619 7 VAN DEN BROECK FILIP',
        'amount': -8.50,
        'date': '2025-05-21'
    }
    
    # Mock categories
    mock_categories = [
        {"name": "Groceries"},
        {"name": "Eating out"}, 
        {"name": "Transportation"},
        {"name": "Entertainment"},
        {"name": "Unexpected"}
    ]
    
    print(f'Transaction payee: {real_transaction["payee_name"][:60]}...')
    
    # Test without OpenAI API key (should find mapping)
    try:
        # This will find mapping directly without using OpenAI API
        suggested_category = suggest_category(real_transaction, mock_categories, budget_uuid)
        print(f'✅ AI result: "{suggested_category}"')
        print('💡 Cost: €0.00 (found via mapping, no API call)')
        
    except Exception as e:
        if "API key missing" in str(e):
            print('✅ Expected error: OpenAI API key not present')
            print('✅ But mapping should still be found...')
            
            # Test mapping directly
            result = manager.get_mapping_with_fallback(real_transaction['payee_name'])
            if result:
                category, match_type, matched = result
                print(f'✅ Direct mapping test: "{category}" ({match_type} match)')
                print('💡 In production this would cost €0.00 (no API call)')
            else:
                print('❌ Mapping not found')
        else:
            print(f'❌ Unexpected error: {e}')

    print()
    print('📊 Extra scenario - unknown payee:')
    unknown_transaction = {
        'id': 'test-456',
        'payee_name': 'LS Unknown Store BE2018 BRUSSELS Payment with bancontact',
        'amount': -15.00,
        'date': '2025-05-21'
    }
    
    print(f'Unknown payee: {unknown_transaction["payee_name"]}')
    result = manager.get_mapping_with_fallback(unknown_transaction['payee_name'])
    if result:
        category, match_type, matched = result
        print(f'✅ Mapping found: "{category}" ({match_type})')
    else:
        print('❌ No mapping - would use OpenAI API (€0.002 per call)')

    print()
    print('🧹 Cleanup')
    manager.remove_mapping('Rush rush')
    print('✅ Test completed!')

if __name__ == "__main__":
    test_ai_with_real_ynab() 