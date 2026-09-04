from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException
from pydantic import BaseModel
from beanie.operators import In

from app.domain.models.comunidad import ComunidadUser, PremioComunidad, VisitaRegistro

class ReclamoInput(BaseModel):
    telefono: str
    nombre: str
    apellido: str
    email: str
    premio: PremioComunidad

class ComunidadService:
    @staticmethod
    async def registrar_visita(tenant_id: str, ip: str, user_agent: str, endpoint: str):
        visita = VisitaRegistro(
            tenant_id=tenant_id,
            ip=ip,
            user_agent=user_agent,
            endpoint=endpoint
        )
        await visita.insert()
        return visita

    @staticmethod
    async def check_phone(tenant_id: str, telefono: str) -> ComunidadUser:
        """
        Verifica si el teléfono ya existe. Si no, lo crea de forma temporal (solo teléfono) 
        para ir trackeando sus visitas.
        """
        user = await ComunidadUser.find_one(
            ComunidadUser.tenant_id == tenant_id,
            ComunidadUser.telefono == telefono
        )
        
        if not user:
            user = ComunidadUser(tenant_id=tenant_id, telefono=telefono)
            await user.insert()
            
        # Aumentar contador de visitas de este usuario
        user.visitas_pagina += 1
        user.ultima_visita = datetime.utcnow()
        await user.save()
        
        return user

    @staticmethod
    async def reclamar_premio(tenant_id: str, data: ReclamoInput) -> ComunidadUser:
        """
        Reclama el beneficio de la comunidad.
        """
        user = await ComunidadUser.find_one(
            ComunidadUser.tenant_id == tenant_id,
            ComunidadUser.telefono == data.telefono
        )
        
        if not user:
            # En caso raro de que no haya hecho check_phone antes
            user = ComunidadUser(tenant_id=tenant_id, telefono=data.telefono)
            
        if user.ha_reclamado:
            raise HTTPException(status_code=400, detail="Este número de teléfono ya ha reclamado un premio.")
            
        user.nombre = data.nombre
        user.apellido = data.apellido
        user.email = data.email
        user.premio_reclamado = data.premio
        user.ha_reclamado = True
        user.reclamado_at = datetime.utcnow()
        
        await user.save()
        
        # Aquí es donde se conectaría con WhatsApp (Ej: Twilio, Gupshup, API local, etc.)
        # await enviar_whatsapp(user.telefono, f"¡Hola {user.nombre}! Has reclamado tu {user.premio_reclamado}.")
        
        return user

    @staticmethod
    async def registrar_miembro_web(tenant_id: str, data: dict):
        """
        Registra un cliente desde la página web y lo etiqueta como miembro de la comunidad
        generando su número de tarjeta de fidelización.
        """
        from app.domain.models.cliente import Cliente
        import random
        import string

        telefono = data.get("telefono")
        email = data.get("email")
        
        # Buscar cliente existente por teléfono o email
        cliente = None
        if telefono:
            cliente = await Cliente.find_one({"tenant_id": tenant_id, "telefono": telefono})
        if not cliente and email:
            cliente = await Cliente.find_one({"tenant_id": tenant_id, "email": email})

        if not cliente:
            cliente = Cliente(
                tenant_id=tenant_id,
                nombre=data.get("nombre", "Usuario Web"),
                telefono=telefono,
                email=email,
                is_miembro_comunidad=True
            )
        else:
            cliente.nombre = data.get("nombre", cliente.nombre)
            cliente.is_miembro_comunidad = True
            
        # Generar número de tarjeta si no tiene
        if not cliente.numero_tarjeta:
            random_code = ''.join(random.choices(string.digits, k=6))
            cliente.numero_tarjeta = f"TAB-{random_code}"

        await cliente.save()
        return cliente


    @staticmethod
    async def get_premios_uso(tenant_id: str):
        from app.domain.models.cliente import Cliente
        
        # Aggregate to count the usage of each reward
        pipeline = [
            {"$match": {"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_canjeados": {"$exists": True, "$type": "array", "$not": {"$size": 0}}}},
            {"$unwind": "$datos_crm.premios_canjeados"},
            {"$group": {"_id": "$datos_crm.premios_canjeados", "count": {"$sum": 1}}}
        ]
        
        counts = await Cliente.get_motor_collection().aggregate(pipeline).to_list(length=None)
        
        result = {}
        for c in counts:
            result[c["_id"]] = c["count"]
            
        return result

    @staticmethod
    async def get_stats(tenant_id: str):

        from app.domain.models.cliente import Cliente
        total_registrados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True}).count()
        total_reclamados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_canjeados.0": {"$exists": True}}).count()
        total_visitas_globales = await VisitaRegistro.find({"tenant_id": tenant_id}).count()
        return {
            "total_registrados": total_registrados,
            "total_reclamados": total_reclamados,
            "total_visitas_globales": total_visitas_globales,
            "tasa_conversion": round((total_reclamados / total_registrados * 100), 2) if total_registrados > 0 else 0
        }
    @staticmethod
    async def get_users(tenant_id: str, limit: int = 100, skip: int = 0) -> List[ComunidadUser]:
        return await ComunidadUser.find(
            ComunidadUser.tenant_id == tenant_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def get_miembros_comunidad(tenant_id: str, limit: int = 100, skip: int = 0, search: Optional[str] = None):
        from app.domain.models.cliente import Cliente
        from app.domain.models.sale import Sale
        
        query = {
            "tenant_id": tenant_id,
            "is_miembro_comunidad": True
        }
        
        if search:
            query["$or"] = [
                {"nombre": {"$regex": search, "$options": "i"}},
                {"numero_tarjeta": {"$regex": search, "$options": "i"}},
                {"telefono": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"nit_ci": {"$regex": search, "$options": "i"}}
            ]
        
        miembros = await Cliente.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Manual Join for CRM metrics
        if not miembros:
            return {"items": [], "total": 0, "page": (skip // limit) + 1, "limit": limit}
            
        cliente_ids = [str(m.id) for m in miembros]
        
        from beanie.operators import In
        
        # Fetch matching sales
        sales = await Sale.find(
            Sale.tenant_id == tenant_id,
            In(Sale.cliente_id, cliente_ids)
        ).to_list()
        
        # Group by cliente_id
        from collections import defaultdict
        sales_by_client = defaultdict(list)
        for sale in sales:
            if sale.cliente_id:
                sales_by_client[sale.cliente_id].append(sale)
                
        # Build enriched results
        result = []
        for m in miembros:
            m_dict = m.dict(exclude={"id"})
            m_dict["_id"] = str(m.id)
            m_dict["id"] = str(m.id)
            
            client_sales = sales_by_client.get(str(m.id), [])
            client_sales.sort(key=lambda x: x.created_at, reverse=True)
            
            m_dict["total_compras"] = len(client_sales)
            if client_sales:
                m_dict["ultima_compra_fecha"] = client_sales[0].created_at
                m_dict["estado_visita"] = "Comprador"
            else:
                m_dict["ultima_compra_fecha"] = None
                m_dict["estado_visita"] = "Solo Visitó"
                
            # Extraer premios_canjeados de datos_crm
            datos_crm = getattr(m, 'datos_crm', {}) or {}
            m_dict["premios_canjeados"] = datos_crm.get("premios_canjeados", [])
            m_dict["premios_canjeados_fechas"] = datos_crm.get("premios_canjeados_fechas", {})
            
            result.append(m_dict)
            
        total_count = await Cliente.find(query).count()
        return {"items": result, "total": total_count, "page": (skip // limit) + 1, "limit": limit}
