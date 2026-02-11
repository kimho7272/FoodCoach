import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Use hardcoded ones from check_schema.py as backup if .env is missing or in wrong place
    SUPABASE_URL = "https://uekewhipucmtqehxtvfa.supabase.co"
    SUPABASE_KEY = os.getenv("GEMINI_API_KEY") # Wait, check_schema used a different key format

# Let's just use the ones from check_schema.py style but for profiles
headers = {
    "apikey": "sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA",
    "Authorization": "Bearer sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA"
}

url = "https://uekewhipucmtqehxtvfa.supabase.co/rest/v1/profiles?select=*&limit=1"

try:
    res = requests.get(url, headers=headers)
    data = res.json()
    if isinstance(data, list) and len(data) > 0:
        print("Columns in 'profiles' table:")
        print(list(data[0].keys()))
    else:
        print("Empty or error response:", data)
except Exception as e:
    print("Error connecting to Supabase:", e)
