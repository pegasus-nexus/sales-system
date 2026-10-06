import httpx
import json

def get_binance_p2p():
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    headers = {
        "Accept": "*/*",
        "content-type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
    }
    
    payload = {
        "proMerchantAds": False,
        "page": 1,
        "rows": 5,
        "payTypes": [],
        "countries": [],
        "publisherType": None,
        "fiat": "BOB",
        "tradeType": "BUY",
        "asset": "USDT",
        "merchantCheck": False
    }

    try:
        r = httpx.post(url, headers=headers, json=payload, timeout=10.0)
        data = r.json()
        rates = []
        for adv in data.get("data", []):
            price = adv.get("adv", {}).get("price")
            if price:
                rates.append(float(price))
        if rates:
            return sum(rates[:3]) / min(len(rates), 3)
        return None
    except Exception as e:
        print("Error:", e)
        return None

if __name__ == "__main__":
    print("Binance P2P:", get_binance_p2p())
