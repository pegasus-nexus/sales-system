import os
import filecmp
import json

def compare_dirs(dir1, dir2, ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = ['.git', 'node_modules', '__pycache__', 'venv', '.env', 'dist', 'build']

    diff = []
    
    for root, dirs, files in os.walk(dir1):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        rel_path = os.path.relpath(root, dir1)
        dir2_path = os.path.join(dir2, rel_path) if rel_path != '.' else dir2
        
        if not os.path.exists(dir2_path):
            diff.append(f"Only in {dir1}: {rel_path}")
            continue
            
        for f in files:
            f1 = os.path.join(root, f)
            f2 = os.path.join(dir2_path, f)
            
            if not os.path.exists(f2):
                diff.append(f"Only in {dir1}: {os.path.join(rel_path, f)}")
            elif not filecmp.cmp(f1, f2, shallow=False):
                diff.append(f"Differ: {os.path.join(rel_path, f)}")

    for root, dirs, files in os.walk(dir2):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        rel_path = os.path.relpath(root, dir2)
        dir1_path = os.path.join(dir1, rel_path) if rel_path != '.' else dir1
        
        if not os.path.exists(dir1_path):
            diff.append(f"Only in {dir2}: {rel_path}")
            continue
            
        for f in files:
            f1 = os.path.join(dir1_path, f)
            f2 = os.path.join(root, f)
            
            if not os.path.exists(f1):
                diff.append(f"Only in {dir2}: {os.path.join(rel_path, f)}")

    return diff

if __name__ == '__main__':
    dir1 = r'C:\Users\rodri\Desktop\sales-system'
    dir2 = r'C:\Users\rodri\Desktop\SalesSystemSahian\SalesSystem'
    
    print("Comparing backend services...")
    diff_backend = compare_dirs(os.path.join(dir1, 'backend', 'app', 'services'), os.path.join(dir2, 'backend', 'app', 'services'))
    print(json.dumps(diff_backend, indent=2))
    
    print("Comparing backend api...")
    diff_api = compare_dirs(os.path.join(dir1, 'backend', 'app', 'api', 'v1', 'endpoints'), os.path.join(dir2, 'backend', 'app', 'api', 'v1', 'endpoints'))
    print(json.dumps(diff_api, indent=2))

    print("Comparing frontend components...")
    diff_components = compare_dirs(os.path.join(dir1, 'frontend', 'src', 'components'), os.path.join(dir2, 'frontend', 'src', 'components'))
    print(json.dumps(diff_components, indent=2))

    print("Comparing frontend pages...")
    diff_pages = compare_dirs(os.path.join(dir1, 'frontend', 'src', 'pages'), os.path.join(dir2, 'frontend', 'src', 'pages'))
    print(json.dumps(diff_pages, indent=2))
