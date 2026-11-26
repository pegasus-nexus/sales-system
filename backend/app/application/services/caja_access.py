"""
Política de acceso a sesiones de caja (autorización horizontal).

Regla de negocio: "una caja por cajera".
  - SUPERADMIN / ADMIN_MATRIZ (alias ADMIN): cualquier sesión del tenant.
  - ADMIN_SUCURSAL / SUPERVISOR: sesiones de su sucursal.
  - Resto de roles (CAJERO, VENDEDOR, FACTURADOR, ...): solo sus propias
    sesiones dentro de su sucursal (deny-by-default).

Las sesiones legacy sin `sucursal_id` se consideran de "CENTRAL", igual que
el listado histórico de `/caja/sesiones`.

Módulo puro: no importa modelos de Beanie; opera sobre atributos.
"""
from typing import Any, Optional

from app.domain.models.user import UserRole

SUCURSAL_DEFAULT = "CENTRAL"

ROLES_TENANT_WIDE = frozenset({UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ})
ROLES_SUCURSAL_WIDE = frozenset({UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR})


def sucursal_de(user: Any) -> str:
    return user.sucursal_id or SUCURSAL_DEFAULT


def ve_todo_el_tenant(user: Any) -> bool:
    return user.role in ROLES_TENANT_WIDE


def ve_toda_la_sucursal(user: Any) -> bool:
    return user.role in ROLES_SUCURSAL_WIDE


def cajero_filtro(user: Any) -> Optional[str]:
    """cajero_id por el que se debe filtrar un listado, o None si no aplica."""
    if ve_todo_el_tenant(user) or ve_toda_la_sucursal(user):
        return None
    return str(user.id)


def puede_acceder_sesion(user: Any, sesion: Any) -> bool:
    """True si `user` puede leer/operar `sesion` (incluye la verificación de tenant)."""
    if sesion.tenant_id != (user.tenant_id or "default"):
        return False
    if ve_todo_el_tenant(user):
        return True
    if (sesion.sucursal_id or SUCURSAL_DEFAULT) != sucursal_de(user):
        return False
    if ve_toda_la_sucursal(user):
        return True
    return sesion.cajero_id == str(user.id)
