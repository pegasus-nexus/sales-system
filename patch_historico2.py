import os

path = "backend/app/application/services/compra_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

import re
# We need to remove:
#                     if reception.es_historico:
#                         continue
data = re.sub(r'(\s*)if reception\.es_historico:\s*continue\n', '', data)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Removed es_historico continue")
