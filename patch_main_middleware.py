import os
import re

path = 'backend/app/main.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = "app.state.limiter = limiter\napp.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)"
replacement = "from slowapi.middleware import SlowAPIMiddleware\napp.state.limiter = limiter\napp.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)\napp.add_middleware(SlowAPIMiddleware)"

if "SlowAPIMiddleware" not in data:
    data = data.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(data)
    print("Added SlowAPIMiddleware")
