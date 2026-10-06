import sys
import re

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix search input
search_bad = 'className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm"'
search_good = 'className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"'
content = content.replace(search_bad, search_good)

# Fix select dropdown
select_bad = 'className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold"'
select_good = 'className="bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold"'
content = content.replace(select_bad, select_good)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed contrast on inputs")
