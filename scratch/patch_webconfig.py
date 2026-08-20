import re

with open('backend/app/domain/models/web_config.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """from pydantic import Field, BaseModel

class WebReward(BaseModel):
    id: str
    title: str
    tag: str
    desc: str
    img: str
    validity: str
    is_active: bool = True

class WebConfig(Document):"""

content = content.replace("from pydantic import Field\n\nclass WebConfig(Document):", replacement)

content = content.replace(
    "featured_products: list[str] = Field(default_factory=list)",
    "featured_products: list[str] = Field(default_factory=list)\n    \n    # Dynamic Rewards for Comunidad\n    rewards: list[WebReward] = Field(default_factory=list)"
)

with open('backend/app/domain/models/web_config.py', 'w', encoding='utf-8') as f:
    f.write(content)
