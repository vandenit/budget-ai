#!/usr/bin/env python3
"""
Main test suite for all validation functionality.
Runs AI category validation tests and apply-all service validation tests.
"""

import sys
import os

# Add the app directory to Python path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from .test_ai_category_validation import test_ai_category_validation
from .test_apply_all_service_validation import test_apply_all_service_validation

def run_all_validation_tests():
    """
    Run all validation tests and provide a comprehensive summary.
    """
    print('🧪 COMPREHENSIVE VALIDATION TEST SUITE')
    print('=' * 60)
    print('Testing all new AI category validation functionality')
    print('Added to fix "Ready to Assign" and invalid category issues')
    print('=' * 60)
    
    test_results = []
    
    # Run AI category validation tests
    print('\n🎯 PHASE 1: AI Category Validation Tests')
    print('-' * 50)
    ai_validation_passed = test_ai_category_validation()
    test_results.append(('AI Category Validation', ai_validation_passed))
    
    # Run apply-all service validation tests
    print('\n🎯 PHASE 2: Apply-All Service Validation Tests')
    print('-' * 50)
    service_validation_passed = test_apply_all_service_validation()
    test_results.append(('Apply-All Service Validation', service_validation_passed))
    
    # Summary
    print('\n' + '=' * 60)
    print('📊 VALIDATION TEST SUMMARY')
    print('=' * 60)
    
    all_passed = True
    for test_name, passed in test_results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:<35} {status}")
        if not passed:
            all_passed = False
    
    print('-' * 60)
    
    if all_passed:
        print('🎉 ALL VALIDATION TESTS PASSED!')
        print('✅ AI category validation is working correctly')
        print('✅ Apply-all service validation is working correctly')
        print('✅ "Ready to Assign" and "Uncategorized" are properly handled')
        print('✅ Case-insensitive category matching works')
        print('✅ Manual change learning is functioning')
        return True
    else:
        print('❌ SOME TESTS FAILED!')
        print('Please review the failed tests above and fix any issues.')
        return False

def run_specific_validation_tests():
    """
    Interactive test runner for specific test categories.
    """
    print('🔍 INTERACTIVE VALIDATION TEST RUNNER')
    print('=' * 50)
    print('Choose which validation tests to run:')
    print('1. AI Category Validation Tests')
    print('2. Apply-All Service Validation Tests') 
    print('3. All Validation Tests')
    print('4. Exit')
    
    while True:
        try:
            choice = input('\nEnter your choice (1-4): ').strip()
            
            if choice == '1':
                print('\n🧠 Running AI Category Validation Tests...')
                success = test_ai_category_validation()
                print(f"\nResult: {'✅ PASSED' if success else '❌ FAILED'}")
                
            elif choice == '2':
                print('\n🛡️ Running Apply-All Service Validation Tests...')
                success = test_apply_all_service_validation()
                print(f"\nResult: {'✅ PASSED' if success else '❌ FAILED'}")
                
            elif choice == '3':
                print('\n🧪 Running All Validation Tests...')
                success = run_all_validation_tests()
                print(f"\nOverall Result: {'✅ ALL PASSED' if success else '❌ SOME FAILED'}")
                
            elif choice == '4':
                print('👋 Exiting test runner.')
                break
                
            else:
                print('❌ Invalid choice. Please enter 1, 2, 3, or 4.')
                
        except KeyboardInterrupt:
            print('\n\n👋 Test runner interrupted. Exiting.')
            break
        except Exception as e:
            print(f'❌ Error running tests: {e}')

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run validation tests for AI categorization system')
    parser.add_argument('--interactive', '-i', action='store_true', 
                       help='Run in interactive mode for selecting specific tests')
    parser.add_argument('--quiet', '-q', action='store_true',
                       help='Run in quiet mode with minimal output')
    
    args = parser.parse_args()
    
    if args.interactive:
        run_specific_validation_tests()
    else:
        if not args.quiet:
            print('🚀 Running all validation tests...\n')
        
        success = run_all_validation_tests()
        
        if not args.quiet:
            print(f'\n🏁 Test suite completed: {"SUCCESS" if success else "FAILURE"}')
        
        # Exit with appropriate code for CI/CD systems
        sys.exit(0 if success else 1) 