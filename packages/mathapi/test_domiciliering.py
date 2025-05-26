#!/usr/bin/env python3
"""
Test script for domiciliëring (direct debit) pattern preprocessing.
"""

from app.payee_mappings_mongo import MongoPayeeMappingsManager

def test_domiciliering_patterns():
    print('🧪 Testing domiciliëring pattern preprocessing:')
    print('=' * 60)
    
    manager = MongoPayeeMappingsManager('test-budget')
    
    test_cases = [
        'het raster vzw domiciliëring 122401816796 30172-1 30172-1',
        'belgacom domiciliëring 987654321 12345-6',
        'electrabel domiciliëring 1122334455667',
        'test company bv domiciliëring',
        'monica campus vzw domiciliëring 999888777',
        'vodafone belgium domiciliëring 555666777 99999-8',
        'proximus domiciliëring 111222333444555',
        'de lijn domiciliëring 777888999 11111-2 22222-3'
    ]
    
    print('Testing multiple domiciliëring patterns:')
    for test in test_cases:
        result = manager.test_preprocessing(test)
        print(f'  Original: {test[:50]}...')
        print(f'  Cleaned:  "{result}"')
        print()
    
    print('✅ All domiciliëring patterns tested!')

if __name__ == '__main__':
    test_domiciliering_patterns() 