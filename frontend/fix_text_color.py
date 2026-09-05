import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add text-gray-900 to input and textarea elements inside the modal
content = content.replace(
    'className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm',
    'className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-3 py-2 text-sm'
)
content = content.replace(
    'className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm',
    'className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl pl-9 pr-3 py-2 text-sm'
)

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
