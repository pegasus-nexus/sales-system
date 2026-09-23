import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the PercentIcon function
content = re.sub(
    r'function PercentIcon\(\)\s*\{\s*return\s*\(\s*<svg[^>]*>.*?</svg>\s*\)\s*\}',
    '',
    content,
    flags=re.DOTALL
)

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("PercentIcon removed.")
