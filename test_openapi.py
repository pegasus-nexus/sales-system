import urllib.request
import json

try:
    req = urllib.request.Request('https://sales-system-aptb.onrender.com/openapi.json')
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    paths = data.get("paths", {})
    if "/api/v1/dashboard-matriz/exchange-rates" in paths:
        print("Endpoint EXISTS in production docs.")
    else:
        print("Endpoint DOES NOT EXIST in production docs.")
except Exception as e:
    print("Error:", e)
