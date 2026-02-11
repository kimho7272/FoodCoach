import requests
import json

api_key = "AIzaSyAnVQUd8BxoA6W4YnWtzVLAq7x9DJ8pMhY"
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
