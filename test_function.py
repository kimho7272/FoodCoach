import requests
import json

url = "https://uekewhipucmtqehxtvfa.supabase.co/functions/v1/analyze-meal"
anon_key = "sb_publishable_odMKssfy2tuWvYgqtEdr4w_NE7Li9BA"

headers = {
    "apikey": anon_key,
    "Content-Type": "application/json"
}

dummy_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

payload = {
    "base64Image": dummy_base64,
}

response = requests.post(url, headers=headers, json=payload)
print("Status Code:", response.status_code)
print("Response:", response.text)
