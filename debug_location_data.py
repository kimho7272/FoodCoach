
import requests
import json

SUPABASE_URL = "https://uekewhipucmtqehxtvfa.supabase.co"
SUPABASE_KEY = "sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA"

# First, check total count of logs
count_url = f"{SUPABASE_URL}/rest/v1/food_logs?select=count"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

try:
    res = requests.get(count_url, headers=headers)
    print(f"Total logs check: {res.text}")
    
    # Select latest 10 logs with all potentially relevant fields
    url = f"{SUPABASE_URL}/rest/v1/food_logs?select=*&order=created_at.desc&limit=10"
    res = requests.get(url, headers=headers)
    logs = res.json()
    
    if isinstance(logs, list):
        if not logs:
            print("No logs found in the table.")
        else:
            print(f"Found {len(logs)} logs.")
            print(f"{'ID':<5} | {'Food':<15} | {'Place':<20} | {'Lat':<10} | {'Lng':<10}")
            print("-" * 80)
            for log in logs:
                fid = str(log.get('id', 'N/A'))[:5]
                food = str(log.get('food_name', 'N/A'))[:15]
                place = str(log.get('place_name', 'NULL'))[:20]
                lat = str(log.get('location_lat', 'NULL'))[:10]
                lng = str(log.get('location_lng', 'NULL'))[:10]
                print(f"{fid:<5} | {food:<15} | {place:<20} | {lat:<10} | {lng:<10}")
                
                # Print available keys to check for schema mismatches
                if logs.index(log) == 0:
                    print(f"\nExample log keys: {list(log.keys())}")
    else:
        print(f"Error response: {logs}")
except Exception as e:
    print(f"Failed to check logs: {e}")
