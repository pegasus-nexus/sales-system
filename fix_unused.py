import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove unused handleSave
content = re.sub(r"const handleSave = \(\) => \{[\s\S]*?setIsEditing\(null\);\n    \};", "", content)

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
