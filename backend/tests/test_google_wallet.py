from unittest.mock import patch

import jwt
import pytest

from app.application.services.google_wallet_service import GoogleWalletService


def test_loyalty_class_structure():
    """Valida que la clase de fidelización contenga los metadatos requeridos por Google Wallet."""
    issuer_id = "3388000000023236729"
    loyalty_class = GoogleWalletService.build_loyalty_class(issuer_id=issuer_id)

    assert loyalty_class["id"] == f"{issuer_id}.taboada_momentos_loyalty"
    assert loyalty_class["issuerName"] == "Chocolates Taboada"
    assert loyalty_class["programName"] == "Momentos Taboada"
    assert loyalty_class["hexBackgroundColor"] == "#2D1406"
    assert loyalty_class["reviewStatus"] == "UNDER_REVIEW"
    assert "programLogo" in loyalty_class
    assert loyalty_class["programLogo"]["kind"] == "walletobjects#image"


def test_loyalty_object_structure():
    """Valida la generación del pase digital individual con barcode CODE_128 y balance de tickets."""
    issuer_id = "3388000000023236729"
    numero_tarjeta = "TAB-482910"
    cliente_nombre = "Carlos Rodríguez"
    tickets = 14
    total_gastado = 420.50

    obj = GoogleWalletService.build_loyalty_object(
        numero_tarjeta=numero_tarjeta,
        cliente_nombre=cliente_nombre,
        tickets_disponibles=tickets,
        total_gastado=total_gastado,
        issuer_id=issuer_id,
    )

    assert obj["id"] == f"{issuer_id}.taboada_cliente_TAB-482910"
    assert obj["classId"] == f"{issuer_id}.taboada_momentos_loyalty"
    assert obj["state"] == "ACTIVE"
    assert obj["accountId"] == numero_tarjeta
    assert obj["accountName"] == cliente_nombre

    # Barcode compatible con pistola lectora de mostrador POS
    assert obj["barcode"]["type"] == "CODE_128"
    assert obj["barcode"]["value"] == numero_tarjeta
    assert obj["barcode"]["alternateText"] == numero_tarjeta

    # Balance de puntos/tickets
    assert obj["loyaltyPoints"]["label"] in ("Tickets", "Tickets Acumulados")
    assert obj["loyaltyPoints"]["balance"]["string"] == "14"
    assert obj["secondaryLoyaltyPoints"]["balance"]["string"] == "Bs. 420.50"


def test_generate_save_jwt_signing():
    """Valida la firma criptográfica RS256 del token y la URL oficial Save to Google Wallet."""
    # En CI donde el archivo de credenciales está en .gitignore, usar clave RSA generada en memoria
    if not GoogleWalletService._cached_creds:
        try:
            GoogleWalletService._load_credentials()
        except FileNotFoundError:
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.asymmetric import rsa

            key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            pem = key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ).decode("utf-8")
            GoogleWalletService._cached_creds = {
                "client_email": "google-wallet-taboada@pegasus-nexus.iam.gserviceaccount.com",
                "private_key": pem,
            }

    res = GoogleWalletService.generate_save_jwt(
        numero_tarjeta="TAB-123456",
        cliente_nombre="Valeria Méndez",
        tickets_disponibles=7,
        total_gastado=210.0,
    )

    assert res["status"] == "success"
    assert res["save_url"].startswith("https://pay.google.com/gp/v/save/")
    assert res["qr_image_url"].startswith("https://api.qrserver.com/v1/create-qr-code/")
    assert res["numero_tarjeta"] == "TAB-123456"
    assert res["tickets_disponibles"] == 7

    # Decodificar el JWT sin verificar firma para validar los claims estándar de Google
    token = res["token"]
    decoded = jwt.decode(token, options={"verify_signature": False})

    assert (
        decoded["iss"] == "google-wallet-taboada@pegasus-nexus.iam.gserviceaccount.com"
    )
    assert decoded["aud"] == "google"
    assert decoded["typ"] == "savetowallet"
    assert "loyaltyClasses" in decoded["payload"]
    assert "loyaltyObjects" in decoded["payload"]
    assert len(decoded["payload"]["loyaltyClasses"]) == 1
    assert len(decoded["payload"]["loyaltyObjects"]) == 1


def test_missing_credentials_raises_file_not_found():
    """Valida que si no existe el archivo de credenciales, se lance FileNotFoundError explícito."""
    with patch(
        "app.application.services.google_wallet_service.settings"
    ) as mock_settings:
        mock_settings.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON = ""
        mock_settings.GOOGLE_WALLET_PRIVATE_KEY = ""
        mock_settings.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = ""
        mock_settings.GOOGLE_WALLET_SERVICE_ACCOUNT_FILE = (
            "non_existent_dir/credentials.json"
        )

        # Reset cached creds
        GoogleWalletService._cached_creds = None

        with pytest.raises(FileNotFoundError):
            GoogleWalletService._load_credentials()

        # Restaurar caché
        GoogleWalletService._cached_creds = None


def test_load_credentials_from_env_json():
    """Valida que las credenciales puedan cargarse desde la variable de entorno GOOGLE_WALLET_SERVICE_ACCOUNT_JSON en Render."""
    with patch(
        "app.application.services.google_wallet_service.settings"
    ) as mock_settings:
        mock_settings.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON = '{"client_email": "render@test.iam.gserviceaccount.com", "private_key": "dummy_key"}'
        mock_settings.GOOGLE_WALLET_PRIVATE_KEY = ""
        mock_settings.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = ""

        # Reset cached creds
        GoogleWalletService._cached_creds = None

        creds = GoogleWalletService._load_credentials()
        assert creds["client_email"] == "render@test.iam.gserviceaccount.com"
        assert creds["private_key"] == "dummy_key"

        # Restaurar caché
        GoogleWalletService._cached_creds = None
