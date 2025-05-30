#!/usr/bin/env python3
"""
Cleanup script to fix raw payee mappings and replace them with preprocessed versions.
"""

from app.payee_mappings_mongo import MongoPayeeMappingsManager

def cleanup_raw_mappings():
    budget_id = '7812a588-8c0d-40fe-b6d9-6da6d7025056'
    manager = MongoPayeeMappingsManager(budget_id)

    print('🧹 Cleaning up raw payee mappings...')

    # Get current mappings
    mappings = manager.get_all_mappings()
    print(f'Found {len(mappings)} existing mappings')

    # Process problematic mappings
    cleanup_mappings = [
        ('470843 be2018 antwerpen betaling met kbc-debetkaart via bancontact 05-05-2025 om 14.08 uur 6703 42xx xxxx x201 3 vos sarah', 'Onverwacht'),
        ('monica campus vzw be2100 deurne betaling met kbc-debetkaart via bancontact 03-05-2025 om 17.46 uur 6703 42xx xxxx x601 4 van den broeck filip', 'Medisch')
    ]

    for raw_payee, category in cleanup_mappings:
        if raw_payee in mappings:
            preprocessed = manager.test_preprocessing(raw_payee)
            print(f'Removing: {raw_payee[:50]}...')
            print(f'Preprocessed: "{preprocessed}" -> {category}')
            
            # Remove old raw mapping
            manager.remove_mapping(raw_payee)
            
            # Add new preprocessed mapping
            manager.add_mapping(raw_payee, category)
            
    print('✅ Cleanup completed!')
    print('Final mappings:')
    new_mappings = manager.get_all_mappings()
    for k, v in new_mappings.items():
        print(f'  "{k}" -> {v}')

if __name__ == '__main__':
    cleanup_raw_mappings() 