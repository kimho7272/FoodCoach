import requests

import os

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Please set GEMINI_API_KEY environment variable")
    exit(1)
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
data = response.json()
if 'models' in data:
    for m in data['models']:
        print(m['name'])
else:
    print(data)
