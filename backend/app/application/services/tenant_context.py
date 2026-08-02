import asyncio
import time
from typing import Dict, Any, List
from app.domain.models.sucursal import Sucursal
from app.domain.models.category import Category

class TenantContextCache:
    _cache: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def get_sucursales(cls, tenant_id: str, ttl_seconds: int = 300) -> List[Sucursal]:
        """
        Retorna la lista de sucursales cacheadas para el tenant.
        Si expiraron o no existen, las recarga desde la BD.
        """
        cache_key = f"{tenant_id}_sucursales"
        now = time.time()
        
        entry = cls._cache.get(cache_key)
        if entry and (now - entry['timestamp'] < ttl_seconds):
            return entry['data']
            
        # Si no está en caché o expiró, consultar a DB
        sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
        cls._cache[cache_key] = {
            'timestamp': now,
            'data': sucursales
        }
        return sucursales

    @classmethod
    async def get_sucursal_map(cls, tenant_id: str) -> Dict[str, str]:
        """
        Retorna un dict { 'sucursal_id_str': 'Nombre de la Sucursal' }
        """
        sucursales = await cls.get_sucursales(tenant_id)
        return {str(s.id): s.nombre for s in sucursales}
        
    @classmethod
    async def get_categorias(cls, tenant_id: str, ttl_seconds: int = 600) -> List[Category]:
        """
        Retorna la lista de categorías (ttl por defecto 10 min).
        """
        cache_key = f"{tenant_id}_categorias"
        now = time.time()
        
        entry = cls._cache.get(cache_key)
        if entry and (now - entry['timestamp'] < ttl_seconds):
            return entry['data']
            
        categorias = await Category.find(Category.tenant_id == tenant_id).to_list()
        cls._cache[cache_key] = {
            'timestamp': now,
            'data': categorias
        }
        return categorias
        
    @classmethod
    def clear_cache(cls, tenant_id: str):
        """Limpia todo el caché de un tenant específico."""
        keys_to_remove = [k for k in cls._cache.keys() if k.startswith(f"{tenant_id}_")]
        for k in keys_to_remove:
            del cls._cache[k]
