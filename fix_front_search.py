import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add searchQuery state and debounce logic
import_logic = """
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClientCombobox } from '../components/ClientCombobox';
import { toast } from 'sonner';
import { Users, Gift, MousePointerClick, RefreshCcw, Search } from 'lucide-react';
"""
content = re.sub(
    r"import \{ useState \} from 'react';[\s\S]*?import \{ Users, Gift, MousePointerClick, RefreshCcw \} from 'lucide-react';",
    import_logic.strip(),
    content
)

state_logic = """
    const [miembrosPage, setMiembrosPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setMiembrosPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: miembros, isLoading: miembrosLoading, refetch: refetchMiembros } = useQuery({
        queryKey: ['comunidad-miembros', miembrosPage, debouncedSearch],
        queryFn: async () => {
            const skip = (miembrosPage - 1) * 10;
            const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
            const res = await client<any>(`/comunidad/miembros?limit=10&skip=${skip}${searchParam}`);
            return res;
        }
    });
"""
content = re.sub(
    r"const \[miembrosPage, setMiembrosPage\] = useState\(1\);\n    const \{ data: miembros, isLoading: miembrosLoading, refetch: refetchMiembros \} = useQuery\(\{[\s\S]*?\}\);",
    state_logic.strip(),
    content
)


# 2. Add search bar UI above the table
search_bar_ui = """
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">Miembros de la Comunidad Web</h2>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">NUEVO</span>
                    </div>
                    
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, CI, teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                        />
                    </div>
                </div>
"""
content = re.sub(
    r"<div className=\"p-5 border-b border-gray-100 flex items-center gap-2\">\n                    <h2 className=\"text-lg font-bold text-gray-900\">Miembros de la Comunidad Web</h2>\n                    <span className=\"bg-indigo-100 text-indigo-700 px-2 py-0\.5 rounded text-xs font-bold\">NUEVO</span>\n                </div>",
    search_bar_ui.strip(),
    content
)


# 3. Update the prizes rendering to include dates
prize_rendering_old = """
                                                <div className="flex flex-col gap-1">
                                                    {miembro.premios_canjeados.map((p: string, i: number) => (
                                                        <span key={i} className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap">
                                                            {p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
"""
prize_rendering_new = """
                                                <div className="flex flex-col gap-2">
                                                    {miembro.premios_canjeados.map((p: string, i: number) => {
                                                        const dateIso = miembro.premios_canjeados_fechas?.[p];
                                                        const dateStr = dateIso ? new Date(dateIso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Fecha no registrada';
                                                        const prizeName = p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.toUpperCase();
                                                        return (
                                                            <div key={i} className="flex flex-col gap-0.5">
                                                                <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap">
                                                                    {prizeName}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-medium">Canjeado: {dateStr}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
"""
content = content.replace(prize_rendering_old.strip(), prize_rendering_new.strip())

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
