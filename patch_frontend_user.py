with open('frontend/src/api/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'permisos_especiales?: string[];' not in content:
    content = content.replace('last_active_at: string | null;', '''last_active_at: string | null;
    permisos_especiales?: string[];''')
    with open('frontend/src/api/api.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched api.ts User interface")
