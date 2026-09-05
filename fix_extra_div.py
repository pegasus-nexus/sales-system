import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("</div></div>\n                                </td>\n                                <td className=\"py-4 px-6 max-w-xs\">", "</div>\n                                </td>\n                                <td className=\"py-4 px-6 max-w-xs\">")

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
