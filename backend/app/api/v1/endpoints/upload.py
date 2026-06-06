import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.infrastructure.core.config import settings
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User

router = APIRouter()

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(status_code=500, detail="Cloudinary no está configurado en el servidor")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    try:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )

        contents = await file.read()
        folder_path = f"sales_system/{current_user.tenant_id}"
        
        response = cloudinary.uploader.upload(
            contents,
            folder=folder_path,
            resource_type="image",
            quality="auto", 
            fetch_format="auto"
        )
        
        return {"url": response.get("secure_url")}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen a la nube: {str(e)}")
