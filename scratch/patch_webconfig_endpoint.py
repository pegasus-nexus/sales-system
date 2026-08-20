with open('backend/app/api/v1/endpoints/web_config.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add WebReward to imports
if "from app.domain.models.web_config import WebConfig, WebReward" not in content:
    content = content.replace(
        "from app.domain.models.web_config import WebConfig",
        "from app.domain.models.web_config import WebConfig, WebReward"
    )

content = content.replace(
    "club_benefit_valid_until: Optional[str] = None",
    "club_benefit_valid_until: Optional[str] = None\n    rewards: Optional[list[WebReward]] = None"
)

with open('backend/app/api/v1/endpoints/web_config.py', 'w', encoding='utf-8') as f:
    f.write(content)
