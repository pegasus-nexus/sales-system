from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.services.chat_service import consultar_gemini_con_datos

router = APIRouter()

class MensajeChat(BaseModel):
    pregunta: str

@router.post("/reporte-ia")
async def reporte_ia(mensaje: MensajeChat) -> Dict[str, Any]:
    """
    Endpoint para interactuar con la IA RAG Copiloto Gerencial de Taboada.
    """
    # DISABLED TEMPORARILY FOR PERFORMANCE OPTIMIZATION (OOM FIX)
    raise HTTPException(status_code=503, detail="El Chatbot está temporalmente desactivado por mantenimiento y optimización.")
    
    # if not mensaje.pregunta or not mensaje.pregunta.strip():
    #     raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía.")
    #     
    # try:
    #     respuesta = await consultar_gemini_con_datos(mensaje.pregunta)
    #     return {
    #         "estado": "exito", 
    #         "respuesta": respuesta
    #     }
    # except Exception as e:
    #     error_msg = str(e)
    #     if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
    #         description = "Cuota de Google AI Studio agotada (Nivel Gratuito). Por favor, espera 60 segundos y vuelve a intentar."
    #         raise HTTPException(status_code=429, detail=description)
    #     
    #     raise HTTPException(status_code=500, detail=f"Error en RAG AI: {error_msg}")
