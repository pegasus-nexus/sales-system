import { useState } from 'react';
import {
    Sparkles, LayoutDashboard, Package, Boxes, DollarSign, Crown, X
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
    color: string;
}

const MODULES: ModuleConfig[] = [
    { id: 'panel', label: '1. Panel General', icon: LayoutDashboard, color: 'from-slate-700 to-slate-800' },
    { id: 'rentabilidad', label: '2. Rentabilidad & Negocio', icon: DollarSign, color: 'from-emerald-700 to-emerald-800' },
    { id: 'catalogo', label: '3. Catálogo Inteligente', icon: Package, color: 'from-amber-700 to-amber-800' },
    { id: 'inventario', label: '4. Inventario & Operación', icon: Boxes, color: 'from-orange-700 to-orange-800' },
    { id: 'ia', label: '5. Inteligencia Artificial', icon: Sparkles, color: 'from-indigo-700 to-indigo-800' },
    { id: 'ejecutivo', label: '6. Ejecutivo C-Level', icon: Crown, color: 'from-purple-800 to-purple-900' },
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

    const currentModuleInfo = MODULES.find(m => m.id === activeModule) || MODULES[0];

    return (
        <div className="w-full space-y-4">
            
            {/* BARRA SUPERIOR DE PESTAÑAS INTEGRADA AL ESTILO "MAC / MODERN CAPSULE DIAL" */}
            <div className="bg-[#2B2D30] rounded-3xl p-2.5 shadow-xl border border-slate-700/60 flex items-center justify-between gap-2 overflow-x-auto select-none">
                
                {/* BOTÓN MÓDULO ACTIVO (ESTILO SOLAPA PRINCIPAL RETRAÍBLE) */}
                <div className="flex items-center gap-2 bg-[#E2E4DC] text-slate-900 px-5 py-2.5 rounded-2xl shadow-inner font-extrabold text-sm border border-white/50 shrink-0 transition-all duration-300">
                    <button 
                        onClick={() => handleModuleChange('panel')}
                        className="p-1 rounded-full hover:bg-slate-300/60 text-slate-700 transition-colors cursor-pointer"
                        title="Ir al inicio"
                    >
                        <X size={14} />
                    </button>
                    <span className="tracking-tight text-slate-950 font-black flex items-center gap-2">
                        {currentModuleInfo.label}
                    </span>
                </div>

                {/* CÁPSULAS OVALADAS DE NAVEGACIÓN RÁPIDA DE LOS 6 MÓDULOS */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1">
                    {MODULES.map((mod) => {
                        const Icon = mod.icon;
                        const isActive = activeModule === mod.id;
                        return (
                            <button
                                key={mod.id}
                                onClick={() => handleModuleChange(mod.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-[#E2E4DC] text-slate-950 shadow-md font-black scale-105 border border-white/80'
                                        : 'bg-[#3A3D42] text-slate-200 hover:bg-[#464A50] hover:text-white border border-slate-600/40'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-slate-900' : 'text-slate-300'} />
                                <span>{mod.label.replace(/^\d+\.\s*/, '')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* NIVELES DE NAVEGACIÓN 2: SUB-MÓDULOS CON DISEÑO DE CÁPSULAS SUAVES */}
            <div className="bg-[#F4F5F0] rounded-2xl p-2 shadow-xs border border-slate-300/70 flex items-center gap-2 overflow-x-auto text-xs font-bold">
                
                {activeModule === 'panel' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                        >
                            📊 Operación Diaria Día a Día
                        </button>
                        <button
                            onClick={() => setSubTab('comparativas')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'comparativas' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
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
                                subTab === 'default' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                        >
                            💵 Márgenes & Rentabilidad Contable
                        </button>
                        <button
                            onClick={() => setSubTab('sucursales')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'sucursales' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                        >
                            🏬 Rentabilidad por Sucursal
                        </button>
                        <button
                            onClick={() => setSubTab('productividad')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'productividad' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                        >
                            👤 Productividad & Cajeros
                        </button>
                        <button
                            onClick={() => setSubTab('clientes')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'clientes' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
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
                                subTab === 'default' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                        >
                            📦 Ranking de Productos & Categorías
                        </button>
                        <button
                            onClick={() => setSubTab('descuentos')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'descuentos' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
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
                                subTab === 'default' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
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
                                subTab === 'default' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
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
                                subTab === 'default' ? 'bg-[#2B2D30] text-white font-black shadow-xs' : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                        >
                            👑 Dashboard Gerencial C-Level & Score Empresarial
                        </button>
                    </div>
                )}
            </div>

            {/* CONTENEDOR CON ANIMACIÓN DE TRANSICIÓN SUAVE (SUAVE FADE/SLIDE) */}
            <div
                className={`transition-all duration-300 transform ${
                    isAnimating
                        ? 'opacity-0 translate-y-2 scale-[0.99]'
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
