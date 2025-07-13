#!/usr/bin/env python3
"""
Simple test script to verify the Prompt Engineering Playground setup.
Run this after setting up the environment to check if everything works.
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000"
TEST_TIMEOUT = 30

async def test_health_endpoint() -> bool:
    """Test the health endpoint."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/health", timeout=TEST_TIMEOUT) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Health endpoint: OK")
                    print(f"   Status: {data.get('status')}")
                    return True
                else:
                    print(f"❌ Health endpoint failed: HTTP {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

async def test_api_docs() -> bool:
    """Test if API documentation is accessible."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/docs", timeout=TEST_TIMEOUT) as response:
                if response.status == 200:
                    print("✅ API documentation: OK")
                    return True
                else:
                    print(f"❌ API documentation failed: HTTP {response.status}")
                    return False
    except Exception as e:
        print(f"❌ API documentation error: {e}")
        return False

async def test_templates_endpoint() -> bool:
    """Test the templates endpoint."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/api/templates", timeout=TEST_TIMEOUT) as response:
                if response.status == 200:
                    data = await response.json()
                    templates_count = len(data.get('data', []))
                    print(f"✅ Templates endpoint: OK ({templates_count} templates)")
                    return True
                else:
                    print(f"❌ Templates endpoint failed: HTTP {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Templates endpoint error: {e}")
        return False

async def test_simple_experiment() -> bool:
    """Test running a simple experiment."""
    try:
        experiment_data = {
            "prompt": "What is 2 + 2?",
            "model_config": {
                "provider": "openai",
                "model_name": "gpt-3.5-turbo",
                "temperature": 0.7,
                "max_tokens": 100
            },
            "template_id": None,
            "user_id": "test_user"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/api/experiments/run",
                json=experiment_data,
                timeout=TEST_TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Simple experiment: OK")
                    print(f"   Response preview: {data.get('data', {}).get('response', '')[:50]}...")
                    return True
                elif response.status == 401:
                    print("⚠️  Simple experiment: API key not configured (expected)")
                    return True
                else:
                    print(f"❌ Simple experiment failed: HTTP {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Simple experiment error: {e}")
        return False

async def run_tests():
    """Run all tests."""
    print("🧪 Testing Prompt Engineering Playground API")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("API Documentation", test_api_docs),
        ("Templates Endpoint", test_templates_endpoint),
        ("Simple Experiment", test_simple_experiment),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        result = await test_func()
        results.append(result)
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    passed = sum(results)
    total = len(results)
    
    for i, (test_name, _) in enumerate(tests):
        status = "✅ PASS" if results[i] else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your setup is working correctly.")
    elif passed >= total - 1:
        print("⚠️  Most tests passed. Check API key configuration if needed.")
    else:
        print("❌ Multiple tests failed. Check your setup and try again.")
        print("\n💡 Troubleshooting tips:")
        print("   1. Make sure the backend server is running (./start-backend.sh)")
        print("   2. Check environment variables in backend/.env")
        print("   3. Verify the API is accessible at http://localhost:8000")
        print("   4. Check logs: docker-compose logs (if using Docker)")

if __name__ == "__main__":
    try:
        asyncio.run(run_tests())
    except KeyboardInterrupt:
        print("\n❌ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test runner error: {e}")
        sys.exit(1)
