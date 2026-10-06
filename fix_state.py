import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

import re
data = re.sub(
    r'const \[newCatName, setNewCatName\] = useState\(\'\'\);\s+const \[newCatDesc, setNewCatDesc\] = useState\(\'\'\);',
    '''const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatPartida, setNewCatPartida] = useState('');
    const [newCatPadreId, setNewCatPadreId] = useState('');''',
    data
)

data = re.sub(
    r"onSuccess: \(\) => { refetchCats\(\); setNewCatName\(''\); setNewCatDesc\(''\); }",
    "onSuccess: () => { refetchCats(); setNewCatName(''); setNewCatDesc(''); setNewCatPartida(''); setNewCatPadreId(''); }",
    data
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("State fixed")
