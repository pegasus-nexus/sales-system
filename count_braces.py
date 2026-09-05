import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# count { and } 
print("Left braces:", text.count("{"))
print("Right braces:", text.count("}"))
print("Left parens:", text.count("("))
print("Right parens:", text.count(")"))
print("Left tags:", text.count("<"))
print("Right tags:", text.count(">"))
