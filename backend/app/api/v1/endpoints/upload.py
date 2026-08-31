import os
import shutil
import tempfile
import traceback
import pandas as pd
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pymongo import UpdateOne, InsertOne
from bson.objectid import ObjectId
from app.db import get_raw_db
from app.infrastructure.core.config import settings
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User

router = APIRouter()

@router.post("/importar-historico")
async def importar(
    file: UploadFile = File(...),
    sucursal_id: str = Form(...),  # Recibe sucursal_id directo del frontend
    current_user: User = Depends(get_current_active_user)
):
    try:
        tenant_id = current_user.tenant_id
        
        print("\n" + "="*50)
        print(">>> INICIANDO ETL ROBUSTO MULTI-HOJA CON BI Y FINANZAS <<<")
        print(f"Archivo: {file.filename} -> Sucursal Destino: {sucursal_id}")
        
        # 1. Manejo de Archivos Grandes (Guardar en Disco)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
            
        print(f"[OK] Archivo guardado temporalmente en disco: {temp_path}")

        # 2. Lectura Multi-Hoja (Pandas)
        diccionario_hojas = pd.read_excel(temp_path, sheet_name=None)
        df_completo = pd.concat(diccionario_hojas.values(), ignore_index=True)
        total_original_filas = len(df_completo)
        print(f"[OK] Todas las hojas unidas. Filas planas crudas: {total_original_filas}")
        
        # Eliminar el archivo temporal del disco duro
        os.remove(temp_path)

        # 3. Limpieza de Nombres y Filas Basura
        df_completo.columns = df_completo.columns.str.strip()
        df_completo = df_completo.dropna(subset=['DESCRIPCION'])
        
        # 4. Transformacion (Agrupacion por Ticket usando la marca de tiempo)
        df_completo['FECHA'] = pd.to_datetime(df_completo['FECHA'], errors='coerce')
        df_completo = df_completo.dropna(subset=['FECHA'])
        
        grupos = df_completo.groupby('FECHA')
        
        registros = []
        for fecha, grupo in grupos:
            numero_ticket = str(fecha)
            created_at = pd.to_datetime(fecha)
            
            # Forzar suma explicita
            total_ticket = round(grupo['TOTAL'].astype(float).sum(), 2)
            
            items = []
            for _, fila in grupo.iterrows():
                items.append({
                    "producto_id": str(fila['S/N']) if pd.notnull(fila.get('S/N')) else "N/A",
                    "nombre": str(fila['DESCRIPCION']),
                    "cantidad": float(fila['CANTIDAD']) if pd.notnull(fila.get('CANTIDAD')) else 1.0,
                    "precio_unitario": float(fila['PRECIO UNITARIO']) if pd.notnull(fila.get('PRECIO UNITARIO')) else 0.0,
                    "subtotal": float(fila['TOTAL']) if pd.notnull(fila.get('TOTAL')) else 0.0
                })
                
            registro = {
                "numero_ticket": numero_ticket,
                "created_at": created_at,
                "sucursal_id": sucursal_id,
                "tenant_id": tenant_id,
                "total": total_ticket,
                "anulada": False,
                "items": items,
                "pagos": [],
                "cajero_id": "HISTORICO",
                "cajero_name": current_user.full_name or current_user.username
            }
            registros.append(registro)
            
        total_tickets_consolidados = len(registros)
        print(f"[OK] Transformacion ETL completada. Tickets Unicos (agrupados): {total_tickets_consolidados}")

        if total_tickets_consolidados == 0:
            return {"status": "success", "message": "Archivo vacio o sin datos validos", "upserted": 0, "modified": 0, "ignored": 0, "total_procesado": 0}

        # 5. Insercion Blindada (Bulk Upsert en Chunks con BI)
        db = await get_raw_db()
        coleccion = db.sales
        col_analytics = db.sale_item_analytics
        col_caja = db.caja_movimientos
        
        CHUNK_SIZE = 1000
        total_upserted = 0
        total_modified = 0
        total_matched = 0
        
        print(f"[INFO] Iniciando insercion por lotes (Chunks de {CHUNK_SIZE})")
        
        # Optimization: Fetch existing sales to map numero_ticket to existing ObjectIds
        # and only create analytics for new ones, or upsert analytics.
        
        for i in range(0, len(registros), CHUNK_SIZE):
            lote = registros[i:i + CHUNK_SIZE]
            
            numeros = [reg["numero_ticket"] for reg in lote]
            existentes_cursor = db.sales.find({"numero_ticket": {"$in": numeros}, "sucursal_id": sucursal_id}, {"_id": 1, "numero_ticket": 1})
            mapa_existentes = {}
            async for ex in existentes_cursor:
                mapa_existentes[ex["numero_ticket"]] = str(ex["_id"])
            
            operaciones_sales = []
            operaciones_analytics = []
            operaciones_caja = []
            
            for reg in lote:
                # If sale exists, we reuse its ID for upserts to avoid duplication.
                # If it doesn't, we pre-generate one.
                if reg["numero_ticket"] in mapa_existentes:
                    sale_id_str = mapa_existentes[reg["numero_ticket"]]
                    sale_id_obj = ObjectId(sale_id_str)
                else:
                    sale_id_obj = ObjectId()
                    sale_id_str = str(sale_id_obj)
                    mapa_existentes[reg["numero_ticket"]] = sale_id_str
                
                # Regla innegociable: Match por numero_ticket y sucursal_id
                op = UpdateOne(
                    {"numero_ticket": reg["numero_ticket"], "sucursal_id": sucursal_id},
                    {"": reg, "": {"_id": sale_id_obj}},
                    upsert=True
                )
                operaciones_sales.append(op)
                
                # Analytics ops
                for it in reg["items"]:
                    op_ana = UpdateOne(
                        {"sale_id": sale_id_str, "producto_id": it["producto_id"], "descripcion": it["nombre"]},
                        {"": {
                            "tenant_id": tenant_id,
                            "sucursal_id": sucursal_id,
                            "sale_date": reg["created_at"],
                            "cantidad": float(it["cantidad"]),
                            "precio_unitario": float(it["precio_unitario"]),
                            "subtotal": float(it["subtotal"]),
                            "costo_unitario": 0.0,
                            "descuento_unitario": 0.0,
                            "almacen_id": "default"
                        }},
                        upsert=True
                    )
                    operaciones_analytics.append(op_ana)
                    
                # Caja ops
                op_caja = UpdateOne(
                    {"sale_id": sale_id_str},
                    {"": {
                        "tenant_id": tenant_id,
                        "sucursal_id": sucursal_id,
                        "sesion_id": "HISTORICO",
                        "cajero_id": "HISTORICO",
                        "cajero_name": current_user.full_name or current_user.username,
                        "subtipo": "VENTA_EFECTIVO",
                        "tipo": "INGRESO",
                        "monto": float(reg["total"]),
                        "descripcion": f"Venta Historica #{str(reg['numero_ticket'])[-6:]}",
                        "fecha": reg["created_at"],
                        "created_at": reg["created_at"]
                    }},
                    upsert=True
                )
                operaciones_caja.append(op_caja)
                
            if operaciones_sales:
                resultado = await coleccion.bulk_write(operaciones_sales)
                total_upserted += resultado.upserted_count
                total_modified += resultado.modified_count
                total_matched += resultado.matched_count
            if operaciones_analytics:
                await col_analytics.bulk_write(operaciones_analytics)
            if operaciones_caja:
                await col_caja.bulk_write(operaciones_caja)
            
            print(f"  -> Lote procesado ({i} al {i+len(lote)}): Upserted={resultado.upserted_count if operaciones_sales else 0}, Modified={resultado.modified_count if operaciones_sales else 0}")

        # 6. Respuesta JSON al Frontend
        resumen = {
            "status": "success",
            "upserted": total_upserted,
            "modified": total_modified,
            "ignored": total_matched - total_modified,
            "total_procesado": total_tickets_consolidados
        }
        
        print(">>> IMPORTACION ETL EXITOSA <<<")
        print(resumen)
        print("="*50 + "\n")
        
        return resumen

    except Exception as e:
        print(f"Error interno: {e}")
        print(traceback.format_exc())
        
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
            
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        import gc
        gc.collect()


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(status_code=500, detail="Cloudinary no esta configurado en el servidor")

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
