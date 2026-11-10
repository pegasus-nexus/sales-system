from datetime import UTC, datetime
from typing import Any, Optional
from fastapi import HTTPException

from app.domain.models.momentos_taboada import ConfiguracionCampanaTaboada
from app.domain.models.user import User, UserRole


ADMIN_ROLES = [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]


class MomentosTaboadaConfigService:
    """
    Gestiona el ciclo de vida y estado de activación de la campaña Momentos Taboada.
    Garantiza que la campaña permanezca en Modo Preparación (Borrador) hasta que
    el Administrador de la Empresa la active explícitamente para cajeros y clientes.
    """

    @staticmethod
    async def get_estado_campana(tenant_id: str) -> dict[str, Any]:
        """Retorna el estado de activación actual de la campaña para el tenant."""
        cfg = await ConfiguracionCampanaTaboada.find_one({"tenant_id": tenant_id})
        if not cfg:
            # Por defecto la campaña inicia INACTIVA (Modo Preparación)
            cfg = ConfiguracionCampanaTaboada(
                tenant_id=tenant_id,
                activa=False,
                mensaje_inactivo="La campaña Momentos Taboada se encuentra en preparación por administración.",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
            await cfg.create()

        return {
            "activa": cfg.activa,
            "mensaje_inactivo": cfg.mensaje_inactivo,
            "fecha_activacion": cfg.fecha_activacion.isoformat() if cfg.fecha_activacion else None,
            "activado_por_usuario": cfg.activado_por_usuario,
            "updated_at": cfg.updated_at.isoformat() if cfg.updated_at else None,
        }

    @staticmethod
    async def toggle_activacion_campana(
        tenant_id: str,
        activa: bool,
        current_user: User,
        mensaje_inactivo: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Permite al Administrador de la Empresa activar o pausar la campaña para cajeros y clientes.
        """
        cfg = await ConfiguracionCampanaTaboada.find_one({"tenant_id": tenant_id})
        if not cfg:
            cfg = ConfiguracionCampanaTaboada(tenant_id=tenant_id, activa=activa)
        else:
            cfg.activa = activa

        if activa:
            cfg.fecha_activacion = datetime.now(UTC)
            cfg.activado_por_usuario = current_user.full_name or current_user.username
        if mensaje_inactivo and mensaje_inactivo.strip():
            cfg.mensaje_inactivo = mensaje_inactivo.strip()

        cfg.updated_at = datetime.now(UTC)
        await cfg.save()

        msg = (
            "Campaña Momentos Taboada activada con éxito para cajeros y clientes."
            if activa
            else "Campaña pausada. Modo preparación activado."
        )

        return {
            "status": "success",
            "activa": cfg.activa,
            "message": msg,
            "fecha_activacion": cfg.fecha_activacion.isoformat() if cfg.fecha_activacion else None,
            "activado_por_usuario": cfg.activado_por_usuario,
        }

    @staticmethod
    async def validar_campana_disponible_para_usuario(
        tenant_id: str, current_user: User
    ) -> None:
        """
        Si el usuario no es Administrador y la campaña está inactiva, bloquea el acceso con HTTP 403.
        Los administradores siempre pueden operar para aprovisionar y preparar la campaña.
        """
        if current_user.role in ADMIN_ROLES:
            return

        estado = await MomentosTaboadaConfigService.get_estado_campana(tenant_id)
        if not estado["activa"]:
            raise HTTPException(
                status_code=403,
                detail=estado.get(
                    "mensaje_inactivo",
                    "La campaña Momentos Taboada aún no ha sido activada por la administración de la empresa.",
                ),
            )
