import json

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

def find_mismatch(text, open_char, close_char):
    stack = []
    for i, char in enumerate(text):
        if char == open_char:
            stack.append(i)
        elif char == close_char:
            if not stack:
                return i
            stack.pop()
    return -1

mismatch_idx = find_mismatch(text, "{", "}")
if mismatch_idx != -1:
    line_no = text.count("\n", 0, mismatch_idx) + 1
    print(f"Extra closing brace at line {line_no}")
else:
    print("No extra closing brace found")
    
mismatch_idx = find_mismatch(text, "(", ")")
if mismatch_idx != -1:
    line_no = text.count("\n", 0, mismatch_idx) + 1
    print(f"Extra closing parenthesis at line {line_no}")
else:
    print("No extra closing parenthesis found")

mismatch_idx = find_mismatch(text, "<", ">")
if mismatch_idx != -1:
    line_no = text.count("\n", 0, mismatch_idx) + 1
    print(f"Extra closing tag at line {line_no}")
else:
    print("No extra closing tag found")
