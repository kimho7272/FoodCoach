
import requests
import json

SUPABASE_URL = "https://ahrmhfbiagjhrzohqsmf.supabase.co"
SUPABASE_KEY = "sb_publishable_azCVnn4OFdLd4vyyji55gA_l-f43-M1"

url = f"{SUPABASE_URL}/storage/v1/bucket"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}
payload = {
    "id": "meal-images",
    "name": "meal-images",
    "public": True
}

res = requests.post(url, headers=headers, json=payload)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
