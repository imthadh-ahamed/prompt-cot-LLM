import requests
import json

# Test the backend directly to see how it handles quota errors
def test_experiment_endpoint():
    url = "http://localhost:8000/api/experiments"
    
    payload = {
        "prompt": "What is the capital of France?",
        "model_configs": [
            {
                "provider": "openai",
                "model_name": "gpt-3.5-turbo", 
                "temperature": 0.7,
                "max_tokens": 100
            }
        ],
        "num_runs": 1,
        "enable_ab_testing": False
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("Testing experiment endpoint...")
    print(f"Request URL: {url}")
    print(f"Request payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response content: {json.dumps(response.json(), indent=2)}")
        
        # Check if demo mode was triggered
        result = response.json()
        if "responses" in result:
            for resp in result["responses"]:
                if "response" in resp and ("Demo Mode" in resp["response"] or "Fallback Mode" in resp["response"]):
                    print("✅ Demo/Fallback mode correctly triggered!")
                    return True
        
        print("❌ Demo mode was not triggered")
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_experiment_endpoint()
