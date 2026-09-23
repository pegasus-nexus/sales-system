import re

with open("backend/app/api/v1/endpoints/fidelizacion.py", "r", encoding="utf-8") as f:
    content = f.read()

old_rewards = """"rewards": [r.dict() for r in getattr(web_config, 'rewards', [])]"""
new_rewards = """"rewards": [r.dict() for r in getattr(web_config, 'rewards', []) if not getattr(r, 'deleted', False)]"""

content = content.replace(old_rewards, new_rewards)

with open("backend/app/api/v1/endpoints/fidelizacion.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Backend fidelizacion updated to filter deleted rewards.")
