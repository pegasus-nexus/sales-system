import json

with open(r'C:\Users\rodri\.gemini\antigravity\brain\e1df6842-4728-4d09-96a6-b07a927524a0\.system_generated\logs\transcript_full.jsonl', encoding='utf-8') as f:
    for line in f:
        if 'Contexto del Proyecto' in line and '"type":"USER_INPUT"' in line:
            data = json.loads(line)
            print(data['content'])
            break
