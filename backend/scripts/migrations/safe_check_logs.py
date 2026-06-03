import os

files_to_check = [
    "backend/app/application/services/traslado_service.py",
    "backend/app/application/services/b2b_service.py"
]

base_dir = r"c:\Users\rodri\Desktop\Taboada System\SalesSystem"

for rel_path in files_to_check:
    full_path = os.path.join(base_dir, rel_path.replace("/", "\\"))
    if not os.path.exists(full_path):
        print(f"File not found: {rel_path}")
        continue
        
    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()
        
    print(f"\n=======================================================")
    print(f"FILE: {rel_path}")
    print(f"=======================================================")
    
    for i, line in enumerate(lines):
        if "InventoryLog(" in line:
            print(f"--- Line {i+1} ---")
            for j in range(i, min(i+18, len(lines))):
                print(f"{j+1:4d}: {lines[j].strip().encode('ascii', errors='replace').decode('ascii')}")
