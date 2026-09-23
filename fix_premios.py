import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Modify handleDelete to set a deleted flag instead of removing it from the array
old_handle_delete = """        const updatedRewards = rewards.filter(r => r.id !== id);
        mutation.mutate({ rewards: updatedRewards });"""

new_handle_delete = """        const updatedRewards = rewards.map(r => r.id === id ? { ...r, is_active: false, deleted: true } : r);
        mutation.mutate({ rewards: updatedRewards });"""

content = content.replace(old_handle_delete, new_handle_delete)

# Filter out deleted rewards from the table display
old_map = """{rewards.map(reward => ("""
new_map = """{rewards.filter(r => !r.deleted).map(reward => ("""

content = content.replace(old_map, new_map)

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("PremiosWebPage updated to soft delete.")
