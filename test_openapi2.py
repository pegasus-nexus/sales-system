import urllib.request
import json

try:
    req = urllib.request.Request('https://sales-system-aptb.onrender.com/api/v1/openapi.json')
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    print("Paths:", list(data.get("paths", {}).keys())[:5])
except Exception as e:
    print("Error:", e)
