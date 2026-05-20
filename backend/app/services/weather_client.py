import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry
from datetime import datetime, timedelta

# Configurar cliente Open-Meteo con cache local y reintentos (robusto)
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Cochabamba, Bolivia
LATITUDE = -17.3895
LONGITUDE = -66.1568

class WeatherClient:
    @staticmethod
    async def get_historical_and_forecast_weather(days_historical=60, days_forecast=7) -> pd.DataFrame:
        """
        Descarga el clima histórico real y fusiona un pronóstico para los días futuros.
        Retorna un DataFrame de Pandas con: ['date', 'temp_max', 'temp_min', 'precipitation']
        """
        end_history = datetime.now()
        start_history = end_history - timedelta(days=days_historical)
        
        # 1. Petición al Archivo Histórico (Historical Weather API)
        url_hist = "https://archive-api.open-meteo.com/v1/archive"
        params_hist = {
            "latitude": LATITUDE,
            "longitude": LONGITUDE,
            "start_date": start_history.strftime('%Y-%m-%d'),
            "end_date": end_history.strftime('%Y-%m-%d'),
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "timezone": "America/La_Paz"
        }
        
        # 2. Petición al Pronóstico (Forecast API)
        url_fore = "https://api.open-meteo.com/v1/forecast"
        params_fore = {
            "latitude": LATITUDE,
            "longitude": LONGITUDE,
            "forecast_days": days_forecast + 1, # +1 para asegurar traslape de hoy
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "timezone": "America/La_Paz"
        }

        # Ejecutar peticiones
        responses_hist = openmeteo.weather_api(url_hist, params=params_hist)
        responses_fore = openmeteo.weather_api(url_fore, params=params_fore)

        response_hist = responses_hist[0]
        daily_hist = response_hist.Daily()
        time_hist = pd.date_range(
            start=pd.to_datetime(daily_hist.Time(), unit="s", utc=True),
            end=pd.to_datetime(daily_hist.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=daily_hist.Interval()),
            inclusive="left"
        ).tz_localize(None)

        df_hist = pd.DataFrame({
            "date": pd.to_datetime(time_hist).normalize(),
            "temp_max": daily_hist.Variables(0).ValuesAsNumpy(),
            "temp_min": daily_hist.Variables(1).ValuesAsNumpy(),
            "precipitation": daily_hist.Variables(2).ValuesAsNumpy()
        })

        # Procesar pronóstico
        response_fore = responses_fore[0]
        daily_fore = response_fore.Daily()
        time_fore = pd.date_range(
            start=pd.to_datetime(daily_fore.Time(), unit="s", utc=True),
            end=pd.to_datetime(daily_fore.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=daily_fore.Interval()),
            inclusive="left"
        ).tz_localize(None)

        df_fore = pd.DataFrame({
            "date": pd.to_datetime(time_fore).normalize(),
            "temp_max": daily_fore.Variables(0).ValuesAsNumpy(),
            "temp_min": daily_fore.Variables(1).ValuesAsNumpy(),
            "precipitation": daily_fore.Variables(2).ValuesAsNumpy()
        })

        # Fusionar ambos, eliminando duplicados (dando prioridad al histórico sobre hoy)
        df_combined = pd.concat([df_hist, df_fore]).drop_duplicates(subset=['date'], keep='first')
        
        # Llenar nulos (si hubiera algún fallo en satélite)
        df_combined = df_combined.fillna(0)
        
        return df_combined.sort_values('date')
