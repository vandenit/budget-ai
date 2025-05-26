#!/usr/bin/env python3
"""
Test script for improved configuration structure with fallback system.
"""

from app.country_config_loader import get_config_loader
import os

def test_config_fallback():
    print('🧪 Testing improved configuration structure')
    print('=' * 50)

    # Test normal config loading
    loader = get_config_loader()
    print(f'✅ Config loaded: {loader.is_config_loaded_successfully()}')
    print(f'📊 Countries available: {len(loader.get_available_countries())}')
    
    for country in loader.get_available_countries():
        print(f"  - {country['code']}: {country['name']}")

    # Test fallback config by temporarily moving file
    print('\n🔧 Testing fallback configuration...')
    config_file = loader.config_file
    backup_file = config_file + '.backup'

    try:
        # Backup main config
        if os.path.exists(config_file):
            os.rename(config_file, backup_file)
            print(f'📦 Main config temporarily moved: {config_file}')
        
        # Force reload to trigger fallback
        loader.reload_config()
        print(f'📊 Fallback config loaded: {loader.is_config_loaded_successfully()}')
        print(f'🏁 Default country: {loader.get_default_country()}')
        print(f'🌍 Countries in fallback: {len(loader.get_available_countries())}')
        
        # Test basic functionality with fallback
        test_payee = "LS Rush Rush BE2018 betaling met bancontact"
        detected = loader.detect_country_from_payee(test_payee)
        print(f'🎯 Country detection with fallback: "{test_payee[:30]}..." → {detected}')
        
        # Restore config
        if os.path.exists(backup_file):
            os.rename(backup_file, config_file)
            loader.reload_config()
            print(f'✅ Main config restored: {loader.is_config_loaded_successfully()}')
            print(f'🌍 Countries after restore: {len(loader.get_available_countries())}')
        
    except Exception as e:
        print(f'❌ Error: {e}')
        # Ensure config is restored
        if os.path.exists(backup_file):
            os.rename(backup_file, config_file)
            print('🔄 Config restored after error')

    print('\n📁 Testing minimal config file:')
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        minimal_config_file = os.path.join(current_dir, 'app', 'country_configs', 'minimal_config.json')
        
        if os.path.exists(minimal_config_file):
            print(f'✅ Minimal config exists: {minimal_config_file}')
            
            import json
            with open(minimal_config_file, 'r') as f:
                minimal_config = json.load(f)
            
            print(f'📊 Minimal config countries: {list(minimal_config.get("countries", {}).keys())}')
            print(f'🏁 Minimal default country: {minimal_config.get("default_country")}')
        else:
            print(f'❌ Minimal config not found: {minimal_config_file}')
            
    except Exception as e:
        print(f'❌ Error reading minimal config: {e}')

    print('\n✅ Test completed!')

if __name__ == "__main__":
    test_config_fallback() 