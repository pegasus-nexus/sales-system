with open('backend/app/api/v1/endpoints/bi_ai.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = "from datetime import datetime, timezone\n" + c
c = c.replace('datetime.now().isoformat()', 'datetime.now(timezone.utc).isoformat()')

with open('backend/app/api/v1/endpoints/bi_ai.py', 'w', encoding='utf-8') as f:
    f.write(c)
