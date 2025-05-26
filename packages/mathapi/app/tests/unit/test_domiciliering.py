#!/usr/bin/env python3
"""
Test script for domiciliëring (direct debit) pattern preprocessing.
"""

import pytest
from app.payee_mappings_mongo import MongoPayeeMappingsManager


@pytest.mark.unit
class TestDomicilieringPatterns:
    """Test domiciliëring (direct debit) pattern preprocessing."""

    def setup_method(self):
        """Setup for each test method."""
        self.manager = MongoPayeeMappingsManager('test-budget')

    def test_domiciliering_patterns(self):
        """Test multiple domiciliëring patterns are correctly preprocessed."""
        test_cases = [
            ('het raster vzw domiciliëring 122401816796 30172-1 30172-1', 'het raster vzw'),
            ('belgacom domiciliëring 987654321 12345-6', 'belgacom'),
            ('electrabel domiciliëring 1122334455667', 'electrabel'),
            ('test company bv domiciliëring', 'test'),  # 'company bv' removed by global patterns
            ('monica campus vzw domiciliëring 999888777', 'monica campus vzw'),
            ('vodafone belgium domiciliëring 555666777 99999-8', 'vodafone belgium'),
            ('proximus domiciliëring 111222333444555', 'proximus'),
            ('de lijn domiciliëring 777888999 11111-2 22222-3', 'de lijn')
        ]
        
        for original, expected in test_cases:
            result = self.manager.test_preprocessing(original)
            assert result == expected, f"Expected '{expected}' but got '{result}' for input '{original}'"

    def test_domiciliering_pattern_removal(self):
        """Test that domiciliëring suffix is completely removed."""
        test_input = "het raster vzw domiciliëring 122401816796 30172-1 30172-1"
        result = self.manager.test_preprocessing(test_input)
        
        # Should not contain any domiciliëring references or numbers
        assert "domiciliëring" not in result
        assert not any(char.isdigit() for char in result)
        assert result.strip() == "het raster vzw"


def demo_domiciliering_patterns():
    """Demo function to show preprocessing results."""
    print('🧪 Demo: domiciliëring pattern preprocessing:')
    print('=' * 60)
    
    manager = MongoPayeeMappingsManager('test-budget')
    
    test_cases = [
        'het raster vzw domiciliëring 122401816796 30172-1 30172-1',
        'belgacom domiciliëring 987654321 12345-6',
        'electrabel domiciliëring 1122334455667',
        'monica campus vzw domiciliëring 999888777',
    ]
    
    for test in test_cases:
        result = manager.test_preprocessing(test)
        print(f'  Original: {test[:50]}...')
        print(f'  Cleaned:  "{result}"')
        print()
    
    print('✅ All domiciliëring patterns processed!')


if __name__ == '__main__':
    demo_domiciliering_patterns() 