import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_interface = """interface WebReward {
    id: string;
    title: string;
    tag: string;
    desc: string;
    img: string;
    validity: string;
    validity_days?: number;
    is_active: boolean;
}"""

new_interface = """interface WebReward {
    id: string;
    title: string;
    tag: string;
    desc: string;
    img: string;
    validity: string;
    validity_days?: number;
    is_active: boolean;
    deleted?: boolean;
}"""

content = content.replace(old_interface, new_interface)

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Interface WebReward updated.")
