import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

import re

# ensure we add draftSubcategory to state correctly
if 'const [draftSubcategory, setDraftSubcategory] = useState(' not in data:
    data = re.sub(
        r"const \[draftCategory, setDraftCategory\] = useState\('all'\);",
        "const [draftCategory, setDraftCategory] = useState('all');\n    const [draftSubcategory, setDraftSubcategory] = useState('all');",
        data
    )

# Fix the ui again, because patch_expenses_ui failed earlier
data = re.sub(
    r'<select\s+value=\{draftCategory\}.*?<option value="all">Todas las Categorí.*?\{\s*categories\.map.*?</select>',
    '''<select 
                    value={draftCategory}
                    onChange={(e) => { setDraftCategory(e.target.value); setDraftSubcategory('all'); }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                >
                    <option value="all">Todas las Categorías</option>
                    {categories.filter((c:any) => !c.padre_id).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.partida ? `[${c.partida}] ` : ''}{c.nombre}</option>
                    ))}
                </select>

                {draftCategory !== 'all' && categories.some((c:any) => c.padre_id === draftCategory) && (
                    <select 
                        value={draftSubcategory}
                        onChange={(e) => setDraftSubcategory(e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer animate-in fade-in"
                    >
                        <option value="all">Todas las Subcategorías</option>
                        {categories.filter((c:any) => c.padre_id === draftCategory).map((c: any) => (
                            <option key={c._id} value={c._id}>{c.partida ? `[${c.partida}] ` : ''}{c.nombre}</option>
                        ))}
                    </select>
                )}''',
    data, flags=re.DOTALL | re.IGNORECASE
)

# And fix the name replacement that we messed up earlier
data = re.sub(
    r'<p className="text-xs font-bold text-gray-800">\{cat\.nombre\}</p>',
    r'<p className="text-xs font-bold text-gray-800">{cat.partida && <span className="text-gray-400 mr-1">[{cat.partida}]</span>}{cat.nombre} {cat.padre_id && <span className="text-[9px] ml-1 bg-gray-200 px-1 rounded text-gray-500">Sub</span>}</p>',
    data
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data.replace('Categorí', 'CategorA-'))

print("UI fixed")
