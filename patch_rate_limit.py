import os

path = 'backend/app/infrastructure/core/rate_limit.py'
with open(path, 'w', encoding='utf-8') as f:
    f.write('''from slowapi import Limiter
from slowapi.util import get_remote_address

# This global limiter will track requests using the client IP
# Default limit: 200 requests per minute per IP to prevent basic DDoS
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
''')

print("rate_limit patched")
