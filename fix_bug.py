with open('backend/app/application/services/sales_service.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('update({"": {"sale_date":', 'update({"": {"sale_date":')
c = c.replace('update({"": {"created_at":', 'update({"": {"created_at":')
c = c.replace('update({"": {"fecha":', 'update({"": {"fecha":')

with open('backend/app/application/services/sales_service.py', 'w', encoding='utf-8') as f:
    f.write(c)
