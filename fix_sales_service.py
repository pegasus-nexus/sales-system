import sys

with open("backend/app/application/services/sales_service.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('.update({"":', '.update({"$set":')

with open("backend/app/application/services/sales_service.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Successfully fixed sales_service.py")
