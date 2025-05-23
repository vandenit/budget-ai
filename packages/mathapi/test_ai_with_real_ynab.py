#!/usr/bin/env python3
"""
Test AI integration with real YNAB payee name.
"""

from app.payee_mappings_mongo import MongoPayeeMappingsManager
from app.ai_api import suggest_category

def test_ai_with_real_ynab():
    print('🤖 Test AI integration met echte YNAB data')
    print('=' * 50)

    # Test budget
    budget_uuid = 'test-ai-ynab-real'
    manager = MongoPayeeMappingsManager(budget_uuid)

    # Cleanup eerst
    existing = manager.get_all_mappings()
    for payee in existing.keys():
        manager.remove_mapping(payee)

    print('➕ Voeg mapping toe voor "Rush rush" → "Eating out"')
    manager.add_mapping('Rush rush', 'Eating out')

    print()
    print('🎯 Test AI suggest_category met echte YNAB payee:')
    
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
    
    # Test zonder OpenAI API key (zou mapping moeten vinden)
    try:
        # Dit zal direct de mapping vinden zonder OpenAI API te gebruiken
        suggested_category = suggest_category(real_transaction, mock_categories, budget_uuid)
        print(f'✅ AI result: "{suggested_category}"')
        print('💡 Cost: €0.00 (gevonden via mapping, geen API call)')
        
    except Exception as e:
        if "API key missing" in str(e):
            print('✅ Verwachte error: OpenAI API key niet aanwezig')
            print('✅ Maar de mapping zou nog steeds gevonden moeten worden...')
            
            # Test direct de mapping
            result = manager.get_mapping_with_fallback(real_transaction['payee_name'])
            if result:
                category, match_type, matched = result
                print(f'✅ Direct mapping test: "{category}" ({match_type} match)')
                print('💡 In productie zou dit €0.00 kosten (geen API call)')
            else:
                print('❌ Mapping niet gevonden')
        else:
            print(f'❌ Onverwachte error: {e}')

    print()
    print('📊 Extra scenario - onbekende payee:')
    unknown_transaction = {
        'id': 'test-456',
        'payee_name': 'LS Onbekende Winkel BE2018 BRUSSEL Betaling met bancontact',
        'amount': -15.00,
        'date': '2025-05-21'
    }
    
    print(f'Unknown payee: {unknown_transaction["payee_name"]}')
    result = manager.get_mapping_with_fallback(unknown_transaction['payee_name'])
    if result:
        category, match_type, matched = result
        print(f'✅ Mapping gevonden: "{category}" ({match_type})')
    else:
        print('❌ Geen mapping - zou OpenAI API gebruiken (€0.002 per call)')

    print()
    print('🧹 Cleanup')
    manager.remove_mapping('Rush rush')
    print('✅ Test voltooid!')

if __name__ == "__main__":
    test_ai_with_real_ynab() 