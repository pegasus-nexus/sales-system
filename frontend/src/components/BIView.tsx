import { useState } from 'react';
import {
    Sparkles, LayoutDashboard, Package, Boxes, DollarSign, Crown
} from 'lucide-react';
import { BIPanelGeneralView } from './bi/BIPanelGeneralView';
import { BIComparativasView } from './bi/BIComparativasView';
import { BIProductosView } from './bi/BIProductosView';
import { BIClientesView } from './bi/BIClientesView';
import { BISucursalesView } from './bi/BISucursalesView';
import { BIInventarioView } from './bi/BIInventarioView';
import { BIRentabilidadView } from './bi/BIRentabilidadView';
import { BIDescuentosView } from './bi/BIDescuentosView';
import { BIProductividadView } from './bi/BIProductividadView';
import { BIEjecutivoView } from './bi/BIEjecutivoView';
import { BIIAAnalyticaView } from './bi/BIIAAnalyticaView';

type ModuleId = 'panel' | 'rentabilidad' | 'catalogo' | 'inventario' | 'ia' | 'ejecutivo';

interface ModuleConfig {
    id: ModuleId;
    label: string;
    icon: any;
    accentColor: string;
}

const MODULES: ModuleConfig[] = [
    { id: 'panel', label: '1. Panel General', icon: LayoutDashboard, accentColor: 'text-sky-600' },
    { id: 'rentabilidad', label: '2. Rentabilidad & Negocio', icon: DollarSign, accentColor: 'text-emerald-600' },
    { id: 'catalogo', label: '3. Catálogo Inteligente', icon: Package, accentColor: 'text-amber-600' },
    { id: 'inventario', label: '4. Inventario & Operación', icon: Boxes, accentColor: 'text-orange-600' },
    { id: 'ia', label: '5. Inteligencia Artificial', icon: Sparkles, accentColor: 'text-indigo-600' },
    { id: 'ejecutivo', label: '6. Ejecutivo C-Level', icon: Crown, accentColor: 'text-purple-600' },
];

export default function BIView() {
    const [activeModule, setActiveModule] = useState<ModuleId>('panel');
    const [subTab, setSubTab] = useState<string>('default');
    const [isAnimating, setIsAnimating] = useState<boolean>(false);

    const handleModuleChange = (mod: ModuleId) => {
        if (mod === activeModule) return;
        setIsAnimating(true);
        setTimeout(() => {
            setActiveModule(mod);
            setSubTab('default');
            setIsAnimating(false);
        }, 180);
    };

    return (
        <div className="w-full space-y-3">
            
            {/* CONTENEDOR DE PESTAÑAS ESTILO CARPETA — COLOR CLARO / AZUL PASTEL */}
            <div className="bg-[#EBF2FC]/90 p-2 pt-3 rounded-t-3xl border-b-2 border-indigo-200/80 flex items-end gap-1.5 overflow-x-auto select-none">
                {MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = activeModule === mod.id;
                    return (
                        <button
                            key={mod.id}
                            onClick={() => handleModuleChange(mod.id)}
                            className={`px-5 py-3 rounded-t-2xl font-black text-xs transition-all duration-200 flex items-center gap-2 whitespace-nowrap relative cursor-pointer ${
                                isActive
                                    ? 'bg-white text-indigo-950 shadow-sm border-t-2 border-x-2 border-indigo-200 -mb-[2px] z-10 scale-[1.02]'
                                    : 'bg-indigo-50/60 text-slate-600 hover:bg-white/80 hover:text-indigo-900 border-t border-x border-indigo-100/80'
                            }`}
                        >
                            <Icon size={16} className={isActive ? mod.accentColor : 'text-slate-400'} />
                            <span>{mod.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* BARRA DE SUB-MÓDULOS EN PASTEL CLARO */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-indigo-100 flex items-center gap-2 overflow-x-auto text-xs font-bold">
                {activeModule === 'panel' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-sky-100 text-sky-900 font-black border border-sky-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            📊 Operación Diaria Día a Día
                        </button>
                        <button
                            onClick={() => setSubTab('comparativas')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'comparativas' ? 'bg-sky-100 text-sky-900 font-black border border-sky-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            📈 Comparativas Multitemporales (DoD/WoW/MoM)
                        </button>
                    </div>
                )}

                {activeModule === 'rentabilidad' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            💵 Márgenes & Rentabilidad Contable
                        </button>
                        <button
                            onClick={() => setSubTab('sucursales')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'sucursales' ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            🏬 Rentabilidad por Sucursal
                        </button>
                        <button
                            onClick={() => setSubTab('productividad')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'productividad' ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            👤 Productividad & Cajeros
                        </button>
                        <button
                            onClick={() => setSubTab('clientes')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'clientes' ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            👥 Comportamiento de Clientes & Pagos
                        </button>
                    </div>
                )}

                {activeModule === 'catalogo' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-amber-100 text-amber-900 font-black border border-amber-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            📦 Ranking de Productos & Categorías
                        </button>
                        <button
                            onClick={() => setSubTab('descuentos')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'descuentos' ? 'bg-amber-100 text-amber-900 font-black border border-amber-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            🏷️ Descuentos & Impacto Promocional
                        </button>
                    </div>
                )}

                {activeModule === 'inventario' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-orange-100 text-orange-900 font-black border border-orange-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            🗃️ Stock Actual & Demanda Predictiva
                        </button>
                    </div>
                )}

                {activeModule === 'ia' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-indigo-100 text-indigo-900 font-black border border-indigo-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            ✨ Forecast, Causal & Chat BI Conversacional
                        </button>
                    </div>
                )}

                {activeModule === 'ejecutivo' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-purple-100 text-purple-900 font-black border border-purple-300/80' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            👑 Dashboard Gerencial C-Level & Score Empresarial
                        </button>
                    </div>
                )}
            </div>

            {/* CONTENEDOR CON ANIMACIÓN DE TRANSICIÓN SUAVE */}
            <div
                className={`transition-all duration-300 transform ${
                    isAnimating
                        ? 'opacity-0 translate-y-2 scale-[0.995]'
                        : 'opacity-100 translate-y-0 scale-100'
                }`}
            >
                {activeModule === 'panel' && (
                    subTab === 'comparativas' ? <BIComparativasView /> : <BIPanelGeneralView />
                )}

                {activeModule === 'rentabilidad' && (
                    subTab === 'sucursales' ? <BISucursalesView /> :
                    subTab === 'productividad' ? <BIProductividadView /> :
                    subTab === 'clientes' ? <BIClientesView /> :
                    <BIRentabilidadView />
                )}

                {activeModule === 'catalogo' && (
                    subTab === 'descuentos' ? <BIDescuentosView /> : <BIProductosView />
                )}

                {activeModule === 'inventario' && (
                    <BIInventarioView />
                )}

                {activeModule === 'ia' && (
                    <BIIAAnalyticaView />
                )}

                {activeModule === 'ejecutivo' && (
                    <BIEjecutivoView />
                )}
            </div>

        </div>
    );
}
