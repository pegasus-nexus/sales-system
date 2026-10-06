import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_table_class = 'className="w-full text-left text-sm whitespace-nowrap"'
good_table_class = 'className="w-full text-left text-sm whitespace-nowrap text-gray-900"'
content = content.replace(bad_table_class, good_table_class)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed table text colors")
