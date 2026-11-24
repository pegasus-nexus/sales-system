from pydantic import BaseModel, EmailStr, Field


class RequestActivationInput(BaseModel):
    """Solicitud para iniciar el proceso de verificación por correo."""

    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    business_name: str | None = Field(None, max_length=100)


class VerifyTokenResponse(BaseModel):
    """Respuesta de validación preliminar del token de activación."""

    valid: bool
    email: str
    full_name: str
    business_name: str


class CompleteActivationInput(BaseModel):
    """Definición de contraseña y activación definitiva de la cuenta."""

    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(..., min_length=8)


class CompleteActivationResponse(BaseModel):
    """Respuesta tras activar exitosamente la cuenta e iniciar sesión."""

    status: str
    message: str
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    email: str
