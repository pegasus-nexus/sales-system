import re

with open("backend/app/domain/models/web_config.py", "r", encoding="utf-8") as f:
    content = f.read()

old_reward = """class WebReward(BaseModel):
    id: str
    title: str
    tag: str
    desc: str
    img: str
    validity: str = ''
    validity_days: int = 14
    is_active: bool = True"""

new_reward = """class WebReward(BaseModel):
    id: str
    title: str
    tag: str
    desc: str
    img: str
    validity: str = ''
    validity_days: int = 14
    is_active: bool = True
    deleted: bool = False"""

content = content.replace(old_reward, new_reward)

with open("backend/app/domain/models/web_config.py", "w", encoding="utf-8") as f:
    f.write(content)

print("WebReward schema updated.")
