import requests
import json

import os

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Please set GEMINI_API_KEY environment variable")
    exit(1)
model = "gemini-2.0-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{"text": "Hello"}]
    }]
}

response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response Body:", response.json())
