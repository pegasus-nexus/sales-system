import os
import difflib

def get_diff(file1, file2):
    try:
        with open(file1, 'r', encoding='utf-8') as f1, open(file2, 'r', encoding='utf-8') as f2:
            lines1 = f1.readlines()
            lines2 = f2.readlines()
        diff = list(difflib.unified_diff(lines1, lines2, fromfile=file1, tofile=file2))
        return "".join(diff)
    except Exception as e:
        return f"Error reading files: {e}"

files_to_compare = [
    "backend/app/services/analytics_v2_service.py",
    "backend/app/services/bcg_service.py",
    "frontend/src/components/SalesMatrixView.tsx",
    "frontend/src/pages/AnaliticaAvanzada.tsx"
]

if __name__ == '__main__':
    dir1 = r'C:\Users\rodri\Desktop\sales-system'
    dir2 = r'C:\Users\rodri\Desktop\SalesSystemSahian\SalesSystem'
    
    with open(r'C:\Users\rodri\Desktop\sales-system\scratch\diff_output.txt', 'w', encoding='utf-8') as out:
        for f in files_to_compare:
            out.write(f"--- DIFF FOR {f} ---\n")
            diff = get_diff(os.path.join(dir1, f), os.path.join(dir2, f))
            if not diff:
                out.write("No differences.\n")
            else:
                out.write(diff)
            out.write("\n\n")
