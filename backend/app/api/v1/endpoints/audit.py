from fastapi import APIRouter, Depends
from typing import List, Optional
from app.domain.models.user import User, UserRole
from app.domain.models.audit import AuditLog
from app.infrastructure.core.dependencies import require_roles

router = APIRouter()

def serialize_mongo_types(obj):
    if isinstance(obj, dict):
        return {k: serialize_mongo_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_mongo_types(v) for v in obj]
    elif str(type(obj)) == "<class 'bson.decimal128.Decimal128'>":
        return float(str(obj))
    elif str(type(obj)) == "<class 'decimal.Decimal'>":
        return float(obj)
    elif "ObjectId" in str(type(obj)):
        return str(obj)
    elif "datetime" in str(type(obj)):
        return obj.isoformat()
    return obj

@router.get("/", response_model=List[dict])
async def get_audit_logs(
    current_user: User = Depends(require_roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ADMIN_MATRIZ)),
    limit: int = 100,
    skip: int = 0,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    username: Optional[str] = None
):
    query = {}
    if current_user.role != UserRole.SUPERADMIN:
        query["tenant_id"] = current_user.tenant_id or "default"

    if action:
        query["action"] = action
    if entity:
        query["entity"] = entity
    if username:
        query["username"] = {"$regex": username, "$options": "i"}

    logs = await AuditLog.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [serialize_mongo_types(log.model_dump()) for log in logs]

@router.get("/global", response_model=List[dict])
async def get_global_audit_logs(
    current_user: User = Depends(require_roles(UserRole.SUPERADMIN)),
    limit: int = 50
):
    """Returns a global activity feed across all tenants for the System Health dashboard."""
    logs = await AuditLog.find({}).sort("-created_at").limit(limit).to_list()
    
    # We need to map tenant_id to tenant name
    from app.domain.models.tenant import Tenant
    tenants = await Tenant.find_all().to_list()
    tenant_map = {str(t.id): t.name for t in tenants}
    # Add string match too for slugs
    for t in tenants:
        tenant_map[t.name] = t.name
        
    result = []
    for log in logs:
        dump = log.model_dump()
        dump["tenant_name"] = tenant_map.get(log.tenant_id, "Sistema Matriz")
        result.append(serialize_mongo_types(dump))
        
    return result
