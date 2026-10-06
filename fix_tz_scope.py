import sys
import re

file_path = "backend/app/application/services/bi_pandas_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the line BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE) from wherever it is
content = content.replace("BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)\n", "")

# Add it back right after the imports/schema imports
pattern = r"(CategoriaProductosItemBI\s*\n\))"
new_pattern = "\\1\n\nBOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)\n"

content = re.sub(pattern, new_pattern, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed BOLIVIA_TZ scoping issue")
