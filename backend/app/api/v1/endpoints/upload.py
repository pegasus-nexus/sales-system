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

import unicodedata

def clean_col_name(c) -> str:
    if c is None:
        return ""
    text = unicodedata.normalize('NFKD', str(c)).encode('ASCII', 'ignore').decode('utf-8').upper()
    return ''.join(ch for ch in text if ch.isalnum())

def safe_num(val, default=0.0) -> float:
    if val is None or pd.isna(val):
        return default
    if isinstance(val, (int, float)):
        return float(val)
    try:
        s = str(val).strip().replace(',', '.')
        return float(s)
    except Exception:
        return default


@router.post("/importar-historico")
async def importar(
    file: UploadFile = File(...),
    sucursal_id: str = Form(...),  # Recibe sucursal_id directo del frontend
    current_user: User = Depends(get_current_active_user)
):
    temp_path = None
    try:
        tenant_id = current_user.tenant_id
        
        print("\n" + "="*50)
        print(">>> INICIANDO ETL ROBUSTO MULTI-HOJA CON BI Y FINANZAS <<<")
        print(f"Archivo: {file.filename} -> Sucursal Destino: {sucursal_id}")
        
        # 1. Manejo de Archivos Grandes (Guardar en Disco)
        filename_lower = (file.filename or "").lower()
        is_csv = filename_lower.endswith(".csv")
        suffix = ".csv" if is_csv else (".xls" if filename_lower.endswith(".xls") else ".xlsx")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
            
        print(f"[OK] Archivo guardado temporalmente en disco: {temp_path}")

        # 2. Lectura (Excel Multi-Hoja o CSV)
        raw_dfs = []
        if is_csv:
            try:
                df_csv = pd.read_csv(temp_path, sep=None, engine='python')
            except Exception:
                df_csv = pd.read_csv(temp_path)
            raw_dfs.append(df_csv)
        else:
            diccionario_hojas = pd.read_excel(temp_path, sheet_name=None)
            if isinstance(diccionario_hojas, dict):
                raw_dfs = list(diccionario_hojas.values())
            elif isinstance(diccionario_hojas, pd.DataFrame):
                raw_dfs = [diccionario_hojas]

        processed_dfs = []
        for df_item in raw_dfs:
            if df_item is None or df_item.empty:
                continue

            # Auto-detección de fila de cabecera si la primera fila no tiene las columnas requeridas
            cols_text = "".join(clean_col_name(c) for c in df_item.columns)
            has_essential = ('FECHA' in cols_text or 'DATE' in cols_text) and any(k in cols_text for k in ['DESCRIP', 'PRODUC', 'DETALLE', 'ITEM', 'NOMBRE', 'ARTICULO', 'CODIGO'])

            if not has_essential and len(df_item) > 0:
                found_header_idx = None
                for idx in range(min(12, len(df_item))):
                    row_vals = df_item.iloc[idx].astype(str).tolist()
                    row_text = "".join(clean_col_name(v) for v in row_vals)
                    if ('FECHA' in row_text or 'DATE' in row_text) and any(k in row_text for k in ['DESCRIP', 'PRODUC', 'DETALLE', 'ITEM', 'NOMBRE', 'CODIGO']):
                        found_header_idx = idx
                        break

                if found_header_idx is not None:
                    new_header = df_item.iloc[found_header_idx]
                    df_item = df_item.iloc[found_header_idx + 1:].copy()
                    df_item.columns = new_header

            # Mapeo y normalización de columnas
            col_map = {}
            for col in df_item.columns:
                cleaned = clean_col_name(col)
                if 'FECHA' in cleaned or 'DATE' in cleaned or 'TIME' in cleaned:
                    col_map[col] = 'FECHA'
                elif any(k in cleaned for k in ['DESCRIP', 'PRODUC', 'DETALLE', 'ITEM', 'NOMBRE', 'ARTICULO']):
                    col_map[col] = 'DESCRIPCION'
                elif any(k in cleaned for k in ['CANT', 'QTY', 'UNID']):
                    col_map[col] = 'CANTIDAD'
                elif cleaned in ['PU', 'PUNITARIO', 'PRECIOUNITARIO', 'PUNIT'] or 'PRECIO' in cleaned or 'UNIT' in cleaned:
                    col_map[col] = 'PRECIO UNITARIO'
                elif any(k in cleaned for k in ['TOTAL', 'TOTAN', 'IMPORTE', 'SUBTOTAL', 'MONTO']) or cleaned == 'TOT':
                    col_map[col] = 'TOTAL'
                elif any(k in cleaned for k in ['CODIGO', 'BARCODE', 'SKU']) or cleaned in ['COD']:
                    col_map[col] = 'CODIGO'
                elif cleaned in ['SN', 'SERIE']:
                    col_map[col] = 'S/N'

            df_renamed = df_item.rename(columns=col_map)
            processed_dfs.append(df_renamed)

        if not processed_dfs:
            raise ValueError("El archivo subido está vacío o no contiene hojas válidas.")

        df_completo = pd.concat(processed_dfs, ignore_index=True)
        total_original_filas = len(df_completo)
        print(f"[OK] Archivo leído y unificado. Filas crudas: {total_original_filas}")

        if "DESCRIPCION" not in df_completo.columns or "FECHA" not in df_completo.columns:
            columnas_detectadas = [str(c) for c in df_completo.columns]
            raise ValueError(f"No se pudieron detectar las columnas requeridas ('FECHA' y 'DESCRIPCION'). Columnas detectadas: {columnas_detectadas}")

        df_completo = df_completo.dropna(subset=['DESCRIPCION'])
        
        # Parseo robusto de fechas
        df_completo['FECHA'] = pd.to_datetime(df_completo['FECHA'], errors='coerce', format='mixed')
        if df_completo['FECHA'].isna().mean() > 0.5:
            df_completo['FECHA'] = pd.to_datetime(df_completo['FECHA'], errors='coerce', dayfirst=True)

        df_completo = df_completo.dropna(subset=['FECHA'])
        
        # Asegurar columnas numéricas
        if "CANTIDAD" in df_completo.columns:
            df_completo["CANTIDAD"] = df_completo["CANTIDAD"].apply(lambda x: safe_num(x, default=1.0))
        else:
            df_completo["CANTIDAD"] = 1.0

        if "PRECIO UNITARIO" in df_completo.columns:
            df_completo["PRECIO UNITARIO"] = df_completo["PRECIO UNITARIO"].apply(lambda x: safe_num(x, default=0.0))
        else:
            df_completo["PRECIO UNITARIO"] = 0.0

        if "TOTAL" in df_completo.columns:
            df_completo["TOTAL"] = df_completo["TOTAL"].apply(lambda x: safe_num(x, default=0.0))
        else:
            df_completo["TOTAL"] = df_completo["CANTIDAD"] * df_completo["PRECIO UNITARIO"]

        grupos = df_completo.groupby('FECHA')
        
        registros = []
        for fecha, grupo in grupos:
            numero_ticket = str(fecha)
            created_at = pd.to_datetime(fecha)
            
            # Forzar suma explícita
            total_ticket = round(grupo['TOTAL'].astype(float).sum(), 2)
            
            items = []
            for _, fila in grupo.iterrows():
                p_cant = safe_num(fila.get('CANTIDAD'), default=1.0)
                p_precio = safe_num(fila.get('PRECIO UNITARIO'), default=0.0)
                p_tot = safe_num(fila.get('TOTAL'), default=(p_cant * p_precio))
                
                p_cod = str(fila.get('CODIGO') or fila.get('S/N') or "N/A").strip()
                if p_cod == "" or p_cod.lower() == "nan":
                    p_cod = "N/A"
                
                p_nom = str(fila.get('DESCRIPCION') or "Producto sin nombre").strip()
                
                items.append({
                    "producto_id": p_cod,
                    "nombre": p_nom,
                    "cantidad": p_cant,
                    "precio_unitario": p_precio,
                    "subtotal": p_tot
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
        print(f"[OK] Transformación ETL completada. Tickets Únicos (agrupados por fecha): {total_tickets_consolidados}")

        if total_tickets_consolidados == 0:
            return {"status": "success", "message": "Archivo vacío o sin fechas válidas", "upserted": 0, "modified": 0, "ignored": 0, "total_procesado": 0}

        # 5. Inserción Blindada (Bulk Upsert en Chunks con BI)
        db = await get_raw_db()
        coleccion = db.sales
        col_analytics = db.sale_item_analytics
        col_caja = db.caja_movimientos
        
        CHUNK_SIZE = 1000
        total_upserted = 0
        total_modified = 0
        total_matched = 0
        
        print(f"[INFO] Iniciando inserción por lotes en MongoDB (Chunks de {CHUNK_SIZE})")
        
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
                if reg["numero_ticket"] in mapa_existentes:
                    sale_id_str = mapa_existentes[reg["numero_ticket"]]
                    sale_id_obj = ObjectId(sale_id_str)
                else:
                    sale_id_obj = ObjectId()
                    sale_id_str = str(sale_id_obj)
                    mapa_existentes[reg["numero_ticket"]] = sale_id_str
                
                # Match por numero_ticket y sucursal_id con operadores $set y $setOnInsert
                op = UpdateOne(
                    {"numero_ticket": reg["numero_ticket"], "sucursal_id": sucursal_id},
                    {
                        "$set": reg,
                        "$setOnInsert": {"_id": sale_id_obj}
                    },
                    upsert=True
                )
                operaciones_sales.append(op)
                
                # Analytics ops
                for it in reg["items"]:
                    op_ana = UpdateOne(
                        {"sale_id": sale_id_str, "producto_id": it["producto_id"], "descripcion": it["nombre"]},
                        {"$set": {
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
                    {"$set": {
                        "tenant_id": tenant_id,
                        "sucursal_id": sucursal_id,
                        "sesion_id": "HISTORICO",
                        "cajero_id": "HISTORICO",
                        "cajero_name": current_user.full_name or current_user.username,
                        "subtipo": "VENTA_EFECTIVO",
                        "tipo": "INGRESO",
                        "monto": float(reg["total"]),
                        "descripcion": f"Venta Histórica #{str(reg['numero_ticket'])[-6:]}",
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
        
        print(">>> IMPORTACIÓN ETL EXITOSA <<<")
        print(resumen)
        print("="*50 + "\n")
        
        return resumen

    except Exception as e:
        print(f"Error interno: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
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
