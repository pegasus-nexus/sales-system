from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
from app.domain.models.contabilidad import (
    CuentaContable, TipoCuenta, NaturalezaCuenta
)

class ContabilidadService:
    @staticmethod
    async def seed_plan_cuentas(tenant_id: str, user_id: str) -> List[CuentaContable]:
        # Check if already seeded
        existing = await CuentaContable.find_one(
            CuentaContable.tenant_id == tenant_id,
            CuentaContable.is_active == True
        )
        if existing:
            return await ContabilidadService.get_plan_cuentas(tenant_id)
            
        cuentas_data = [
            # 1 ACTIVOS
            {"codigo": "1", "nombre": "ACTIVOS", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "nivel": 1, "es_cuenta_de_detalle": False},
            {"codigo": "1.1", "nombre": "Activo Corriente", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "1", "nivel": 2, "es_cuenta_de_detalle": False},
            {"codigo": "1.1.1", "nombre": "Caja y Bancos", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "1.1", "nivel": 3, "es_cuenta_de_detalle": True},
            {"codigo": "1.1.2", "nombre": "Cuentas por Cobrar", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "1.1", "nivel": 3, "es_cuenta_de_detalle": True},
            {"codigo": "1.1.3", "nombre": "Inventarios", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "1.1", "nivel": 3, "es_cuenta_de_detalle": True},
            {"codigo": "1.2", "nombre": "Activo No Corriente", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "1", "nivel": 2, "es_cuenta_de_detalle": False},
            {"codigo": "1.2.1", "nombre": "Propiedad, Planta y Equipo", "tipo": TipoCuenta.ACTIVO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "1.2", "nivel": 3, "es_cuenta_de_detalle": True},
            
            # 2 PASIVOS
            {"codigo": "2", "nombre": "PASIVOS", "tipo": TipoCuenta.PASIVO, "naturaleza": NaturalezaCuenta.ACREEDORA, "nivel": 1, "es_cuenta_de_detalle": False},
            {"codigo": "2.1", "nombre": "Pasivo Corriente", "tipo": TipoCuenta.PASIVO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "2", "nivel": 2, "es_cuenta_de_detalle": False},
            {"codigo": "2.1.1", "nombre": "Cuentas por Pagar", "tipo": TipoCuenta.PASIVO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "2.1", "nivel": 3, "es_cuenta_de_detalle": True},
            {"codigo": "2.1.2", "nombre": "Obligaciones Laborales", "tipo": TipoCuenta.PASIVO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "2.1", "nivel": 3, "es_cuenta_de_detalle": True},
            {"codigo": "2.2", "nombre": "Pasivo No Corriente", "tipo": TipoCuenta.PASIVO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "2", "nivel": 2, "es_cuenta_de_detalle": False},
            
            # 3 PATRIMONIO
            {"codigo": "3", "nombre": "PATRIMONIO", "tipo": TipoCuenta.PATRIMONIO, "naturaleza": NaturalezaCuenta.ACREEDORA, "nivel": 1, "es_cuenta_de_detalle": False},
            {"codigo": "3.1", "nombre": "Capital Social", "tipo": TipoCuenta.PATRIMONIO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "3", "nivel": 2, "es_cuenta_de_detalle": True},
            {"codigo": "3.2", "nombre": "Resultados Acumulados", "tipo": TipoCuenta.PATRIMONIO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "3", "nivel": 2, "es_cuenta_de_detalle": True},
            
            # 4 INGRESOS
            {"codigo": "4", "nombre": "INGRESOS", "tipo": TipoCuenta.INGRESO, "naturaleza": NaturalezaCuenta.ACREEDORA, "nivel": 1, "es_cuenta_de_detalle": False},
            {"codigo": "4.1", "nombre": "Ventas Netas", "tipo": TipoCuenta.INGRESO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "4", "nivel": 2, "es_cuenta_de_detalle": True},
            {"codigo": "4.2", "nombre": "Otros Ingresos", "tipo": TipoCuenta.INGRESO, "naturaleza": NaturalezaCuenta.ACREEDORA, "padre_id": "4", "nivel": 2, "es_cuenta_de_detalle": True},
            
            # 5 COSTOS Y GASTOS
            {"codigo": "5", "nombre": "COSTOS Y GASTOS", "tipo": TipoCuenta.COSTO, "naturaleza": NaturalezaCuenta.DEUDORA, "nivel": 1, "es_cuenta_de_detalle": False},
            {"codigo": "5.1", "nombre": "Costo de Ventas", "tipo": TipoCuenta.COSTO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "5", "nivel": 2, "es_cuenta_de_detalle": True},
            {"codigo": "5.2", "nombre": "Gastos Operativos", "tipo": TipoCuenta.GASTO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "5", "nivel": 2, "es_cuenta_de_detalle": True},
            {"codigo": "5.3", "nombre": "Gastos Administrativos", "tipo": TipoCuenta.GASTO, "naturaleza": NaturalezaCuenta.DEUDORA, "padre_id": "5", "nivel": 2, "es_cuenta_de_detalle": True},
        ]
        
        creadas = []
        for data in cuentas_data:
            cuenta = CuentaContable(
                tenant_id=tenant_id,
                **data
            )
            await cuenta.insert()
            creadas.append(cuenta)
            
        return creadas

    @staticmethod
    async def get_plan_cuentas(tenant_id: str) -> List[CuentaContable]:
        cuentas = await CuentaContable.find(
            CuentaContable.tenant_id == tenant_id,
            CuentaContable.is_active == True
        ).sort("codigo").to_list()
        return cuentas

    @staticmethod
    async def create_cuenta(tenant_id: str, data: Dict[str, Any], user_id: str) -> CuentaContable:
        cuenta = CuentaContable(
            tenant_id=tenant_id,
            codigo=data["codigo"],
            nombre=data["nombre"],
            tipo=TipoCuenta(data["tipo"]),
            naturaleza=NaturalezaCuenta(data["naturaleza"]),
            padre_id=data.get("padre_id"),
            nivel=data.get("nivel", 1),
            es_cuenta_de_detalle=data.get("es_cuenta_de_detalle", True),
            descripcion=data.get("descripcion")
        )
        await cuenta.insert()
        return cuenta

    @staticmethod
    async def update_cuenta(tenant_id: str, cuenta_id: str, data: Dict[str, Any], user_id: str) -> Optional[CuentaContable]:
        from bson import ObjectId
        cuenta = await CuentaContable.find_one(
            CuentaContable.id == ObjectId(cuenta_id),
            CuentaContable.tenant_id == tenant_id,
            CuentaContable.is_active == True
        )
        
        if not cuenta:
            return None
            
        if "nombre" in data:
            cuenta.nombre = data["nombre"]
        if "descripcion" in data:
            cuenta.descripcion = data["descripcion"]
        if "es_cuenta_de_detalle" in data:
            cuenta.es_cuenta_de_detalle = data["es_cuenta_de_detalle"]
            
        await cuenta.save()
        return cuenta
