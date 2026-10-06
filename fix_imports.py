import sys

with open("frontend/src/api/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

import_str = "import { client } from './client';"
if "BASE_URL" not in import_str:
    content = content.replace("import { client } from './client';", "import { client, BASE_URL } from './client';\nimport { useAuthStore } from '../store/authStore';")
    with open("frontend/src/api/api.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed imports in api.ts")
