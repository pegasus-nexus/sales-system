import io
import pandas as pd
from typing import Dict, Any
from app.db import get_raw_db

ALIASES = {
    "fecha_transaccion": ["FECHA"], 
    "nombre_producto": ["DESCRIPCION", "PRODUCTO"], 
    "monto_total_bs": ["TOTAL", "VENTA NETA"], 
    "cantidad_vendida": ["CANTIDAD", "CANT"]
}

async def procesar_archivo(file_bytes: bytes, sucursal: str) -> Dict[str, Any]:
    print("\n[ETL PANDAS 'MODO DIOS'] Iniciando limpieza extrema.")
    
    buffer = io.BytesIO(file_bytes)
    
    # Abrimos con ExcelFile para poder iterar las hojas limpiamente
    excel_file = pd.ExcelFile(buffer)
    hojas_procesadas = []

    for hoja in excel_file.sheet_names:
        hoja_upper = str(hoja).upper()
        # Ignora hojas basura
        if hoja_upper in ["RESUMEN", "PIVOT"] or "RESUMEN" in hoja_upper or "PIVOT" in hoja_upper:
            print(f"[SKIP] Ignorando la hoja {hoja} por ser considerada resumen/pivot.")
            continue
            
        print(f"\n---> Analizando hoja: '{hoja}'")
        
        # El Cazador de Encabezados (Algoritmo de Limpieza Extrema)
        # Lee la hoja validando primero el chunk de 30 rows para encontrar la tabla
        df_explorar = pd.read_excel(buffer, sheet_name=hoja, header=None, nrows=30, dtype=str)
        
        if df_explorar.empty:
            print(f"[SKIP] Hoja {hoja} vacía. Continuamos.")
            continue
            
        tabla_idx = -1
        encabezados_reales = []
        
        # Iterar buscando el santo grial de la tabla: "DESCRIPCION" y ("FECHA" o "TOTAL")
        for i in range(len(df_explorar)):
            fila_vals = [str(x).upper() for x in df_explorar.iloc[i].values if pd.notna(x)]
            fila_join = " ".join(fila_vals)
            
            if "DESCRIPCION" in fila_join and ("FECHA" in fila_join or "TOTAL" in fila_join):
                tabla_idx = i
                # Tomar la fila cuidando los NaNs, asignando nombres base limpios  
                encabezados_reales = [str(x).upper().strip() if pd.notna(x) else f"UNKNOWN_{idx}" for idx, x in enumerate(df_explorar.iloc[i].values)]
                print(f"[OK] ¡Verdadera Tabla hallada en índice {i}! Encabezados originales: {encabezados_reales}")
                break
                
        if tabla_idx == -1:
            print(f"[FAIL] No se detectó inicio de tabla válida en '{hoja}'. Ignorando.")
            continue
            
        # Volver a cargar recortando desde donde debe ser usando index + 1
        print(f"Recortando garbage superior y leyendo con header={tabla_idx}")
        df_hoja = pd.read_excel(buffer, sheet_name=hoja, header=tabla_idx)
        
        if df_hoja.empty:
            continue
            
        # Limpieza ETL
        print("Aplicando mapeo y Diccionario de Aliases...")
        mapa_renombre = {}
        for col in df_hoja.columns:
            # quitar espacios para igualar
            col_comparar = str(col).replace(" ","").upper().strip()
            
            for bd_key, lst_alias in ALIASES.items():
                list_comparar = [al.replace(" ","").upper() for al in lst_alias]
                if col_comparar in list_comparar:
                    mapa_renombre[col] = bd_key
                    break
                    
        df_hoja.rename(columns=mapa_renombre, inplace=True)
        
        columnas_disponibles = list(df_hoja.columns)
        
        # Filtrar a solo 4 oficiales
        oficiales = list(ALIASES.keys())
        oficiales_encontrados = [o for o in oficiales if o in columnas_disponibles]
        
        df_limpio = df_hoja[oficiales_encontrados].copy()
        
        # df['sucursal'] = sucursal
        df_limpio["sucursal"] = sucursal
        
        # Limpia strings y drop nulos en nombre producto
        if "nombre_producto" in df_limpio.columns:
            pre_len = len(df_limpio)
            df_limpio.dropna(subset=["nombre_producto"], inplace=True)
            df_limpio["nombre_producto"] = df_limpio["nombre_producto"].astype(str).str.upper().str.strip()
            # Descarta string nulo u '0' o NAN
            df_limpio = df_limpio[df_limpio["nombre_producto"] != "NAN"]
            df_limpio = df_limpio[df_limpio["nombre_producto"] != "0"]
            df_limpio = df_limpio[df_limpio["nombre_producto"] != ""]
            print(f"Productos validados: {len(df_limpio)} de {pre_len} crudos.")
            
        # Formatea fechas
        if "fecha_transaccion" in df_limpio.columns:
            df_limpio["fecha_transaccion"] = pd.to_datetime(df_limpio["fecha_transaccion"], errors='coerce')
            df_limpio.dropna(subset=["fecha_transaccion"], inplace=True)
            
        # Limpiar numéricas (CON BLOQUE ANTI-CLONES)
        # --- INICIO DEL BLOQUE ANTI-CLONES ---
        columnas_numericas = ['monto_total_bs', 'cantidad_vendida']
        
        for num_col in columnas_numericas:
            if num_col in df_limpio.columns:
                # Si Pandas detecta que hay 2 o más columnas con el mismo nombre (es un DataFrame)
                if isinstance(df_limpio[num_col], pd.DataFrame):
                    print(f"⚠️ Alerta: Se detectaron {df_limpio[num_col].shape[1]} columnas duplicadas para '{num_col}'. Tomando la última.")
                    # Tomamos solo la última columna (que suele ser el Total Final real)
                    serie_correcta = df_limpio[num_col].iloc[:, -1]
                    # Borramos los clones
                    df_limpio = df_limpio.drop(columns=[num_col])
                    # Dejamos solo la correcta
                    df_limpio[num_col] = serie_correcta
                
                # Ahora sí, convertimos a números sin que Pandas llore
                df_limpio[num_col] = pd.to_numeric(df_limpio[num_col], errors='coerce').fillna(0)
        # --- FIN DEL BLOQUE ANTI-CLONES ---
                
        # Guardamos df de esta hoja
        if not df_limpio.empty:
            hojas_procesadas.append(df_limpio)
            
    if not hojas_procesadas:
        raise ValueError("Limpieza fallida o archivo vacío. Ninguna fila cumplió los estándares de ingreso.")
        
    print("\n[ETL] Carga en curso: Consolidando y generando payload...")
    df_final = pd.concat(hojas_procesadas, ignore_index=True)
    dict_records = df_final.to_dict('records')
    
    print(f"Total registros finales: {len(dict_records)}. Insertando en MongoDB (ventas_historicas_crudas)...")
    
    # Carga a DB
    db = await get_raw_db()
    await db.ventas_historicas_crudas.insert_many(dict_records)
    print("¡Inserción masiva completada satisfactoriamente!")
    
    return {
        "status": "success",
        "data_insertada": len(dict_records)
    }