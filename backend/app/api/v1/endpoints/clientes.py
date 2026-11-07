from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
from bson import ObjectId
from typing import Annotated
from pydantic import BeforeValidator

# Helper to capture ObjectId and convert to string for the API response
PyObjectId = Annotated[str, BeforeValidator(str)]

from app.domain.models.cliente import Cliente, TipoCliente
from app.domain.models.user import User
from app.domain.models.client_wallet import ClientWallet
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

class ClienteCreate(BaseModel):
    nombre: str = Field(..., description="Nombre completo o razón social")
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    lista_precio_id: Optional[str] = None
    tipo_cliente: TipoCliente = TipoCliente.ACTIVO
    preferencias_alimenticias: List[str] = Field(default_factory=list)
    datos_crm: dict = Field(default_factory=dict)

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    lista_precio_id: Optional[str] = None
    is_active: Optional[bool] = None
    tipo_cliente: Optional[TipoCliente] = None
    preferencias_alimenticias: Optional[List[str]] = None
    datos_crm: Optional[dict] = None

class ClienteResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    tenant_id: str
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    lista_precio_id: Optional[str] = None
    tipo_cliente: TipoCliente
    preferencias_alimenticias: List[str]
    datos_crm: dict
    total_compras: float
    cantidad_compras: int
    ultima_compra_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(populate_by_name=True)


@router.get("/clientes", response_model=List[ClienteResponse])
async def listar_clientes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    q: Optional[str] = Query(None, description="Buscar por nombre, NIT o teléfono"),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    filters = [Cliente.tenant_id == tenant_id, Cliente.is_active == True]
    
    if q and q.strip():
        import re
        from beanie.operators import Or, RegEx
        
        # Escapar caracteres especiales para evitar errores de regex y permitir búsqueda literal
        safe_q = re.escape(q.strip())
        
        # Filtro de búsqueda por nombre, nit o teléfono
        search_filter = Or(
            RegEx(Cliente.nombre, safe_q, options="i"),
            RegEx(Cliente.nit_ci, safe_q, options="i"),
            RegEx(Cliente.telefono, safe_q, options="i")
        )
        filters.append(search_filter)
        
    clientes = await Cliente.find(*filters).skip(skip).limit(limit).sort("-created_at").to_list()
    
    return clientes


@router.post("/clientes", response_model=ClienteResponse)
async def crear_cliente(
    data: ClienteCreate,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    
    # 1. Validación de NIT/CI único por tenant (homónimos permitidos, pero NIT único)
    if data.nit_ci and data.nit_ci.strip():
        nit_clean = data.nit_ci.strip()
        existing_nit = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.nit_ci == nit_clean,
            Cliente.is_active == True
        )
        if existing_nit:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cliente activo con este NIT/CI ({nit_clean}): '{existing_nit.nombre}'."
            )

    # 2. Validación de Celular/Teléfono único por tenant
    if data.telefono and data.telefono.strip():
        tel_clean = data.telefono.strip()
        existing_tel = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.telefono == tel_clean,
            Cliente.is_active == True
        )
        if existing_tel:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cliente activo con este número de celular/teléfono ({tel_clean}): '{existing_tel.nombre}'."
            )

    # 3. Validación de Correo Electrónico único por tenant
    if data.email and data.email.strip():
        email_clean = data.email.strip().lower()
        existing_email = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.email == email_clean,
            Cliente.is_active == True
        )
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cliente activo con este correo electrónico ({email_clean}): '{existing_email.nombre}'."
            )

    cliente = Cliente(
        tenant_id=tenant_id,
        nombre=data.nombre.strip(),
        telefono=data.telefono.strip() if data.telefono else None,
        email=data.email.strip().lower() if data.email else None,
        nit_ci=data.nit_ci.strip() if data.nit_ci else None,
        direccion=data.direccion,
        notas=data.notas,
        lista_precio_id=data.lista_precio_id,
        tipo_cliente=data.tipo_cliente,
        preferencias_alimenticias=data.preferencias_alimenticias,
        datos_crm=data.datos_crm
    )
    await cliente.create()
    return cliente


@router.get("/clientes/by-nit/{nit}", response_model=Optional[ClienteResponse])
async def obtener_cliente_por_nit(
    nit: str,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    nit_clean = nit.strip()
    if not nit_clean:
        return None

    import re
    nit_digits = re.sub(r"\D", "", nit_clean)
    conditions = [{"nit_ci": nit_clean}]
    if nit_digits and nit_digits != nit_clean:
        conditions.append({"nit_ci": nit_digits})

    query = {
        "tenant_id": tenant_id,
        "is_active": True,
        "$or": conditions
    }
    cliente = await Cliente.find(query).sort("-created_at").first_or_none()
    return cliente


@router.get("/clientes/check-homonimo")
async def check_homonimo_endpoint(
    nombre: Optional[str] = Query(None, description="Nombre o razón social a evaluar"),
    nit_ci: Optional[str] = Query(None, description="NIT/CI a evaluar"),
    telefono: Optional[str] = Query(None, description="Teléfono a evaluar"),
    email: Optional[str] = Query(None, description="Email a evaluar"),
    exclude_id: Optional[str] = Query(None, description="ID del cliente a excluir en edición"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Evalúa si un nombre ya existe (homónimo) y verifica que los datos únicos (NIT/CI, celular, correo) no colisionen.
    """
    tenant_id = current_user.tenant_id or "default"
    result = {
        "es_homonimo": False,
        "homonimo_count": 0,
        "homonimo_nombres": [],
        "duplicado_nit": None,
        "duplicado_telefono": None,
        "duplicado_email": None,
    }

    from bson import ObjectId
    exclude_oid = None
    if exclude_id and len(exclude_id) == 24:
        try:
            exclude_oid = ObjectId(exclude_id)
        except Exception:
            pass

    col = Cliente.get_pymongo_collection()

    # 1. Evaluar Homónimo por Nombre
    if nombre and nombre.strip():
        import re
        nom_clean = nombre.strip()
        query_nom = {
            "tenant_id": tenant_id,
            "is_active": True,
            "nombre": {"$regex": f"^{re.escape(nom_clean)}$", "$options": "i"}
        }
        if exclude_oid:
            query_nom["_id"] = {"$ne": exclude_oid}
        homonimos = await col.find(query_nom, {"nombre": 1, "nit_ci": 1, "telefono": 1}).to_list(10)
        if homonimos:
            result["es_homonimo"] = True
            result["homonimo_count"] = len(homonimos)
            result["homonimo_nombres"] = [h.get("nombre") for h in homonimos]

    # 2. Evaluar duplicado por NIT/CI
    if nit_ci and nit_ci.strip():
        nit_clean = nit_ci.strip()
        query_nit = {
            "tenant_id": tenant_id,
            "is_active": True,
            "nit_ci": nit_clean
        }
        if exclude_oid:
            query_nit["_id"] = {"$ne": exclude_oid}
        exist_nit = await col.find_one(query_nit, {"nombre": 1, "nit_ci": 1})
        if exist_nit:
            result["duplicado_nit"] = f"El NIT/CI {nit_clean} ya pertenece a '{exist_nit.get('nombre')}'."

    # 3. Evaluar duplicado por Teléfono
    if telefono and telefono.strip():
        tel_clean = telefono.strip()
        query_tel = {
            "tenant_id": tenant_id,
            "is_active": True,
            "telefono": tel_clean
        }
        if exclude_oid:
            query_tel["_id"] = {"$ne": exclude_oid}
        exist_tel = await col.find_one(query_tel, {"nombre": 1, "telefono": 1})
        if exist_tel:
            result["duplicado_telefono"] = f"El teléfono {tel_clean} ya pertenece a '{exist_tel.get('nombre')}'."

    # 4. Evaluar duplicado por Email
    if email and email.strip():
        email_clean = email.strip().lower()
        query_email = {
            "tenant_id": tenant_id,
            "is_active": True,
            "email": email_clean
        }
        if exclude_oid:
            query_email["_id"] = {"$ne": exclude_oid}
        exist_email = await col.find_one(query_email, {"nombre": 1, "email": 1})
        if exist_email:
            result["duplicado_email"] = f"El correo {email_clean} ya pertenece a '{exist_email.get('nombre')}'."

    return result


@router.get("/clientes/{cliente_id}", response_model=ClienteResponse)
async def obtener_cliente(
    cliente_id: str,
    current_user: User = Depends(get_current_active_user)
):
    from bson import ObjectId
    if not ObjectId.is_valid(cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente = await Cliente.get(cliente_id)
    if not cliente or cliente.tenant_id != (current_user.tenant_id or "default"):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.put("/clientes/{cliente_id}", response_model=ClienteResponse)
async def actualizar_cliente(
    cliente_id: str,
    data: ClienteUpdate,
    current_user: User = Depends(get_current_active_user)
):
    from bson import ObjectId
    if not ObjectId.is_valid(cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    tenant_id = current_user.tenant_id or "default"
    cliente = await Cliente.get(cliente_id)
    
    if not cliente or cliente.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if data.nit_ci and data.nit_ci.strip() != (cliente.nit_ci or "").strip():
        nit_clean = data.nit_ci.strip()
        existing_nit = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.nit_ci == nit_clean,
            Cliente.id != cliente.id,
            Cliente.is_active == True
        )
        if existing_nit:
            raise HTTPException(status_code=400, detail=f"Ya existe un cliente activo con este NIT/CI ({nit_clean}): '{existing_nit.nombre}'.")

    if data.telefono and data.telefono.strip() != (cliente.telefono or "").strip():
        tel_clean = data.telefono.strip()
        existing_tel = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.telefono == tel_clean,
            Cliente.id != cliente.id,
            Cliente.is_active == True
        )
        if existing_tel:
            raise HTTPException(status_code=400, detail=f"Ya existe un cliente activo con este teléfono/celular ({tel_clean}): '{existing_tel.nombre}'.")

    if data.email and data.email.strip().lower() != (cliente.email or "").strip().lower():
        email_clean = data.email.strip().lower()
        existing_email = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.email == email_clean,
            Cliente.id != cliente.id,
            Cliente.is_active == True
        )
        if existing_email:
            raise HTTPException(status_code=400, detail=f"Ya existe un cliente activo con este correo ({email_clean}): '{existing_email.nombre}'.")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cliente, field, value)
        
    await cliente.save()
    return cliente


@router.delete("/clientes/{cliente_id}")
async def eliminar_cliente(
    cliente_id: str,
    current_user: User = Depends(get_current_active_user)
):
    from bson import ObjectId
    if not ObjectId.is_valid(cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    # Soft delete
    cliente = await Cliente.get(cliente_id)
    if not cliente or cliente.tenant_id != (current_user.tenant_id or "default"):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    cliente.is_active = False
    cliente.deleted_at = datetime.now(timezone.utc)
    cliente.deleted_by = str(current_user.id)
    await cliente.save()
    return {"message": "Cliente eliminado exitosamente"}


@router.get("/clientes/{cliente_id}/wallet")
async def obtener_wallet_cliente(
    cliente_id: str,
    current_user: User = Depends(get_current_active_user)
):
    from bson import ObjectId
    if not ObjectId.is_valid(cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    tenant_id = current_user.tenant_id or "default"
    
    # Verificar que el cliente exista y pertenezca al tenant
    cliente = await Cliente.get(cliente_id)
    if not cliente or cliente.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    wallets = await ClientWallet.find(
        ClientWallet.tenant_id == tenant_id,
        ClientWallet.cliente_id == cliente_id
    ).to_list()
    
    return wallets

@router.get("/clientes/check-homonimo")
async def check_homonimo_endpoint(
    nombre: Optional[str] = Query(None, description="Nombre o razón social a evaluar"),
    nit_ci: Optional[str] = Query(None, description="NIT/CI a evaluar"),
    telefono: Optional[str] = Query(None, description="Teléfono a evaluar"),
    email: Optional[str] = Query(None, description="Email a evaluar"),
    exclude_id: Optional[str] = Query(None, description="ID del cliente a excluir en edición"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Evalúa si un nombre ya existe (homónimo) y verifica que los datos únicos (NIT/CI, celular, correo) no colisionen.
    """
    tenant_id = current_user.tenant_id or "default"
    result = {
        "es_homonimo": False,
        "homonimo_count": 0,
        "homonimo_nombres": [],
        "duplicado_nit": None,
        "duplicado_telefono": None,
        "duplicado_email": None,
    }

    from bson import ObjectId
    exclude_oid = None
    if exclude_id and len(exclude_id) == 24:
        try:
            exclude_oid = ObjectId(exclude_id)
        except Exception:
            pass

    col = Cliente.get_pymongo_collection()

    # 1. Evaluar Homónimo por Nombre
    if nombre and nombre.strip():
        import re
        nom_clean = nombre.strip()
        query_nom = {
            "tenant_id": tenant_id,
            "is_active": True,
            "nombre": {"$regex": f"^{re.escape(nom_clean)}$", "$options": "i"}
        }
        if exclude_oid:
            query_nom["_id"] = {"$ne": exclude_oid}
        homonimos = await col.find(query_nom, {"nombre": 1, "nit_ci": 1, "telefono": 1}).to_list(10)
        if homonimos:
            result["es_homonimo"] = True
            result["homonimo_count"] = len(homonimos)
            result["homonimo_nombres"] = [h.get("nombre") for h in homonimos]

    # 2. Evaluar duplicado por NIT/CI
    if nit_ci and nit_ci.strip():
        nit_clean = nit_ci.strip()
        query_nit = {
            "tenant_id": tenant_id,
            "is_active": True,
            "nit_ci": nit_clean
        }
        if exclude_oid:
            query_nit["_id"] = {"$ne": exclude_oid}
        exist_nit = await col.find_one(query_nit, {"nombre": 1, "nit_ci": 1})
        if exist_nit:
            result["duplicado_nit"] = f"El NIT/CI {nit_clean} ya pertenece a '{exist_nit.get('nombre')}'."

    # 3. Evaluar duplicado por Teléfono
    if telefono and telefono.strip():
        tel_clean = telefono.strip()
        query_tel = {
            "tenant_id": tenant_id,
            "is_active": True,
            "telefono": tel_clean
        }
        if exclude_oid:
            query_tel["_id"] = {"$ne": exclude_oid}
        exist_tel = await col.find_one(query_tel, {"nombre": 1, "telefono": 1})
        if exist_tel:
            result["duplicado_telefono"] = f"El teléfono {tel_clean} ya pertenece a '{exist_tel.get('nombre')}'."

    # 4. Evaluar duplicado por Email
    if email and email.strip():
        email_clean = email.strip().lower()
        query_email = {
            "tenant_id": tenant_id,
            "is_active": True,
            "email": email_clean
        }
        if exclude_oid:
            query_email["_id"] = {"$ne": exclude_oid}
        exist_email = await col.find_one(query_email, {"nombre": 1, "email": 1})
        if exist_email:
            result["duplicado_email"] = f"El correo {email_clean} ya pertenece a '{exist_email.get('nombre')}'."

    return result
