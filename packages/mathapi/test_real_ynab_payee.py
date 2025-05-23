#!/usr/bin/env python3
"""
Test script for real YNAB payee name with improved preprocessing.
"""

from app.payee_mappings_mongo import MongoPayeeMappingsManager

def test_real_ynab_payee():
    print('🧪 Volledige test met echte YNAB payee data')
    print('=' * 50)

    # Test budget
    budget_uuid = 'test-ynab-real-data'
    manager = MongoPayeeMappingsManager(budget_uuid)

    # Cleanup eerst
    existing = manager.get_all_mappings()
    for payee in existing.keys():
        manager.remove_mapping(payee)

    print('➕ Voeg mapping toe voor "Rush rush" → "Eating out"')
    manager.add_mapping('Rush rush', 'Eating out')

    print()
    print('🎯 Test met echte YNAB payee naam:')
    real_payee = 'LS Rush Rush BE2018 ANTWERPEN Betaling met KBC-Debetkaart via Bancontact 21-05-2025 om 11.19 uur 6703 73XX XXXX X619 7 VAN DEN BROECK FILIP'

    print(f'Origineel: {real_payee[:60]}...')
    print(f'Preprocessing: "{manager.test_preprocessing(real_payee)}"')

    # Test exact match (should fail)
    exact = manager.get_exact_mapping(real_payee)
    print(f'Exact match: {exact if exact else "❌ Geen"}')

    # Test fuzzy match (should succeed!)
    fuzzy = manager.get_fuzzy_mapping(real_payee)
    if fuzzy:
        matched_payee, category, score = fuzzy
        print(f'Fuzzy match: ✅ "{category}" (score: {score}%)')
    else:
        print('Fuzzy match: ❌ Geen')

    # Test fallback method (the main one used by AI)
    fallback = manager.get_mapping_with_fallback(real_payee)
    if fallback:
        category, match_type, matched = fallback
        print(f'Fallback result: ✅ "{category}" ({match_type} match)')
        print(f'  ↳ Matched tegen: "{matched}"')
    else:
        print('Fallback result: ❌ Zou OpenAI API gebruiken')

    print()
    print('📊 Extra tests met variaties:')
    test_variations = [
        'LS Rush Rush BE2018 GENT Betaling met Bancontact',
        'RUSH RUSH 12345 PAYMENT',
        'rush rush antwerpen',
        'Rush Rush Limited'
    ]
    
    for variation in test_variations:
        result = manager.get_mapping_with_fallback(variation)
        if result:
            category, match_type, matched = result
            print(f'  "{variation[:30]}..." → {category} ({match_type})')
        else:
            print(f'  "{variation[:30]}..." → ❌ Geen match')

    print()
    print('🧹 Cleanup')
    manager.remove_mapping('Rush rush')
    print('✅ Test voltooid!')

if __name__ == "__main__":
    test_real_ynab_payee() 