import sys

with open("temp_dashboard.txt", "r", encoding="utf-8") as f:
    old_lines = f.readlines()

modals_index = -1
for i, line in enumerate(old_lines):
    if "{showProductModal && (" in line:
        modals_index = i
        break

if modals_index == -1:
    print("Could not find modals")
    sys.exit(1)

modals_content = "".join(old_lines[modals_index:])

# Now write the combined file
with open("rewrite1.py", "r", encoding="utf-8") as f:
    script_content = f.read()

# Replace the placeholder in my previous script logic
# Actually, I'll just write a new script to do it all properly

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    current_content = f.read()

# Strip out the last part I added:
content = current_content.split("{/* Modals para agregar Cajeros / Productos se mantienen abajo */}")[0]
content += modals_content

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Restored modals")
