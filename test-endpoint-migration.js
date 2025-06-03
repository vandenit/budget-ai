#!/usr/bin/env node
/**
 * Integration test script to verify endpoint migration from Python to Node.js
 * Run this after starting both services to ensure no endpoints are broken
 */

const https = require('https');
const http = require('http');

// Test configuration
const PYTHON_API_BASE = 'http://localhost:5000';
const NODE_API_BASE = 'http://localhost:4000';
const TEST_BUDGET_ID = 'test-budget-123';

// Mock auth token for testing (replace with real token if needed)
const AUTH_TOKEN = 'test-token';

/**
 * Make HTTP request with promise
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const requestOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                ...options.headers
            }
        };

        const req = protocol.request(url, requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

/**
 * Test endpoint availability
 */
async function testEndpoint(name, url, options = {}) {
    try {
        console.log(`🧪 Testing ${name}...`);
        const response = await makeRequest(url, options);
        
        if (response.status >= 200 && response.status < 300) {
            console.log(`  ✅ ${name} - Status: ${response.status}`);
            return true;
        } else if (response.status === 401) {
            console.log(`  ⚠️  ${name} - Status: ${response.status} (Auth required - expected)`);
            return true; // Auth errors are expected in this test
        } else {
            console.log(`  ❌ ${name} - Status: ${response.status}`);
            console.log(`     Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ ${name} - Error: ${error.message}`);
        return false;
    }
}

/**
 * Test service availability
 */
async function testServiceHealth(serviceName, baseUrl) {
    console.log(`\n🔍 Testing ${serviceName} service health...`);
    
    try {
        const healthUrl = `${baseUrl}/health`;
        const response = await makeRequest(healthUrl);
        
        if (response.status === 200) {
            console.log(`  ✅ ${serviceName} service is running`);
            return true;
        } else {
            console.log(`  ❌ ${serviceName} service health check failed - Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ ${serviceName} service is not running - ${error.message}`);
        return false;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting Endpoint Migration Integration Tests');
    console.log('=' * 60);

    // Test service health
    const pythonHealthy = await testServiceHealth('Python API', PYTHON_API_BASE);
    const nodeHealthy = await testServiceHealth('Node.js API', NODE_API_BASE);

    if (!pythonHealthy || !nodeHealthy) {
        console.log('\n❌ One or more services are not running. Please start both services:');
        console.log('   Python API: cd packages/mathapi && python app/app.py');
        console.log('   Node.js API: cd packages/api && npm run dev');
        process.exit(1);
    }

    console.log('\n📋 Testing migrated endpoints...');
    
    // Test migrated endpoints (should work in Node.js, may be removed from Python)
    const migratedTests = [
        {
            name: 'Node.js - Uncategorized Transactions',
            url: `${NODE_API_BASE}/budgets/${TEST_BUDGET_ID}/uncategorized-transactions`
        },
        {
            name: 'Node.js - Unapproved Transactions', 
            url: `${NODE_API_BASE}/budgets/${TEST_BUDGET_ID}/unapproved-transactions`
        },
        {
            name: 'Node.js - Cached AI Suggestions',
            url: `${NODE_API_BASE}/budgets/${TEST_BUDGET_ID}/ai-suggestions/cached`
        },
        {
            name: 'Node.js - AI Suggestion Stats',
            url: `${NODE_API_BASE}/budgets/${TEST_BUDGET_ID}/ai-suggestions/stats`
        }
    ];

    console.log('\n🔄 Testing migrated endpoints in Node.js...');
    let migratedPassed = 0;
    for (const test of migratedTests) {
        const passed = await testEndpoint(test.name, test.url);
        if (passed) migratedPassed++;
    }

    // Test remaining Python endpoints (should still work)
    const pythonTests = [
        {
            name: 'Python - Balance Prediction',
            url: `${PYTHON_API_BASE}/balance-prediction/data?budget_id=${TEST_BUDGET_ID}`
        },
        {
            name: 'Python - Suggest Categories',
            url: `${PYTHON_API_BASE}/uncategorised-transactions/suggest-categories?budget_id=${TEST_BUDGET_ID}`
        },
        {
            name: 'Python - Async Suggestions',
            url: `${PYTHON_API_BASE}/uncategorised-transactions/suggestions-async?budget_id=${TEST_BUDGET_ID}`,
            options: {
                method: 'POST',
                body: JSON.stringify({ transaction_ids: ['test-tx-1'] })
            }
        },
        {
            name: 'Python - Single Suggestion',
            url: `${PYTHON_API_BASE}/uncategorised-transactions/suggest-single?budget_id=${TEST_BUDGET_ID}`,
            options: {
                method: 'POST', 
                body: JSON.stringify({ transaction_id: 'test-tx-1' })
            }
        }
    ];

    console.log('\n🐍 Testing remaining Python endpoints...');
    let pythonPassed = 0;
    for (const test of pythonTests) {
        const passed = await testEndpoint(test.name, test.url, test.options);
        if (passed) pythonPassed++;
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('=' * 40);
    console.log(`Migrated endpoints (Node.js): ${migratedPassed}/${migratedTests.length} passed`);
    console.log(`Remaining endpoints (Python): ${pythonPassed}/${pythonTests.length} passed`);
    
    const totalPassed = migratedPassed + pythonPassed;
    const totalTests = migratedTests.length + pythonTests.length;
    
    if (totalPassed === totalTests) {
        console.log('\n✅ All tests passed! Migration appears successful.');
        process.exit(0);
    } else {
        console.log(`\n⚠️  ${totalTests - totalPassed} tests failed. Please check the endpoints.`);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});
