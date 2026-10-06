import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add state variables
state_anchor = "const [search, setSearch] = useState('');"
state_new = """const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'A-Z' | 'Z-A' | 'DEFAULT'>('DEFAULT');"""
content = content.replace(state_anchor, state_new)

# Modify filtering logic
filter_anchor = "const filteredItems = localItems.filter(i => (i.descripcion || '').toLowerCase().includes(search.toLowerCase()) || (i.codigo_corto || '').toLowerCase().includes(search.toLowerCase()));"
filter_new = """let filteredItems = localItems.filter(i => (i.descripcion || '').toLowerCase().includes(search.toLowerCase()) || (i.codigo_corto || '').toLowerCase().includes(search.toLowerCase()));
    
    if (selectedCategory !== 'ALL') {
        filteredItems = filteredItems.filter(i => i.categoria_nombre === selectedCategory);
    }
    
    if (selectedProvider !== 'ALL') {
        filteredItems = filteredItems.filter(i => i.proveedores?.includes(selectedProvider));
    }
    
    if (sortBy === 'A-Z') {
        filteredItems.sort((a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''));
    } else if (sortBy === 'Z-A') {
        filteredItems.sort((a, b) => (b.descripcion || '').localeCompare(a.descripcion || ''));
    }
    
    const uniqueCategories = Array.from(new Set(localItems.map(i => i.categoria_nombre).filter(Boolean))) as string[];
    const uniqueProviders = Array.from(new Set(localItems.flatMap(i => i.proveedores || []).filter(Boolean))) as string[];"""
content = content.replace(filter_anchor, filter_new)

# Add dropdowns to UI
ui_anchor = """<div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                    />
                </div>"""
ui_new = """<div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                    <div className="relative w-full lg:w-64">
                        <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                        />
                    </div>
                    
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-900"
                    >
                        <option value="ALL">Todas las Categorías</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select 
                        value={selectedProvider} 
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-900"
                    >
                        <option value="ALL">Todos los Proveedores</option>
                        {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as 'A-Z' | 'Z-A' | 'DEFAULT')}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-900"
                    >
                        <option value="DEFAULT">Orden por Defecto</option>
                        <option value="A-Z">A - Z</option>
                        <option value="Z-A">Z - A</option>
                    </select>
                </div>"""
content = content.replace(ui_anchor, ui_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added filters and sorting to ActiveConteoView")
