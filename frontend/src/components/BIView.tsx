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

export default function BIView() {
    const [activeModule, setActiveModule] = useState<ModuleId>('panel');
    const [subTab, setSubTab] = useState<string>('default');

    const handleModuleChange = (mod: ModuleId) => {
        setActiveModule(mod);
        setSubTab('default');
    };

    return (
        <div className="w-full space-y-4">
            
            {/* NIVELES DE NAVEGACIÓN 1: LOS 6 GRANDES MÓDULOS DEL CENTRO DE INTELIGENCIA */}
            <div className="bg-slate-900 rounded-3xl p-3 shadow-md border border-slate-800 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 overflow-x-auto">
                
                {/* MÓDULO 1: PANEL GENERAL */}
                <button
                    onClick={() => handleModuleChange('panel')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeModule === 'panel'
                            ? 'bg-blue-600 text-white shadow-md border border-blue-400/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                >
                    <LayoutDashboard size={16} className={activeModule === 'panel' ? 'text-blue-200' : 'text-blue-400'} />
                    <span>1. Panel General</span>
                </button>

                {/* MÓDULO 2: RENTABILIDAD & NEGOCIO */}
                <button
                    onClick={() => handleModuleChange('rentabilidad')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeModule === 'rentabilidad'
                            ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                >
                    <DollarSign size={16} className={activeModule === 'rentabilidad' ? 'text-emerald-200' : 'text-emerald-400'} />
                    <span>2. Rentabilidad & Negocio</span>
                </button>

                {/* MÓDULO 3: CATÁLOGO INTELIGENTE */}
                <button
                    onClick={() => handleModuleChange('catalogo')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeModule === 'catalogo'
                            ? 'bg-amber-600 text-white shadow-md border border-amber-400/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                >
                    <Package size={16} className={activeModule === 'catalogo' ? 'text-amber-200' : 'text-amber-400'} />
                    <span>3. Catálogo Inteligente</span>
                </button>

                {/* MÓDULO 4: INVENTARIO & OPERACIÓN */}
                <button
                    onClick={() => handleModuleChange('inventario')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeModule === 'inventario'
                            ? 'bg-orange-600 text-white shadow-md border border-orange-400/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                >
                    <Boxes size={16} className={activeModule === 'inventario' ? 'text-orange-200' : 'text-orange-400'} />
                    <span>4. Inventario & Operación</span>
                </button>

                {/* MÓDULO 5: INTELIGENCIA ARTIFICIAL */}
                <button
                    onClick={() => handleModuleChange('ia')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeModule === 'ia'
                            ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/40'
                            : 'text-indigo-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                >
                    <Sparkles size={16} className={activeModule === 'ia' ? 'text-amber-300 animate-pulse' : 'text-indigo-400'} />
                    <span>5. Inteligencia Artificial</span>
                </button>

                {/* MÓDULO 6: EJECUTIVO */}
                <button
                    onClick={() => handleModuleChange('ejecutivo')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeModule === 'ejecutivo'
                            ? 'bg-purple-700 text-white shadow-md border border-purple-400/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                >
                    <Crown size={16} className={activeModule === 'ejecutivo' ? 'text-amber-300' : 'text-purple-400'} />
                    <span>6. Ejecutivo</span>
                </button>
            </div>

            {/* NIVELES DE NAVEGACIÓN 2: SUB-MÓDULOS Y VISTAS CONTEXTUALES */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/70 flex items-center gap-2 overflow-x-auto text-xs font-bold">
                
                {activeModule === 'panel' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'default' ? 'bg-blue-50 text-blue-700 font-black border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            📊 Operación Diaria Día a Día
                        </button>
                        <button
                            onClick={() => setSubTab('comparativas')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'comparativas' ? 'bg-blue-50 text-blue-700 font-black border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
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
                                subTab === 'default' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            💵 Márgenes & Rentabilidad Contable
                        </button>
                        <button
                            onClick={() => setSubTab('sucursales')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'sucursales' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            🏬 Rentabilidad por Sucursal
                        </button>
                        <button
                            onClick={() => setSubTab('productividad')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'productividad' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            👤 Productividad & Cajeros
                        </button>
                        <button
                            onClick={() => setSubTab('clientes')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'clientes' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:bg-slate-50'
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
                                subTab === 'default' ? 'bg-amber-50 text-amber-700 font-black border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            📦 Ranking de Productos & Categorías
                        </button>
                        <button
                            onClick={() => setSubTab('descuentos')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                subTab === 'descuentos' ? 'bg-amber-50 text-amber-700 font-black border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
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
                                subTab === 'default' ? 'bg-orange-50 text-orange-700 font-black border border-orange-200' : 'text-slate-600 hover:bg-slate-50'
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
                                subTab === 'default' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-200' : 'text-slate-600 hover:bg-slate-50'
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
                                subTab === 'default' ? 'bg-purple-50 text-purple-700 font-black border border-purple-200' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            👑 Dashboard Gerencial C-Level & Score Empresarial
                        </button>
                    </div>
                )}
            </div>

            {/* VISTA CONTENEDORA PRINCIPAL */}
            <div>
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
