#!/usr/bin/env python3
"""
Test script for country-based configuration system.
"""

from unittest.mock import MagicMock
import sys

# Mock MongoDB dependencies at the module level before any imports
sys.modules['pymongo'] = MagicMock()
sys.modules['pymongo.errors'] = MagicMock()
sys.modules['bson'] = MagicMock()
sys.modules['bson.objectid'] = MagicMock()

# Mock the models module to prevent MongoDB connection
import app.models
app.models.client = MagicMock()
app.models.db = MagicMock()

# Now we can safely import the modules we want to test
from app.payee_mappings_mongo import MongoPayeeMappingsManager
from app.country_config_loader import get_config_loader

def test_country_config():
    print('🌍 Test Country Configuration System')
    print('=' * 50)

    # Test configuration loader
    config_loader = get_config_loader()

    print('📋 Available countries:')
    countries = config_loader.get_available_countries()
    for country in countries:
        print(f"  {country['code']}: {country['name']}")

    print(f"\n🎯 Default country: {config_loader.get_default_country()}")

    print('\n🧪 Testing country detection:')
    test_payees = [
        'LS Rush Rush BE2018 ANTWERPEN Betaling met KBC-Debetkaart',  # Belgium
        'ING Betaling Albert Heijn NL2018 Amsterdam',  # Netherlands
        'Sparkasse Zahlung EDEKA DE2018 Berlin',  # Germany
        'Barclays Payment Tesco GB2018 London',  # UK
        'Chase Purchase Starbucks US2018 New York',  # US
        'Simple Store Name'  # Should use default
    ]

    for payee in test_payees:
        detected = config_loader.detect_country_from_payee(payee)
        print(f"  '{payee[:40]}...' → {detected}")

    print('\n🔧 Testing preprocessing with different countries:')

    # Test with explicit country codes
    test_scenarios = [
        {
            'payee': 'LS Rush Rush BE2018 ANTWERPEN Betaling met KBC-Debetkaart',
            'country': 'BE',
            'expected_contains': 'rush rush'
        },
        {
            'payee': 'ING Betaling Albert Heijn Amsterdam NL2018',
            'country': 'NL',
            'expected_contains': 'albert heijn'
        },
        {
            'payee': 'McDonald\'s Store London Limited GB2018',
            'country': 'GB',
            'expected_contains': 'mcdonald'
        }
    ]

    for scenario in test_scenarios:
        manager = MongoPayeeMappingsManager('test-country', scenario['country'])
        processed = manager.test_preprocessing(scenario['payee'])

        print(f"\n  Country: {scenario['country']}")
        print(f"  Original: {scenario['payee']}")
        print(f"  Processed: '{processed}'")

        if scenario['expected_contains'] in processed.lower():
            print(f"  ✅ Contains expected: '{scenario['expected_contains']}'")
        else:
            print(f"  ❌ Missing expected: '{scenario['expected_contains']}'")

    print('\n🎯 Testing with auto-detection (no explicit country):')
    manager_auto = MongoPayeeMappingsManager('test-auto-detect')

    auto_tests = [
        'LS Rush Rush BE2018 ANTWERPEN Betaling met bancontact',
        'Albert Heijn Amsterdam Store',
        'McDonald\'s Limited London'
    ]

    for payee in auto_tests:
        processed = manager_auto.test_preprocessing(payee)
        detected_country = manager_auto._get_country_for_payee(payee)
        print(f"  '{payee}' → '{processed}' (detected: {detected_country})")

    print('\n📊 Testing configuration access:')
    be_config = config_loader.get_country_config('BE')
    print(f"  Belgium cities: {len(be_config.get('cities', []))} cities")
    print(f"  Belgium banks: {list(be_config.get('bank_patterns', {}).keys())}")

    nl_config = config_loader.get_country_config('NL')
    print(f"  Netherlands cities: {len(nl_config.get('cities', []))} cities")
    print(f"  Netherlands banks: {list(nl_config.get('bank_patterns', {}).keys())}")

    print('\n✅ Country configuration test completed!')

if __name__ == "__main__":
    test_country_config()