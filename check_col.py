import requests
import os

headers = {
    "apikey": "sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA",
    "Authorization": "Bearer sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA"
}

url = "https://uekewhipucmtqehxtvfa.supabase.co/rest/v1/profiles?select=target_calories&limit=1"

res = requests.get(url, headers=headers)
print(res.status_code)
print(res.json())
