import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from datetime import datetime, timedelta", "from datetime import datetime, timedelta, timezone")

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Added timezone")
