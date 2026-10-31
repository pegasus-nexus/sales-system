import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSucursales } from '../api/api';
import { useBranchStore } from '../store/branchStore';
import { useAuthStore } from '../store/authStore';
import { Store, ChevronDown, Check, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function BranchSwitcherDropdown() {
    const { role, user } = useAuthStore();
    const { activeSucursalId, activeSucursalName, setActiveBranch } = useBranchStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isMatrixUser = role && ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN', 'SUPERADMIN_STAFF'].includes(role);

    const { data: sucursales = [], isLoading } = useQuery({
        queryKey: ['sucursales-list-switcher'],
        queryFn: () => getSucursales(true),
        staleTime: 1000 * 60 * 5, // 5 min
        enabled: !!isMatrixUser,
    });

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // For single-branch user (Cajero / Admin de sucursal), show simple badge
    if (!isMatrixUser) {
        const branchDisplay = user?.sucursal_nombre || activeSucursalName || 'Mi Sucursal';
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-xs font-semibold shadow-2xs">
                <Store size={14} className="text-indigo-600 shrink-0" />
                <span className="truncate max-w-[140px]">{branchDisplay}</span>
            </div>
        );
    }

    const handleSelectBranch = (id: string | null, name: string) => {
        setActiveBranch(id, name);
        setIsOpen(false);
        if (!id) {
            toast.info('Contexto cambiado a: Todas las Sucursales (Consolidado)');
        } else {
            toast.success(`Contexto de sucursal activo: ${name}`);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-2xs hover:border-indigo-300 focus:outline-hidden cursor-pointer"
                title="Cambiar sucursal activa de trabajo"
            >
                <div className="w-5 h-5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    {activeSucursalId ? <Store size={12} /> : <Globe size={12} />}
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[9px] text-gray-400 font-bold uppercase leading-none">Sucursal Activa</span>
                    <span className="text-xs font-bold text-gray-800 truncate max-w-[150px] leading-tight">
                        {activeSucursalName}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Contexto Operativo</p>
                        <p className="text-xs text-gray-600">Filtra las operaciones y vistas por sucursal</p>
                    </div>

                    {/* Opción: Todas las Sucursales */}
                    <button
                        type="button"
                        onClick={() => handleSelectBranch(null, 'Todas las Sucursales')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            !activeSucursalId
                                ? 'bg-indigo-50 text-indigo-900 font-bold'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="text-indigo-600" />
                            <span>Todas las Sucursales</span>
                        </div>
                        {!activeSucursalId && <Check size={14} className="text-indigo-600" />}
                    </button>

                    <div className="my-1 border-t border-gray-100" />

                    {/* Lista de Sucursales Dinámicas */}
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {isLoading ? (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">Cargando sucursales...</div>
                        ) : sucursales.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">Sin sucursales registradas</div>
                        ) : (
                            sucursales.map((suc) => {
                                const isSelected = activeSucursalId === suc._id;
                                return (
                                    <button
                                        key={suc._id}
                                        type="button"
                                        onClick={() => handleSelectBranch(suc._id, suc.nombre)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'bg-indigo-50 text-indigo-900 font-bold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Store size={14} className={isSelected ? 'text-indigo-600' : 'text-gray-400'} />
                                            <div className="text-left truncate">
                                                <div className="truncate font-semibold">{suc.nombre}</div>
                                                {suc.ciudad && (
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                        <MapPin size={9} />
                                                        <span>{suc.ciudad}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
