# -*- coding: utf-8 -*-
with open('frontend/src/components/RegionalAndProductMix.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = re.sub(r"name: 'Hero(.*?)',\s*badgeBg: '(.*?)',\s*badgeText: '(.*?)',\s*color: '#059669',\s*colorLight: '.*?',\s*dotBg: '(.*?)'", 
                 r"name: 'Hero\1',\n        badgeBg: '\2',\n        badgeText: '\3',\n        color: '#059669',\n        colorLight: '#6ee7b7', // Emerald 300 para comparacion\n        dotBg: '\4'", content)

content = re.sub(r"name: 'Recoleta',\s*badgeBg: '(.*?)',\s*badgeText: '(.*?)',\s*color: '#0284c7',\s*colorLight: '.*?',\s*dotBg: '(.*?)'", 
                 r"name: 'Recoleta',\n        badgeBg: '\1',\n        badgeText: '\2',\n        color: '#0284c7',\n        colorLight: '#7dd3fc', // Sky 300 para comparacion\n        dotBg: '\3'", content)

content = re.sub(r"name: 'Calacoto',\s*badgeBg: '(.*?)',\s*badgeText: '(.*?)',\s*color: '#d97706',\s*colorLight: '.*?',\s*dotBg: '(.*?)'", 
                 r"name: 'Calacoto',\n        badgeBg: '\1',\n        badgeText: '\2',\n        color: '#d97706',\n        colorLight: '#fcd34d', // Amber 300 para comparacion\n        dotBg: '\3'", content)

with open('frontend/src/components/RegionalAndProductMix.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched colors.")
