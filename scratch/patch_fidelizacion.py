with open('backend/app/api/v1/endpoints/fidelizacion.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """            "club_benefit_branch": web_config.club_benefit_branch,
            "club_benefit_valid_until": web_config.club_benefit_valid_until,
            "rewards": [r.dict() for r in getattr(web_config, 'rewards', [])]
        },
        "colecciones": col_list,"""

content = content.replace(
    """            "club_benefit_branch": web_config.club_benefit_branch,
            "club_benefit_valid_until": web_config.club_benefit_valid_until,
        },
        "colecciones": col_list,""",
    replacement
)

with open('backend/app/api/v1/endpoints/fidelizacion.py', 'w', encoding='utf-8') as f:
    f.write(content)
