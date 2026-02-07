
import requests
import json

SUPABASE_URL = "https://ahrmhfbiagjhrzohqsmf.supabase.co"
SUPABASE_KEY = "sb_publishable_azCVnn4OFdLd4vyyji55gA_l-f43-M1"

# Select latest 5 logs
url = f"{SUPABASE_URL}/rest/v1/food_logs?select=*&order=created_at.desc&limit=5"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

res = requests.get(url, headers=headers)
logs = res.json()
for log in logs:
    print(f"ID: {log['id']}, Food: {log['food_name']}, Image: {log.get('image_url')}")
