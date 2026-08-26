import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Package, Users, Building2, Boxes, DollarSign } from 'lucide-react';
import { BIPanelGeneralView } from './bi/BIPanelGeneralView';
import { BIComparativasView } from './bi/BIComparativasView';
import { BIProductosView } from './bi/BIProductosView';
import { BIClientesView } from './bi/BIClientesView';
import { BISucursalesView } from './bi/BISucursalesView';
import { BIInventarioView } from './bi/BIInventarioView';
import { BIRentabilidadView } from './bi/BIRentabilidadView';

export default function BIView() {
    const [subTab, setSubTab] = useState<'panel' | 'comparativas' | 'productos' | 'clientes' | 'sucursales' | 'inventario' | 'rentabilidad'>('panel');

    return (
        <div className="w-full space-y-4">
            {/* SUB-NAVEGACIÓN INTERNA EN PASTEL PARA EL CENTRO DE INTELIGENCIA DE NEGOCIOS */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/70 flex items-center gap-2 max-w-6xl mx-auto sm:mx-0 overflow-x-auto">
                <button
                    onClick={() => setSubTab('panel')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'panel'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <LayoutDashboard size={14} />
                    <span>Panel General</span>
                </button>

                <button
                    onClick={() => setSubTab('comparativas')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'comparativas'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <TrendingUp size={14} />
                    <span>Comparativas</span>
                </button>

                <button
                    onClick={() => setSubTab('productos')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'productos'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <Package size={14} />
                    <span>Productos & Categorías</span>
                </button>

                <button
                    onClick={() => setSubTab('clientes')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'clientes'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <Users size={14} />
                    <span>Clientes & Pagos</span>
                </button>

                <button
                    onClick={() => setSubTab('sucursales')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'sucursales'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <Building2 size={14} />
                    <span>Sucursales</span>
                </button>

                <button
                    onClick={() => setSubTab('inventario')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'inventario'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <Boxes size={14} />
                    <span>Inventario & Stock</span>
                </button>

                <button
                    onClick={() => setSubTab('rentabilidad')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        subTab === 'rentabilidad'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <DollarSign size={14} />
                    <span>Rentabilidad & Margen</span>
                </button>
            </div>

            {/* CONTENIDO SEGÚN SUBTAB SELECCIONADA */}
            {subTab === 'panel' && <BIPanelGeneralView />}
            {subTab === 'comparativas' && <BIComparativasView />}
            {subTab === 'productos' && <BIProductosView />}
            {subTab === 'clientes' && <BIClientesView />}
            {subTab === 'sucursales' && <BISucursalesView />}
            {subTab === 'inventario' && <BIInventarioView />}
            {subTab === 'rentabilidad' && <BIRentabilidadView />}
        </div>
    );
}
