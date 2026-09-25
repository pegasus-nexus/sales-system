import os
import shutil
import tempfile
import traceback
import unicodedata
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import List, Dict, Any, Optional
import pandas as pd
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pymongo import UpdateOne, InsertOne
from bson.objectid import ObjectId
from app.db import get_raw_db
from app.infrastructure.core.config import settings
from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

def clean_col_name(c) -> str:
    if c is None:
        return ""
    text = unicodedata.normalize('NFKD', str(c)).encode('ASCII', 'ignore').decode('utf-8').upper()
    return ''.join(ch for ch in text if ch.isalnum())

def is_null_val(v: Any) -> bool:
    if v is None:
        return True
    if isinstance(v, (list, tuple, pd.Series, pd.DataFrame)):
        return len(v) == 0
    try:
        r = pd.isna(v)
        if isinstance(r, (pd.Series, list, tuple)):
            return bool(all(r))
        if hasattr(r, '__iter__') and not isinstance(r, (str, bytes)):
            return bool(all(r))
        return bool(r)
    except Exception:
        return False

def safe_num(val, default=0.0) -> float:
    if is_null_val(val):
        return default
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, (pd.Series, list, tuple)):
        try:
            if len(val) == 0:
                return default
            val = val.iloc[0] if hasattr(val, 'iloc') else val[0]
        except Exception:
            return default
    try:
        s = str(val).strip().replace(',', '.')
        return float(s)
    except Exception:
        return default

def get_unique_column_mapping(columns: Any) -> Dict[Any, str]:
    col_map: Dict[Any, str] = {}
    assigned_targets = set()
    cleaned_dict = {col: clean_col_name(col) for col in columns}

    # Pass 0: Prioridad Absoluta a VENTA NETA (Regla de Negocio Estricta)
    for col, cleaned in cleaned_dict.items():
        if any(k in cleaned for k in ['VENTANETA', 'VENTASNETAS', 'IMPORTENETO', 'TOTALNETO', 'NETO', 'NETA', 'TOTAN']):
            col_map[col] = 'TOTAL'
            assigned_targets.add('TOTAL')
            break

    # Pass 1: Primary matches
    for col, cleaned in cleaned_dict.items():
        if col in col_map:
            continue
        if 'FECHA' not in assigned_targets and ('FECHA' in cleaned or 'DATE' in cleaned or 'TIMESTAMP' in cleaned):
            col_map[col] = 'FECHA'
            assigned_targets.add('FECHA')
        elif 'DESCRIPCION' not in assigned_targets and any(k in cleaned for k in ['DESCRIP', 'PRODUC', 'DETALLE', 'ITEM', 'NOMBRE', 'ARTICULO']):
            col_map[col] = 'DESCRIPCION'
            assigned_targets.add('DESCRIPCION')
        elif 'CODIGO' not in assigned_targets and any(k in cleaned for k in ['CODIGO', 'BARCODE', 'SKU', 'EAN']):
            col_map[col] = 'CODIGO'
            assigned_targets.add('CODIGO')
        elif 'CANTIDAD' not in assigned_targets and any(k in cleaned for k in ['CANTIDAD', 'CANT', 'QTY', 'UNIDADES']):
            col_map[col] = 'CANTIDAD'
            assigned_targets.add('CANTIDAD')
        elif 'PRECIO_UNITARIO' not in assigned_targets and (cleaned in ['PU', 'PUNITARIO', 'PRECIOUNITARIO', 'PUNIT'] or 'PRECIO' in cleaned or 'UNIT' in cleaned):
            col_map[col] = 'PRECIO_UNITARIO'
            assigned_targets.add('PRECIO_UNITARIO')
        elif 'TOTAL' not in assigned_targets and (any(k in cleaned for k in ['TOTAL', 'IMPORTE', 'SUBTOTAL', 'MONTO']) or cleaned == 'TOT'):
            col_map[col] = 'TOTAL'
            assigned_targets.add('TOTAL')

    # Pass 2: Secondary fallbacks (e.g. SN for CODIGO if CODIGO wasn't found)
    if 'CODIGO' not in assigned_targets:
        for col, cleaned in cleaned_dict.items():
            if col not in col_map and cleaned in ['SN', 'SERIE', 'ID']:
                col_map[col] = 'CODIGO'
                assigned_targets.add('CODIGO')
                break

    return col_map


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
            if df_item is None or len(df_item) == 0:
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

            # Mapeo estricto sin duplicados
            col_map = get_unique_column_mapping(df_item.columns)
            df_renamed = df_item.rename(columns=col_map)
            df_renamed = df_renamed.loc[:, ~df_renamed.columns.duplicated(keep='first')].copy()
            
            # Construcción 100% 1D garantizada
            extracted_cols = {}
            for target_col in ['FECHA', 'DESCRIPCION', 'CODIGO', 'CANTIDAD', 'PRECIO_UNITARIO', 'TOTAL']:
                if target_col in df_renamed.columns:
                    c_data = df_renamed[target_col]
                    if isinstance(c_data, pd.DataFrame):
                        c_data = c_data.iloc[:, 0]
                    extracted_cols[target_col] = c_data
            
            if len(extracted_cols) >= 2:
                processed_dfs.append(pd.DataFrame(extracted_cols))

        if not processed_dfs:
            raise ValueError("El archivo subido está vacío o no contiene hojas válidas.")

        df_completo = pd.concat(processed_dfs, ignore_index=True)
        df_completo = df_completo.loc[:, ~df_completo.columns.duplicated(keep='first')].copy()
        
        total_original_filas = len(df_completo)
        print(f"[OK] Archivo leído y unificado. Filas crudas: {total_original_filas}")

        if "DESCRIPCION" not in df_completo.columns or "FECHA" not in df_completo.columns:
            columnas_detectadas = [str(c) for c in df_completo.columns]
            raise ValueError(f"No se pudieron detectar las columnas requeridas ('FECHA' y 'DESCRIPCION'). Columnas detectadas: {columnas_detectadas}")

        # Limpieza de nulos en DESCRIPCION
        desc_col = df_completo['DESCRIPCION']
        if isinstance(desc_col, pd.DataFrame):
            desc_col = desc_col.iloc[:, 0]
        df_completo = df_completo[desc_col.notna()].copy()
        
        # Parseo robusto de fechas con verificación escalar segura
        fecha_series = df_completo['FECHA']
        if isinstance(fecha_series, pd.DataFrame):
            fecha_series = fecha_series.iloc[:, 0]

        parsed_fechas = pd.to_datetime(fecha_series, errors='coerce', format='mixed')
        na_ratio = float(parsed_fechas.isna().mean()) if len(parsed_fechas) > 0 else 0.0
        if na_ratio > 0.5:
            parsed_fechas = pd.to_datetime(fecha_series, errors='coerce', dayfirst=True)

        df_completo['FECHA'] = parsed_fechas
        fechas_clean = df_completo['FECHA']
        if isinstance(fechas_clean, pd.DataFrame):
            fechas_clean = fechas_clean.iloc[:, 0]
        df_completo = df_completo[fechas_clean.notna()].copy()

        # Extracción a lista de diccionarios planos (inmune a errores de Series de pandas)
        raw_records = df_completo.to_dict(orient='records')
        
        grupos_tickets: Dict[str, Dict[str, Any]] = {}
        for row in raw_records:
            f_val = row.get("FECHA")
            if is_null_val(f_val):
                continue
                
            if hasattr(f_val, "strftime"):
                numero_ticket = f_val.strftime("%Y-%m-%d %H:%M:%S")
                created_at_raw = f_val.to_pydatetime() if hasattr(f_val, "to_pydatetime") else f_val
            else:
                numero_ticket = str(f_val)
                created_at_raw = pd.to_datetime(f_val).to_pydatetime()

            if isinstance(created_at_raw, datetime):
                if created_at_raw.tzinfo is None:
                    created_at_local = created_at_raw.replace(tzinfo=BOLIVIA_TZ)
                else:
                    created_at_local = created_at_raw.astimezone(BOLIVIA_TZ)
                created_at_utc = created_at_local.astimezone(ZoneInfo("UTC"))
                fecha_bolivia_str = created_at_local.strftime("%Y-%m-%d")
            else:
                created_at_utc = datetime.now(timezone.utc)
                fecha_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")

            p_cant = safe_num(row.get("CANTIDAD"), default=1.0)
            p_precio = safe_num(row.get("PRECIO_UNITARIO"), default=0.0)
            p_tot = safe_num(row.get("TOTAL"), default=(p_cant * p_precio))
            
            raw_cod = row.get("CODIGO")
            p_cod = str(raw_cod).strip() if not is_null_val(raw_cod) else "N/A"
            if p_cod == "" or p_cod.lower() == "nan":
                p_cod = "N/A"
                
            raw_nom = row.get("DESCRIPCION")
            p_nom = str(raw_nom).strip() if not is_null_val(raw_nom) else "Producto sin nombre"

            item_obj = {
                "producto_id": p_cod,
                "nombre": p_nom,
                "cantidad": p_cant,
                "precio_unitario": p_precio,
                "subtotal": p_tot
            }

            if numero_ticket not in grupos_tickets:
                grupos_tickets[numero_ticket] = {
                    "numero_ticket": numero_ticket,
                    "created_at": created_at_utc,
                    "fecha_bolivia": fecha_bolivia_str,
                    "sucursal_id": sucursal_id,
                    "tenant_id": tenant_id,
                    "total": 0.0,
                    "anulada": False,
                    "items": [],
                    "pagos": [],
                    "cajero_id": "HISTORICO",
                    "cajero_name": current_user.full_name or current_user.username
                }

            grupos_tickets[numero_ticket]["items"].append(item_obj)
            grupos_tickets[numero_ticket]["total"] = round(grupos_tickets[numero_ticket]["total"] + p_tot, 2)

        registros = list(grupos_tickets.values())
        total_tickets_consolidados = len(registros)
        print(f"[OK] Transformación ETL completada. Tickets Únicos agrupados: {total_tickets_consolidados}")

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
