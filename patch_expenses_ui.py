import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target_ui = '''                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                        <Tag className="text-gray-400" size={16} />
                        <select 
                            value={draftCategory}
                            onChange={(e) => setDraftCategory(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none w-40"
                        >
                            <option value="all">Todas las Categorías</option>
                            {categories.map((c: any) => (
                                <option key={c._id} value={c._id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <button '''

replacement_ui = '''                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                        <Tag className="text-gray-400" size={16} />
                        <select 
                            value={draftCategory}
                            onChange={(e) => { setDraftCategory(e.target.value); setDraftSubcategory('all'); }}
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none w-40"
                        >
                            <option value="all">Todas las Categorías</option>
                            {categories.filter((c:any) => !c.padre_id).map((c: any) => (
                                <option key={c._id} value={c._id}>{c.partida ? []  : ''}{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {draftCategory !== 'all' && categories.some((c:any) => c.padre_id === draftCategory) && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 animate-in fade-in slide-in-from-left-2">
                            <Tag className="text-indigo-400" size={14} />
                            <select 
                                value={draftSubcategory}
                                onChange={(e) => setDraftSubcategory(e.target.value)}
                                className="bg-transparent text-sm font-bold text-indigo-700 outline-none w-40"
                            >
                                <option value="all">Todas las Subcategorías</option>
                                {categories.filter((c:any) => c.padre_id === draftCategory).map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.partida ? []  : ''}{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button '''

data = data.replace(target_ui.replace('í', 'A-').replace('ó', 'A3'), replacement_ui.replace('í', 'A-').replace('ó', 'A3'))

# Update categories list to show visually
target_list = '''                                        {categories.map((cat: any) => (
                                            <div key={cat._id} className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between group hover:shadow-sm transition-all min-h-[58px]">'''

replacement_list = '''                                        {categories.map((cat: any) => (
                                            <div key={cat._id} className={g-white p-3 rounded-xl border flex items-center justify-between group hover:shadow-sm transition-all min-h-[58px] }>'''

data = data.replace(target_list, replacement_list)

target_name = '''                                                                <p className="text-xs font-bold text-gray-800">{cat.nombre}</p>'''
replacement_name = '''                                                                <p className="text-xs font-bold text-gray-800">{cat.partida && <span className="text-gray-400 mr-1">[{cat.partida}]</span>}{cat.nombre} {cat.padre_id && <span className="text-[9px] ml-1 bg-gray-200 px-1 rounded text-gray-500">Sub</span>}</p>'''

data = data.replace(target_name, replacement_name)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Filters UI patched.")
