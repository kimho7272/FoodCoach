
import requests
import json

SUPABASE_URL = "https://uekewhipucmtqehxtvfa.supabase.co"
SUPABASE_KEY = "sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA"

# Select latest 1 log
url = f"{SUPABASE_URL}/rest/v1/food_logs?select=*&limit=1"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

res = requests.get(url, headers=headers)
data = res.json()
if data:
    print(list(data[0].keys()))
else:
    print("No logs found")
