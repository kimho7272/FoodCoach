
import requests
import json

SUPABASE_URL = "https://uekewhipucmtqehxtvfa.supabase.co"
SUPABASE_KEY = "sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA"

# Select latest 5 logs
url = f"{SUPABASE_URL}/rest/v1/food_logs?select=*&order=created_at.desc&limit=5"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

try:
    res = requests.get(url, headers=headers)
    logs = res.json()
    if isinstance(logs, list):
        for log in logs:
            print(f"ID: {log['id']}, Food: {log['food_name']}, Image: {log.get('image_url')}")
    else:
        print(f"Error response: {logs}")
except Exception as e:
    print(f"Failed to check logs: {e}")
