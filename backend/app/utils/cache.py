import asyncio
import time
from functools import wraps

MAX_CACHE_ENTRIES = 5  # Limitar entradas para no acumular DataFrames enormes en RAM

def ttl_cache(seconds: int = 120):
    """
    Decorador básico de caché asíncrono para guardar respuestas en memoria temporal.
    Esto protege a MongoDB contra ataques de tráfico o picos de uso en el Dashboard.
    Limita a MAX_CACHE_ENTRIES entradas para evitar OOM en servidores de 512MB.
    """
    cache = {}
    lock = asyncio.Lock()

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Crear una clave única a partir de los argumentos (fechas, tenant_id, filtros)
            key = str(args) + str(kwargs)
            
            async with lock:
                if key in cache:
                    result, expiry = cache[key]
                    if time.time() < expiry:
                        return result
                    else:
                        del cache[key]
            
            # Si no está en caché (o ya expiró), ejecutar la función original contra MongoDB
            result = await func(*args, **kwargs)
            
            # Guardar el nuevo resultado limitando el acceso concurrente al diccionario
            async with lock:
                # Evictar entradas antiguas si excedemos el límite
                if len(cache) >= MAX_CACHE_ENTRIES:
                    oldest_key = min(cache, key=lambda k: cache[k][1])
                    del cache[oldest_key]
                cache[key] = (result, time.time() + seconds)
            
            return result
        return wrapper
    return decorator

