import json

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    for char in line:
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
    if depth < 0:
        print(f"Negative depth reached at line {i+1}:\n{line.strip()}")
        break
    if depth == 0 and i > 20: # if it closes the main function
        print(f"Main function possibly closed at line {i+1}:\n{line.strip()}")
        break
