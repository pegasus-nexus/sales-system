import re
import sys

def fix_cors(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add chocolatestaboada.pro to origins explicitly
    if '"https://chocolatestaboada.pro" not in origins' not in content:
        injection = """
if "https://chocolatestaboada.pro" not in origins:
    origins.append("https://chocolatestaboada.pro")
if "https://www.chocolatestaboada.pro" not in origins:
    origins.append("https://www.chocolatestaboada.pro")
"""
        content = content.replace('if "https://taboada-fexco.vercel.app" not in origins:', 
                                  injection + '\nif "https://taboada-fexco.vercel.app" not in origins:')
                                  
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed CORS")

if __name__ == '__main__':
    fix_cors(sys.argv[1])
