import os
import re

path = "backend/app/application/services/sales_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

# Remove SaleItemAnalytics lines
data = re.sub(r'\s*await SaleItemAnalytics\.find\([\s\S]*?\.update\([\s\S]*?, session=session\)', '', data)

# Add timezone import if not there
if "from datetime import timezone" not in data:
    data = data.replace("from datetime import datetime, timedelta", "from datetime import datetime, timedelta, timezone")
    if "from datetime import timezone" not in data:
        data = data.replace("from datetime import datetime", "from datetime import datetime, timezone")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("sales_service.py patched")
