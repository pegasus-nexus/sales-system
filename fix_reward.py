import re

with open("backend/app/domain/models/web_config.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("validity: str", "validity: str = ''\n    validity_days: int = 14")

with open("backend/app/domain/models/web_config.py", "w", encoding="utf-8") as f:
    f.write(content)
