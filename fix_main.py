with open('backend/app/main.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('@app.get("/")', '@app.api_route("/", methods=["GET", "HEAD"])')
c = c.replace('@app.get("/health")', '@app.api_route("/health", methods=["GET", "HEAD"])')

with open('backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(c)
