import os

path = "backend/app/application/services/sales_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

data = data.replace("from datetime import datetime, timezone, timedelta, timezone, timezone", "from datetime import datetime, timezone, timedelta")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("sales_service.py global timezone import cleaned")
