import sys
import re

file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Category to imports
if "from app.domain.models.category import Category" not in content:
    content = content.replace("from app.domain.models.product import Product", "from app.domain.models.product import Product\n    from app.domain.models.category import Category")

# Replace categories logic
old_logic = "output = io.BytesIO()"
new_logic = """
    # Fetch all categories to map category_id -> category_name
    categories = await Category.find(Category.tenant_id == tenant_id).to_list()
    cat_map = {str(c.id): c.name for c in categories}

    output = io.BytesIO()"""
if "cat_map = {" not in content:
    content = content.replace(old_logic, new_logic)

# Map category name inside loop
old_df_logic = """            if not docs:
                df = pd.DataFrame(columns=["Codigo Corto", "Codigo Largo", "Producto", "Categoria", "Precio Final", "Costo Unitario", "Stock", "Costo Total Stock"])
            else:
                for doc in docs:
                    doc.pop("_id", None)
                df = pd.DataFrame(docs)"""

new_df_logic = """            if not docs:
                df = pd.DataFrame(columns=["Codigo Corto", "Codigo Largo", "Producto", "Categoria", "Precio Final", "Costo Unitario", "Stock", "Costo Total Stock"])
            else:
                for doc in docs:
                    doc.pop("_id", None)
                    # Resolve category name
                    cat_id = doc.get("Categoria")
                    doc["Categoria"] = cat_map.get(str(cat_id), "Sin Categoría") if cat_id else "Sin Categoría"
                df = pd.DataFrame(docs)"""
if "# Resolve category name" not in content:
    content = content.replace(old_df_logic, new_df_logic)


# Add styling logic
old_save = "df.to_excel(writer, sheet_name=sheet_name, index=False)"
new_save = """df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # --- Diseño y Formato ---
            worksheet = writer.sheets[sheet_name]
            from openpyxl.styles import PatternFill, Font, Alignment
            
            # Formato de cabecera
            header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid") # Dark Gray-900
            header_font = Font(color="FFFFFF", bold=True)
            for cell in worksheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")
                
            # Tamaños de columnas fijos
            worksheet.column_dimensions["A"].width = 15 # Codigo Corto
            worksheet.column_dimensions["B"].width = 15 # Codigo Largo
            worksheet.column_dimensions["C"].width = 45 # Producto
            worksheet.column_dimensions["D"].width = 25 # Categoria
            worksheet.column_dimensions["E"].width = 15 # Precio Final
            worksheet.column_dimensions["F"].width = 15 # Costo
            worksheet.column_dimensions["G"].width = 12 # Stock
            worksheet.column_dimensions["H"].width = 18 # Costo Total
            
            # Formato de números para dinero y stock
            for row in range(2, len(df) + 2):
                worksheet[f"E{row}"].number_format = '#,##0.00'
                worksheet[f"F{row}"].number_format = '#,##0.00'
                worksheet[f"G{row}"].number_format = '#,##0.00'
                worksheet[f"H{row}"].number_format = '#,##0.00'
"""
if "worksheet.column_dimensions" not in content:
    content = content.replace(old_save, new_save)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated excel export logic")
