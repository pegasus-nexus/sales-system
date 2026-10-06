import sys

with open("backend/app/api/v1/router.py", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "from .endpoints import ("
if "dashboard_matriz" not in content:
    content = content.replace("from .endpoints import (", "from .endpoints import dashboard_matriz\nfrom .endpoints import (")
    content += "\napi_router.include_router(dashboard_matriz.router, prefix=\"/dashboard-matriz\", tags=[\"dashboard-matriz\"])"

    with open("backend/app/api/v1/router.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Router updated")
else:
    print("Already there")
