#!/usr/bin/env python3
"""
Test script for improved configuration structure with fallback system.
"""

from app.country_config_loader import get_config_loader
import os

def test_config_fallback():
    print('🧪 Test van verbeterde configuratie structuur')
    print('=' * 50)

    # Test normale config loading
    loader = get_config_loader()
    print(f'✅ Config geladen: {loader.is_config_loaded_successfully()}')
    print(f'📊 Landen beschikbaar: {len(loader.get_available_countries())}')
    
    for country in loader.get_available_countries():
        print(f"  - {country['code']}: {country['name']}")

    # Test fallback config door bestand tijdelijk te verplaatsen
    print('\n🔧 Test fallback configuratie...')
    config_file = loader.config_file
    backup_file = config_file + '.backup'

    try:
        # Backup main config
        if os.path.exists(config_file):
            os.rename(config_file, backup_file)
            print(f'📦 Hoofdconfig tijdelijk verplaatst: {config_file}')
        
        # Force reload to trigger fallback
        loader.reload_config()
        print(f'📊 Fallback config geladen: {loader.is_config_loaded_successfully()}')
        print(f'🏁 Default land: {loader.get_default_country()}')
        print(f'🌍 Landen in fallback: {len(loader.get_available_countries())}')
        
        # Test basic functionality with fallback
        test_payee = "LS Rush Rush BE2018 betaling met bancontact"
        detected = loader.detect_country_from_payee(test_payee)
        print(f'🎯 Land detectie met fallback: "{test_payee[:30]}..." → {detected}')
        
        # Restore config
        if os.path.exists(backup_file):
            os.rename(backup_file, config_file)
            loader.reload_config()
            print(f'✅ Hoofdconfig hersteld: {loader.is_config_loaded_successfully()}')
            print(f'🌍 Landen na herstel: {len(loader.get_available_countries())}')
        
    except Exception as e:
        print(f'❌ Error: {e}')
        # Ensure config is restored
        if os.path.exists(backup_file):
            os.rename(backup_file, config_file)
            print('🔄 Config hersteld na error')

    print('\n📁 Test minimal config bestand:')
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        minimal_config_file = os.path.join(current_dir, 'app', 'country_configs', 'minimal_config.json')
        
        if os.path.exists(minimal_config_file):
            print(f'✅ Minimal config bestaat: {minimal_config_file}')
            
            import json
            with open(minimal_config_file, 'r') as f:
                minimal_config = json.load(f)
            
            print(f'📊 Minimal config landen: {list(minimal_config.get("countries", {}).keys())}')
            print(f'🏁 Minimal default land: {minimal_config.get("default_country")}')
        else:
            print(f'❌ Minimal config niet gevonden: {minimal_config_file}')
            
    except Exception as e:
        print(f'❌ Error lezen minimal config: {e}')

    print('\n✅ Test voltooid!')

if __name__ == "__main__":
    test_config_fallback() 