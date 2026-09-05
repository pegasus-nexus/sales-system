import re

with open("src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"    const handleSave = \(\) => \{\n        const updatedRewards = rewards\.map\(r => r\.id === isEditing \? \{ \.\.\.r, \.\.\.editForm \} : r\);\n        mutation\.mutate\(\{ rewards: updatedRewards \}\);\n    \};\n", "", content)

with open("src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
