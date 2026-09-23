import re

with open("frontend/src/api/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find where WebReward is defined in the frontend
# It could be in frontend/src/api/api.ts or frontend/src/types/index.ts or right in PremiosWebPage.tsx
