import sys

file_path = "backend/app/application/services/bi_pandas_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: after_hours_list usage
content = content.replace(
    'if "hora_bolivia" in df_merged.columns:', 
    'if "hora_bolivia" in df_sales.columns:'
)
content = content.replace(
    'after_hours_df = df_merged[(df_merged["hora_bolivia"] < op_hour) | (df_merged["hora_bolivia"] > cl_hour)]',
    'after_hours_df = df_sales[(df_sales["hora_bolivia"] < op_hour) | (df_sales["hora_bolivia"] > cl_hour)]'
)
content = content.replace(
    'grouped_after = after_hours_df.groupby(["nombre", "hora_minuto_bolivia", "hora_bolivia"]).agg(',
    'grouped_after = after_hours_df.groupby(["sucursal_nombre_canonical", "hora_minuto_bolivia", "hora_bolivia"]).agg('
)
content = content.replace(
    'sucursal_nombre=str(r_ah["nombre"]),',
    'sucursal_nombre=str(r_ah["sucursal_nombre_canonical"]),'
)

# Fix 2: df_recientes usage
content = content.replace(
    'df_recientes = df_merged.sort_values(by="created_at_utc", ascending=False).head(10)',
    'df_recientes = df_sales.sort_values(by="created_at_utc", ascending=False).head(10)'
)
content = content.replace(
    'suc_name = str(row["nombre"])',
    'suc_name = str(row.get("sucursal_nombre_canonical", "Sucursal Central"))'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed Sahian's bug!")
