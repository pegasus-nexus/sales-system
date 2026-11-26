"""
Segregación por rol y sucursal del módulo Momentos Taboada.

- Matriz (ADMIN_MATRIZ / SUPERADMIN): gestiona premios y stock de todas las
  sucursales y puede consultar cualquier sucursal.
- Sucursal (ADMIN_SUCURSAL, CAJERO, VENDEDOR, SUPERVISOR): opera y consulta
  SOLO su propia sucursal (`User.sucursal_id`). La sucursal la decide el
  servidor; lo que envíe el cliente no puede apuntar a otra sucursal.
"""
from fastapi import HTTPException

from app.domain.models.user import User, UserRole

MATRIZ_ROLES = {UserRole.ADMIN_MATRIZ, UserRole.SUPERADMIN}

SIN_SUCURSAL_MSG = (
    "Tu usuario no tiene una sucursal asignada. "
    "Pide a la administración matriz que te asigne una para operar Momentos Taboada."
)


class MomentosTaboadaScopeService:

    @staticmethod
    def es_matriz(user: User) -> bool:
        return user.role in MATRIZ_ROLES

    @staticmethod
    def sucursal_del_usuario(user: User) -> str:
        """Sucursal fija de un usuario de sucursal; 403 si no tiene ninguna asignada."""
        sucursal_id = (user.sucursal_id or "").strip()
        if not sucursal_id:
            raise HTTPException(status_code=403, detail=SIN_SUCURSAL_MSG)
        return sucursal_id

    @staticmethod
    def resolver_sucursal_operacion(user: User, solicitada: str | None) -> str:
        """
        Sucursal donde se ejecuta una operación (ej. canje).
        Matriz debe indicarla; un usuario de sucursal siempre usa la suya.
        """
        solicitada = (solicitada or "").strip() or None
        if MomentosTaboadaScopeService.es_matriz(user):
            if not solicitada:
                raise HTTPException(status_code=400, detail="Selecciona la sucursal de la operación")
            return solicitada

        propia = MomentosTaboadaScopeService.sucursal_del_usuario(user)
        if solicitada and solicitada != propia:
            raise HTTPException(
                status_code=403, detail="Solo puedes operar en tu propia sucursal"
            )
        return propia

    @staticmethod
    def resolver_sucursal_lectura(user: User, solicitada: str | None) -> str | None:
        """
        Filtro de sucursal para consultas.
        Matriz: la solicitada (None/"TODAS" = todas). Sucursal: siempre la propia.
        """
        if MomentosTaboadaScopeService.es_matriz(user):
            return solicitada
        return MomentosTaboadaScopeService.sucursal_del_usuario(user)
