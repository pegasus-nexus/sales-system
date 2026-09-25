import httpx
import asyncio
from bs4 import BeautifulSoup
from typing import Dict, Any
from datetime import datetime, timedelta

class ExchangeService:
    _cache: Dict[str, Any] = {}
    _cache_ttl = timedelta(minutes=30)
    _last_fetched = None

    @classmethod
    async def get_rates(cls) -> Dict[str, Any]:
        now = datetime.now()
        if cls._cache and cls._last_fetched and (now - cls._last_fetched) < cls._cache_ttl:
            return cls._cache

        bcb_rate = await cls._fetch_bcb()
        binance_rate = await cls._fetch_binance()

        cls._cache = {
            "bcb_oficial": bcb_rate,
            "binance_p2p": binance_rate,
            "last_updated": now.strftime("%Y-%m-%d %H:%M:%S")
        }
        cls._last_fetched = now
        return cls._cache

    @classmethod
    async def _fetch_bcb(cls) -> float:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"User-Agent": "Mozilla/5.0"}
                r = await client.get("https://www.bcb.gob.bo/", headers=headers)
                soup = BeautifulSoup(r.text, 'html.parser')
                # find any div or span with class 'bcb-tco-num'
                el = soup.find(class_='bcb-tco-num')
                if el:
                    # e.g. "12,22" -> 12.22
                    val = el.get_text(strip=True).replace(",", ".")
                    return float(val)
                return 6.96 # fallback to historical peg if website changes
        except Exception as e:
            print("BCB fetch error:", e)
            return 6.96

    @classmethod
    async def _fetch_binance(cls) -> float:
        try:
            url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
            headers = {
                "Accept": "*/*",
                "content-type": "application/json",
                "User-Agent": "Mozilla/5.0"
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
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(url, headers=headers, json=payload)
                data = r.json()
                rates = []
                for adv in data.get("data", []):
                    price = adv.get("adv", {}).get("price")
                    if price:
                        rates.append(float(price))
                if rates:
                    return round(sum(rates[:3]) / min(len(rates), 3), 2)
                return 0.0
        except Exception as e:
            print("Binance fetch error:", e)
            return 0.0
