with open('backend/app/middleware/request_logging.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'tenant_id = request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id") or "system"',
    'tenant_id = request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id") or "system"\n        client_ip = request.client.host if request.client else "Unknown"\n        user_agent = request.headers.get("user-agent", "Unknown")\n        query_params = str(request.query_params) if request.query_params else ""'
)

c = c.replace(
    '"latency_ms": latency_ms',
    '"latency_ms": latency_ms,\n                    "client_ip": client_ip,\n                    "user_agent": user_agent[:30] + "..." if len(user_agent) > 30 else user_agent,\n                    "query": query_params'
)

with open('backend/app/middleware/request_logging.py', 'w', encoding='utf-8') as f:
    f.write(c)

with open('backend/app/core/logging.py', 'r', encoding='utf-8') as f:
    cl = f.read()

cl = cl.replace(
    'latency_ms = getattr(record, "latency_ms", 0.0)',
    'latency_ms = getattr(record, "latency_ms", 0.0)\n        client_ip = getattr(record, "client_ip", "")\n        user_agent = getattr(record, "user_agent", "")\n        query = getattr(record, "query", "")'
)

cl = cl.replace(
    'return f"{CYAN}[{now_str}]{RESET} {BLUE}{method}{RESET} {endpoint} -> {BOLD}{status_color}{status_code}{RESET} ({latency_ms}ms)"',
    'query_str = f"?{query}" if query else ""\n            client_info = f" | {client_ip} | {user_agent}" if client_ip else ""\n            return f"{CYAN}[{now_str}]{RESET} {BLUE}{method}{RESET} {endpoint}{query_str} -> {BOLD}{status_color}{status_code}{RESET} ({latency_ms}ms){client_info}"'
)

with open('backend/app/core/logging.py', 'w', encoding='utf-8') as f:
    f.write(cl)
