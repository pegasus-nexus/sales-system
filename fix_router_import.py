import sys

file_path = "backend/app/api/v1/router.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import_anchor = "from app.api.v1.endpoints import ("
if "conteos_fisicos," not in content:
    content = content.replace(import_anchor, import_anchor + "\n    conteos_fisicos,")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed import")
