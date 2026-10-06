import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [deletingCatId, setDeletingCatId] = useState<string | null>(null);'''

replacement = '''    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatPartida, setNewCatPartida] = useState('');
    const [newCatPadreId, setNewCatPadreId] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [deletingCatId, setDeletingCatId] = useState<string | null>(null);'''

data = data.replace(target, replacement)

target_success = '''onSuccess: () => { refetchCats(); setNewCatName(''); setNewCatDesc(''); }'''
replacement_success = '''onSuccess: () => { refetchCats(); setNewCatName(''); setNewCatDesc(''); setNewCatPartida(''); setNewCatPadreId(''); }'''
data = data.replace(target_success, replacement_success)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("State vars added.")
