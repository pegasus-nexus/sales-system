import json
import logging
from pathlib import Path
from typing import Any

import jwt

from app.infrastructure.core.config import settings

logger = logging.getLogger(__name__)


class GoogleWalletService:
    """
    Servicio de integración con Google Wallet para la emisión de tarjetas
    de fidelización de "Momentos Taboada" (LoyaltyClass y LoyaltyObject).
    Utiliza firmas digitales JWT RS256 con la cuenta de servicio de Google Cloud.
    """

    _cached_creds: dict[str, Any] | None = None

    @classmethod
    def _load_credentials(cls) -> dict[str, Any]:
        """Carga las credenciales de la cuenta de servicio desde archivo o configuración."""
        if cls._cached_creds:
            return cls._cached_creds

        # 1. Si se configuró el JSON completo en variables de entorno (ideal para Render / Cloud)
        if (
            settings.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON
            and settings.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON.strip()
        ):
            try:
                cls._cached_creds = json.loads(
                    settings.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON
                )
                return cls._cached_creds
            except Exception as e:
                logger.error(f"Error parseando GOOGLE_WALLET_SERVICE_ACCOUNT_JSON: {e}")

        # 2. Si se configuró la private_key directamente por variable de entorno
        if (
            settings.GOOGLE_WALLET_PRIVATE_KEY
            and settings.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
        ):
            cls._cached_creds = {
                "client_email": settings.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
                "private_key": settings.GOOGLE_WALLET_PRIVATE_KEY.replace("\\n", "\n"),
            }
            return cls._cached_creds

        # 3. Cargar desde archivo JSON local
        json_path = Path(settings.GOOGLE_WALLET_SERVICE_ACCOUNT_FILE)
        if not json_path.is_absolute():
            # Buscar relativo a la raíz del proyecto o directorio backend
            possible_paths = [
                json_path,
                Path(__file__).parents[3] / json_path,
                Path(__file__).parents[4] / json_path,
            ]
            for p in possible_paths:
                if p.exists():
                    json_path = p
                    break

        if not json_path.exists():
            raise FileNotFoundError(
                f"No se encontró el archivo de credenciales de Google Wallet en: {json_path}"
            )

        with open(json_path, encoding="utf-8") as f:
            creds = json.load(f)

        cls._cached_creds = creds
        return creds

    @classmethod
    def get_issuer_id(cls) -> str:
        """Retorna el Issuer ID configurado."""
        return settings.GOOGLE_WALLET_ISSUER_ID or "3388000000023236729"

    @classmethod
    def build_loyalty_class(cls, issuer_id: str | None = None) -> dict[str, Any]:
        """
        Construye la definición de la clase oficial de fidelización 'Momentos Taboada'.
        """
        iss_id = issuer_id or cls.get_issuer_id()
        class_id = f"{iss_id}.taboada_momentos_loyalty"

        return {
            "id": class_id,
            "issuerName": "Chocolates Taboada",
            "programName": "Momentos Taboada",
            "reviewStatus": "UNDER_REVIEW",
            "hexBackgroundColor": "#2D1406",  # Café chocolate oscuro elegante
            "programLogo": {
                "kind": "walletobjects#image",
                "sourceUri": {
                    "uri": "https://chocolatestaboada.com/assets/logo-taboada.png"
                },
                "contentDescription": {
                    "defaultValue": {
                        "language": "es-419",
                        "value": "Logo Chocolates Taboada",
                    }
                },
            },
            "localizedIssuerName": {
                "defaultValue": {
                    "language": "es-419",
                    "value": "Chocolates Taboada",
                }
            },
            "localizedProgramName": {
                "defaultValue": {
                    "language": "es-419",
                    "value": "Momentos Taboada",
                }
            },
        }

    @classmethod
    def build_loyalty_object(
        cls,
        numero_tarjeta: str,
        cliente_nombre: str,
        tickets_disponibles: int = 0,
        total_gastado: float = 0.0,
        issuer_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Construye el pase digital individual para el cliente en Google Wallet.
        """
        iss_id = issuer_id or cls.get_issuer_id()
        class_id = f"{iss_id}.taboada_momentos_loyalty"

        # Sanear número de tarjeta para formar un ID válido en Google Wallet
        clean_code = "".join(c for c in numero_tarjeta if c.isalnum() or c in "-_")
        object_id = f"{iss_id}.taboada_cliente_{clean_code}"

        return {
            "id": object_id,
            "classId": class_id,
            "state": "ACTIVE",
            "accountId": numero_tarjeta,
            "accountName": cliente_nombre or "Cliente Taboada",
            "barcode": {
                "type": "CODE_128",  # Permite lectura directa con pistolas lectoras en caja POS
                "value": numero_tarjeta,
                "alternateText": numero_tarjeta,
            },
            "loyaltyPoints": {
                "label": "Tickets Acumulados",
                "balance": {"string": str(tickets_disponibles)},
            },
            "secondaryLoyaltyPoints": {
                "label": "Compras Acumuladas",
                "balance": {"string": f"Bs. {total_gastado:.2f}"},
            },
            "textModulesData": [
                {
                    "header": "Campaña Oficial",
                    "body": "Momentos Taboada 2026. Por cada Bs. 30 en compras acumulas 1 ticket canjeable.",
                },
                {
                    "header": "Código de Fidelización",
                    "body": f"Presenta este código en caja: {numero_tarjeta}",
                },
                {
                    "header": "Canje de Premios",
                    "body": "Canjea tus tickets por tazas coleccionables y chocolates exclusivos en cualquier sucursal.",
                },
            ],
            "linksModuleData": {
                "uris": [
                    {
                        "kind": "walletobjects#uri",
                        "uri": "https://chocolatestaboada.com",
                        "description": "Sitio Web Chocolates Taboada",
                    }
                ]
            },
        }

    @classmethod
    def generate_save_jwt(
        cls,
        numero_tarjeta: str,
        cliente_nombre: str,
        tickets_disponibles: int = 0,
        total_gastado: float = 0.0,
    ) -> dict[str, Any]:
        """
        Genera el token JWT firmado con RS256 y la URL oficial 'Save to Google Wallet'.
        """
        creds = cls._load_credentials()
        issuer_id = cls.get_issuer_id()

        loyalty_class = cls.build_loyalty_class(issuer_id=issuer_id)
        loyalty_object = cls.build_loyalty_object(
            numero_tarjeta=numero_tarjeta,
            cliente_nombre=cliente_nombre,
            tickets_disponibles=tickets_disponibles,
            total_gastado=total_gastado,
            issuer_id=issuer_id,
        )

        jwt_payload = {
            "iss": creds["client_email"],
            "aud": "google",
            "origins": ["localhost", "https://chocolatestaboada.com"],
            "typ": "savetowallet",
            "payload": {
                "loyaltyClasses": [loyalty_class],
                "loyaltyObjects": [loyalty_object],
            },
        }

        # Firmar JWT con RS256 usando la clave privada de la cuenta de servicio
        token = jwt.encode(
            jwt_payload,
            creds["private_key"],
            algorithm="RS256",
            headers={"alg": "RS256", "typ": "JWT"},
        )

        save_url = f"https://pay.google.com/gp/v/save/{token}"
        qr_image_url = (
            f"https://api.qrserver.com/v1/create-qr-code/?size=320x320&data={save_url}"
        )

        return {
            "status": "success",
            "save_url": save_url,
            "qr_image_url": qr_image_url,
            "token": token,
            "numero_tarjeta": numero_tarjeta,
            "cliente_nombre": cliente_nombre,
            "tickets_disponibles": tickets_disponibles,
        }
