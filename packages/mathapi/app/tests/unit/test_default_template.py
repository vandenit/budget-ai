#!/usr/bin/env python3
"""
Test script for default config template functionality.
"""

import os
import json
from app.country_config_loader import CountryConfigLoader

def test_default_template():
    print('🧪 Testing default config template')
    print('=' * 40)

    # Test if default config template exists and is valid
    current_dir = os.path.dirname(os.path.abspath('app'))
    default_template = os.path.join(current_dir, 'app', 'country_configs', 'default_config.json')

    if os.path.exists(default_template):
        print('✅ Default template exists')
        with open(default_template, 'r') as f:
            config = json.load(f)
        print(f'📊 Template countries: {list(config.get("countries", {}).keys())}')
        print(f'🏛️ Template banks: {list(config["countries"]["BE"]["bank_patterns"].keys())}')
        print(f'🎯 Template prefixes: {config["countries"]["BE"]["bank_patterns"]["kbc"]["prefixes"]}')
    else:
        print('❌ Default template not found')

    # Test creating new config from template
    test_config_file = '/tmp/test_country_config.json'
    if os.path.exists(test_config_file):
        os.remove(test_config_file)

    print('\n🔧 Testing config creation...')
    loader = CountryConfigLoader(test_config_file)
    print(f'✅ Config created: {os.path.exists(test_config_file)}')
    print(f'📊 Loaded countries: {len(loader.get_available_countries())}')
    print(f'🎯 Config successful: {loader.is_config_loaded_successfully()}')

    # Check content of created file
    if os.path.exists(test_config_file):
        with open(test_config_file, 'r') as f:
            created_config = json.load(f)
        print(f'📄 Created with countries: {list(created_config.get("countries", {}).keys())}')

    # Test all template files exist
    print('\n📁 Checking all template files:')
    template_dir = os.path.join(current_dir, 'app', 'country_configs')
    required_files = ['country_patterns.json', 'minimal_config.json', 'default_config.json']
    
    for filename in required_files:
        filepath = os.path.join(template_dir, filename)
        exists = os.path.exists(filepath)
        print(f'  {"✅" if exists else "❌"} {filename}')

    # Cleanup
    if os.path.exists(test_config_file):
        os.remove(test_config_file)

    print('\n✅ Template test completed!')

if __name__ == "__main__":
    test_default_template() 