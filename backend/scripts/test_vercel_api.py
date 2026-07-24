import requests

def run():
    # Attempt to query Vercel API directly
    url = "https://sales-system-kappa.vercel.app/api/v1/analytics/bcg?start_date=2026-06-01T04:00:00.000Z&end_date=2026-07-01T03:59:59.999Z"
    # Wait, we need auth. But let's see if we get 401 or 403.
    res = requests.get(url)
    print(res.status_code, res.text)
    
if __name__ == '__main__':
    run()
