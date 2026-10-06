import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

bad_logic = """            # Online status calculation (same as users.py)
            is_online = False
            if user.last_active_at:
                diff_seconds = (now - user.last_active_at).total_seconds()
                if diff_seconds <= 180:
                    is_online = True"""

good_logic = """            # Online status calculation (same as users.py)
            is_online = False
            if user.last_active_at:
                last_active = user.last_active_at
                if last_active.tzinfo is None:
                    last_active = last_active.replace(tzinfo=timezone.utc)
                diff_seconds = (now - last_active).total_seconds()
                if diff_seconds <= 180:
                    is_online = True"""

if bad_logic in content:
    content = content.replace(bad_logic, good_logic)
    with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed datetime bug")
else:
    print("Could not find bad logic")
