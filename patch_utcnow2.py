import os
import re

directory = 'backend/app'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'datetime.utcnow' in content:
                # Add timezone import if not present
                if 'from datetime import' in content and 'timezone' not in content:
                    content = re.sub(r'from datetime import (.*)', r'from datetime import \1, timezone', content)
                elif 'import datetime' in content and 'timezone' not in content:
                    content = content.replace('import datetime', 'import datetime\nfrom datetime import timezone')
                elif 'timezone' not in content:
                    content = 'from datetime import timezone\n' + content

                # Replace utcnow with now
                content = content.replace('datetime.utcnow', 'lambda: datetime.now(timezone.utc)')
                content = content.replace('lambda: lambda:', 'lambda:')

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Patched {filepath}")
