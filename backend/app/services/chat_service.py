import os
import pandas as pd

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent

from app.core.config import settings
from app.db import get_raw_db

async def consultar_gemini_con_datos(pregunta_gerente: str) -> str:
    """
    Función de Chat RAG que inyecta datos transaccionales como un DataFrame y 
    utiliza ChatGoogleGenerativeAI junto a un Agente Pandas para analizarlos.
    """
    try:
        db = await get_raw_db()
        
        # 1. Extracción DB: Proyectar solo las analíticas necesarias.
        cursor = db.ventas_historicas_crudas.find(
            {}, 
            {
                "_id": 0, 
                "fecha_transaccion": 1, 
                "nombre_producto": 1, 
                "cantidad_vendida": 1, 
                "monto_total_bs": 1
            }
        )
        
        datos_crudos = await cursor.to_list(length=None)
        
        if not datos_crudos:
            return "Lo siento, actualmente no hay datos en el historial procesado para analizar."
        
        # 2. Conversión a DataFrame de Pandas
        df = pd.DataFrame(datos_crudos)
        
        # Asegúrate de que las fechas que vienen de MongoDB se traten como fechas reales
        # Elimina cualquier basura que no sea fecha antes de dárselo a la IA
        df['fecha_transaccion'] = pd.to_datetime(df['fecha_transaccion'], errors='coerce')
        df = df.dropna(subset=['fecha_transaccion']) 
        
        # 3. Configuración de IA 
        # gemini-pro-latest es el modelo más estable para el nivel gratuito
        llm = ChatGoogleGenerativeAI(
            model="gemini-pro-latest", 
            temperature=0,
            google_api_key=settings.GEMINI_API_KEY
        )
        
        # Validación de la llave
        api_key = settings.GEMINI_API_KEY if hasattr(settings, 'GEMINI_API_KEY') else os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY no se encuentra configurada.")

        # Instancia del Agente simplificada para ahorrar cuota
        agente = create_pandas_dataframe_agent(
            llm, 
            df, 
            verbose=False, 
            allow_dangerous_code=True,
            handle_parsing_errors=True
        )
        
        # 4. Prompt y Ejecución
        prompt_completo = (
            f"Eres el asistente de Chocolates Taboada, analiza los 46k registros y da reportes. "
            f"Responde la pregunta basándote EXCLUSIVAMENTE en el DataFrame proporcionado. "
            f"Responde en español de forma útil y analítica.\n\n"
            f"Pregunta: {pregunta_gerente}"
        )
        
        respuesta = agente.invoke({"input": prompt_completo})
        return respuesta.get("output", str(respuesta))

    except Exception as e:
        raise Exception(f"Fallo en la comunicación con el agente IA o BD: {str(e)}")
