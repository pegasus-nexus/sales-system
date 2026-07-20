import os
import asyncio
import pandas as pd
from dotenv import load_dotenv
from app.core.config import settings

# Cargar .env manualmente para la prueba
load_dotenv()

async def test_chat():
    print(">>> Iniciando prueba de Chatbot...")
    print(f">>> API KEY detectada: {settings.GEMINI_API_KEY[:8]}... (longitud: {len(settings.GEMINI_API_KEY)})")
    
    from app.services.chat_service import consultar_gemini_con_datos
    
    try:
        respuesta = await consultar_gemini_con_datos("¿Cuántos registros hay en total en el dataframe?")
        print("\n>>> RESPUESTA DE GEMINI:")
        print(respuesta)
    except Exception as e:
        print("\n[X] ERROR DURANTE LA PRUEBA:")
        print(str(e))

if __name__ == "__main__":
    asyncio.run(test_chat())
