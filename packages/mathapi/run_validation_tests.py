#!/usr/bin/env python3
"""
Simple test runner for AI category validation tests.
Run this script to test all the new validation functionality.
"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_validation_tests():
    """Run all validation tests and provide summary"""
    print('🧪 AI Category Validation Test Suite')
    print('=' * 50)
    print('Testing validation fixes for "Ready to Assign" and invalid categories')
    print()
    
    try:
        # Import and run AI category validation tests
        from app.tests.unit.test_ai_category_validation import test_ai_category_validation
        print('🧠 Running AI Category Validation Tests...')
        ai_passed = test_ai_category_validation()
        
        print('\n' + '-' * 50 + '\n')
        
        # Import and run service validation tests
        from app.tests.unit.test_apply_all_service_validation import test_apply_all_service_validation
        print('🛡️ Running Apply-All Service Validation Tests...')
        service_passed = test_apply_all_service_validation()
        
        # Summary
        print('\n' + '=' * 50)
        print('📊 VALIDATION TEST SUMMARY')
        print('=' * 50)
        
        ai_status = "✅ PASSED" if ai_passed else "❌ FAILED"
        service_status = "✅ PASSED" if service_passed else "❌ FAILED"
        
        print(f"AI Category Validation:       {ai_status}")
        print(f"Apply-All Service Validation: {service_status}")
        
        if ai_passed and service_passed:
            print('\n🎉 ALL VALIDATION TESTS PASSED!')
            print('✅ Ready to Assign handling works correctly')
            print('✅ Invalid category validation works correctly')
            print('✅ Case-insensitive matching works correctly')
            print('✅ Manual change learning works correctly')
            return True
        else:
            print('\n❌ SOME TESTS FAILED!')
            print('Please check the test output above for details.')
            return False
            
    except ImportError as e:
        print(f'❌ Import error: {e}')
        print('Make sure you are running this from the mathapi directory.')
        return False
    except Exception as e:
        print(f'❌ Unexpected error: {e}')
        return False

if __name__ == "__main__":
    success = run_validation_tests()
    sys.exit(0 if success else 1) 