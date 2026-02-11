import requests

api_key = "AIzaSyAnVQUd8BxoA6W4YnWtzVLAq7x9DJ8pMhY"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
data = response.json()
if 'models' in data:
    for m in data['models']:
        print(m['name'])
else:
    print(data)
