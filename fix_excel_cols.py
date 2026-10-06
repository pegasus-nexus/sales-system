import sys

file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update pipeline projection
old_proj = """                        "Precio Final": "$precio_final",
                        "Costo Unitario": "$costo_producto",
                        "Stock": {"$ifNull": ["$inv.cantidad", 0.0]},
                        "Costo Total Stock": {"""
new_proj = """                        "Precio al Cliente": "$precio_final",
                        "Costo Unitario": "$costo_producto",
                        "Stock": {"$ifNull": ["$inv.cantidad", 0.0]},
                        "Precio Total Stock": {
                            "$multiply": [
                                {"$ifNull": ["$precio_final", 0.0]},
                                {"$ifNull": ["$inv.cantidad", 0.0]}
                            ]
                        },
                        "Costo Total Stock": {"""
content = content.replace(old_proj, new_proj)

# Update empty DataFrame columns
old_df_cols = 'df = pd.DataFrame(columns=["Codigo Corto", "Codigo Largo", "Producto", "Categoria", "Precio Final", "Costo Unitario", "Stock", "Costo Total Stock"])'
new_df_cols = 'df = pd.DataFrame(columns=["Codigo Corto", "Codigo Largo", "Producto", "Categoria", "Precio al Cliente", "Costo Unitario", "Stock", "Precio Total Stock", "Costo Total Stock"])'
content = content.replace(old_df_cols, new_df_cols)

# Update styling column widths
old_widths = """            worksheet.column_dimensions["E"].width = 15 # Precio Final
            worksheet.column_dimensions["F"].width = 15 # Costo
            worksheet.column_dimensions["G"].width = 12 # Stock
            worksheet.column_dimensions["H"].width = 18 # Costo Total"""
new_widths = """            worksheet.column_dimensions["E"].width = 16 # Precio al Cliente
            worksheet.column_dimensions["F"].width = 15 # Costo
            worksheet.column_dimensions["G"].width = 12 # Stock
            worksheet.column_dimensions["H"].width = 18 # Precio Total
            worksheet.column_dimensions["I"].width = 18 # Costo Total"""
content = content.replace(old_widths, new_widths)

# Update number formatting
old_fmt = """            for row in range(2, len(df) + 2):
                worksheet[f"E{row}"].number_format = '#,##0.00'
                worksheet[f"F{row}"].number_format = '#,##0.00'
                worksheet[f"G{row}"].number_format = '#,##0.00'
                worksheet[f"H{row}"].number_format = '#,##0.00'"""
new_fmt = """            for row in range(2, len(df) + 2):
                worksheet[f"E{row}"].number_format = '#,##0.00'
                worksheet[f"F{row}"].number_format = '#,##0.00'
                worksheet[f"G{row}"].number_format = '#,##0.00'
                worksheet[f"H{row}"].number_format = '#,##0.00'
                worksheet[f"I{row}"].number_format = '#,##0.00'"""
content = content.replace(old_fmt, new_fmt)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Excel columns")
