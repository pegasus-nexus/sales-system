import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

content = re.sub(r"din[^m]+micos", "dinámicos", content)
content = re.sub(r"Descripci[^n]+n", "Descripción", content)
content = re.sub(r"T[^t]+tulo", "Título", content)
content = re.sub(r"Ests", "¿Estás", content)
content = re.sub(r"ATENCION!", "¡ATENCIÓN!", content)
content = re.sub(r"estars", "estarás", content)
content = re.sub(r"podra", "podría", content)
content = re.sub(r"ttulo", "título", content)
content = re.sub(r"descripcin", "descripción", content)

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
