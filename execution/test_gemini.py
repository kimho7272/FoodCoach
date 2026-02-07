import os
import requests
from dotenv import load_dotenv

# Load environment variables from projects root
load_dotenv(dotenv_path="../.env")

def test_gemini_api():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment.")
        return

    print(f"Testing Gemini API with key: {api_key[:5]}...{api_key[-5:]}")
    
    # Try a simple text generation to test the key
    model = "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say 'Gemini API is working!' if you can hear me."}]
        }]
    }
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            result = response.json()
            text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"Success! Gemini Response: {text}")
        else:
            print(f"Failed! Status Code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_gemini_api()
