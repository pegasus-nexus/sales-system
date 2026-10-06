import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_div = 'className="flex items-center justify-between shrink-0 bg-white p-3 rounded-lg border border-gray-200"'
good_div = 'className="flex items-center justify-between shrink-0 bg-white p-3 rounded-lg border border-gray-200 text-gray-900"'
content = content.replace(bad_div, good_div)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed summary text colors")
