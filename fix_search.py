lines = open('backend/app/api/v1/endpoints/inventario.py', 'r', encoding='utf-8').readlines()
lines[46] = '        prod_match["$or"] = [{"descripcion": {"$regex": safe_search, "$options": "i"}}, {"codigo_corto": {"$regex": safe_search, "$options": "i"}}, {"codigo_largo": {"$regex": safe_search, "$options": "i"}}]\n'
open('backend/app/api/v1/endpoints/inventario.py', 'w', encoding='utf-8').writelines(lines)
