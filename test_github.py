import urllib.request
import json

try:
    req = urllib.request.Request('https://api.github.com/repos/pegasus-nexus/sales-system/actions/runs?per_page=3')
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    for run in data.get('workflow_runs', []):
        print(f"Commit: {run['head_commit']['message'].split('\n')[0]}")
        print(f"Status: {run['status']} - Conclusion: {run['conclusion']}")
        print(f"HTML URL: {run['html_url']}")
        print("---")
except Exception as e:
    print("Error:", e)
