#!/usr/bin/env python3
"""
Test script for MongoDB payee mappings API endpoints.
Run this while the Flask server is running to test the endpoints.
"""

import requests
import json
import pytest

@pytest.mark.integration
def test_api_endpoints():
    budget_id = 'test-api-789'
    base_url = 'http://localhost:5000'
    
    print('🧪 Testing MongoDB Payee Mappings API Endpoints')
    print('=' * 55)
    
    try:
        # Test server connection
        response = requests.get(f'{base_url}/health', timeout=5)
        print(f'✅ Server is running (status: {response.status_code})')
        print()
    except requests.exceptions.ConnectionError:
        print('⚠️  Server not running. Start with: python app/app.py')
        return
    except Exception as e:
        print(f'❌ Connection error: {e}')
        return
    
    # 1. Add mappings
    print('➕ Adding mappings via API...')
    mappings_to_add = [
        {'payee_name': 'Rush rush', 'category_name': 'Eating out'},
        {'payee_name': 'Albert Heijn', 'category_name': 'Groceries'},
        {'payee_name': 'Shell', 'category_name': 'Transportation'}
    ]
    
    for mapping in mappings_to_add:
        try:
            response = requests.post(f'{base_url}/payee-mappings/{budget_id}', 
                                   json=mapping, timeout=5)
            if response.status_code == 200:
                print(f'  ✅ Added {mapping["payee_name"]} → {mapping["category_name"]}')
            else:
                print(f'  ❌ Failed to add {mapping["payee_name"]}: {response.text}')
        except Exception as e:
            print(f'  ❌ Error adding {mapping["payee_name"]}: {e}')
    
    print()
    
    # 2. Get all mappings
    print('📋 Getting all mappings...')
    try:
        response = requests.get(f'{base_url}/payee-mappings/{budget_id}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f'  Total mappings: {data["total_mappings"]}')
            for payee, category in data["mappings"].items():
                print(f'    {payee} → {category}')
        else:
            print(f'  ❌ Failed to get mappings: {response.text}')
    except Exception as e:
        print(f'  ❌ Error getting mappings: {e}')
    
    print()
    
    # 3. Test search with your example
    print('🔍 Testing search with "Rush Rush 1231244"...')
    try:
        response = requests.get(f'{base_url}/payee-mappings/{budget_id}/search', 
                              params={'payee_name': 'Rush Rush 1231244'}, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data["match_type"] != "none":
                print(f'  ✅ Match found: {data["category_name"]} ({data["match_type"]} match)')
                if data["match_type"] == "fuzzy":
                    print(f'    Similarity: {data["similarity_score"]}%')
            else:
                print(f'  ❌ No match found for "Rush Rush 1231244"')
        else:
            print(f'  ❌ Search failed: {response.text}')
    except Exception as e:
        print(f'  ❌ Search error: {e}')
    
    print()
    
    # 4. Test stats
    print('📊 Getting mapping statistics...')
    try:
        response = requests.get(f'{base_url}/payee-mappings/{budget_id}/stats', timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f'  Total mappings: {stats["total_mappings"]}')
            print(f'  Category distribution:')
            for cat_stat in stats["category_distribution"]:
                print(f'    - {cat_stat["_id"]}: {cat_stat["count"]} mappings')
        else:
            print(f'  ❌ Stats failed: {response.text}')
    except Exception as e:
        print(f'  ❌ Stats error: {e}')
    
    print()
    
    # 5. Cleanup
    print('🧹 Cleaning up test data...')
    for mapping in mappings_to_add:
        payee_name = mapping['payee_name']
        try:
            response = requests.delete(f'{base_url}/payee-mappings/{budget_id}/{payee_name}', timeout=5)
            if response.status_code == 200:
                print(f'  ✅ Removed {payee_name}')
            else:
                print(f'  ❌ Failed to remove {payee_name}: {response.text}')
        except Exception as e:
            print(f'  ❌ Error removing {payee_name}: {e}')
    
    print()
    print('✅ API endpoint tests completed!')

if __name__ == "__main__":
    test_api_endpoints() 