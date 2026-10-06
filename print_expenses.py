with open('backend/app/api/v1/endpoints/reports.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_func = False
for i, line in enumerate(lines):
    if 'def get_expenses_report' in line:
        in_func = True
    if in_func:
        print(f'{i}: {line}', end='')
        if line.startswith('@') and i > 1500:
            break
