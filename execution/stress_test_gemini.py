import os
import requests
import time
import concurrent.futures
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env")

def call_gemini(api_key, request_id):
    model = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": f"Request {request_id}: Say 'OK'"}]
        }]
    }
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        start_time = time.time()
        response = requests.post(url, json=payload, headers=headers)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            return True, response.status_code, duration, None
        else:
            return False, response.status_code, duration, response.json()
    except Exception as e:
        return False, 500, 0, str(e)

def run_stress_test():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment.")
        return

    print(f"--- Starting Gemini API Plan Stress Test ---")
    print(f"API Key: {api_key[:5]}...{api_key[-5:]}")
    
    # Testing with 20 concurrent requests. 
    # Free tier for Gemini 1.5 Flash usually has limits around 15 RPM.
    # Pay-as-you-go has much higher limits (2000 RPM).
    num_requests = 20
    print(f"Sending {num_requests} concurrent requests to check rate limits...")
    
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(call_gemini, api_key, i) for i in range(num_requests)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    success_count = sum(1 for r in results if r[0])
    fail_count = num_requests - success_count
    
    print(f"\nTest Results Summary:")
    print(f"- Total Requests: {num_requests}")
    print(f"- Success: {success_count}")
    print(f"- Failed: {fail_count}")
    
    rate_limited = False
    for success, status, duration, error_data in results:
        if status == 429:
            rate_limited = True
            print(f"Rate limited (429) detected: {error_data}")
            break

    print("\n--- Conclusion ---")
    if rate_limited:
        print("RESULT: Likely FREE TIER (Rate Limited).")
        print("We hit the 429 (Too Many Requests) error, which is common on the free tier after just a few requests.")
    elif success_count == num_requests:
        print("RESULT: Likely PRO PLAN (Pay-as-you-go).")
        print("All 20 concurrent requests succeeded without any 429 errors. This strongly indicates a higher tier quota.")
    else:
        print("RESULT: Inconclusive. Some requests failed but not necessarily due to rate limits.")
        for r in results:
            if not r[0]:
                print(f"Error ({r[1]}): {r[3]}")

if __name__ == "__main__":
    run_stress_test()
