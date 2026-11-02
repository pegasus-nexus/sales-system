from typing import Optional, Dict, Any, List
from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from pymongo import IndexModel


class ServiceHealthCheck(Document):
    """
    Registro individual de un sondeo de salud realizado por el monitor.
    Se limpia automáticamente a los 30 días mediante índice TTL de MongoDB.
    """
    service_key: str
    service_name: str
    target_type: str  # INTERNAL_HTTP, EXTERNAL_HTTP, DATABASE, AI_SERVICE
    status: str       # UP, DEGRADED, DOWN
    status_code: Optional[int] = None
    latency_ms: float = 0.0
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "service_health_checks"
        indexes = [
            IndexModel([("service_key", 1), ("checked_at", -1)]),
            IndexModel([("status", 1)]),
            # Auto-expirar logs de chequeos antiguos tras 30 días para no saturar almacenamiento
            IndexModel([("checked_at", 1)], expireAfterSeconds=2592000),
        ]


class ServiceIncidentAlert(Document):
    """
    Historial de incidentes y caídas para trazabilidad y gestión de alertas sin spam.
    """
    service_key: str
    service_name: str
    incident_type: str  # OUTAGE, RECOVERY, DEGRADED
    status: str         # OPEN, RESOLVED
    first_detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    last_notification_sent_at: Optional[datetime] = None
    error_detail: Optional[str] = None
    notification_channels: List[str] = Field(default_factory=list)

    class Settings:
        name = "service_incident_alerts"
        indexes = [
            IndexModel([("service_key", 1), ("status", 1)]),
            IndexModel([("first_detected_at", -1)]),
        ]


class AdminPasswordSetupToken(Document):
    """
    Tokens temporales para invitación y definición segura de contraseña de Superadmins.
    El token en claro jamás se guarda en base de datos, solo su hash criptográfico.
    """
    email: str
    token_hash: str
    role: str = "SUPERADMIN"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_by_ip: Optional[str] = None

    class Settings:
        name = "admin_password_setup_tokens"
        indexes = [
            IndexModel([("token_hash", 1)], unique=True),
            IndexModel([("email", 1)]),
            # Auto-limpiar tokens expirados después de 7 días
            IndexModel([("expires_at", 1)], expireAfterSeconds=604800),
        ]
