import { useState, useEffect } from 'react';
import {
    BarChart3, Clock, RefreshCw, Download, Maximize2, Settings,
    Activity, TrendingUp, Radio, Sparkles, DollarSign, Package,
    Boxes, Crown, Users, Building2, UserCheck, Tag
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
    activeClass: string;
    inactiveClass: string;
}

const MODULES: ModuleConfig[] = [
    {
        id: 'panel',
        label: '1. Panel General',
        activeClass: 'bg-[#0284C7] text-white font-black shadow-xs',
        inactiveClass: 'bg-[#E0F2FE]/80 text-[#0369A1] hover:bg-[#E0F2FE]'
    },
    {
        id: 'rentabilidad',
        label: '2. Rentabilidad & Negocio',
        activeClass: 'bg-[#059669] text-white font-black shadow-xs',
        inactiveClass: 'bg-[#D1FAE5]/80 text-[#047857] hover:bg-[#D1FAE5]'
    },
    {
        id: 'catalogo',
        label: '3. Catálogo Inteligente',
        activeClass: 'bg-[#D97706] text-white font-black shadow-xs',
        inactiveClass: 'bg-[#FEF3C7]/80 text-[#B45309] hover:bg-[#FEF3C7]'
    },
    {
        id: 'inventario',
        label: '4. Inventario & Operación',
        activeClass: 'bg-[#EA580C] text-white font-black shadow-xs',
        inactiveClass: 'bg-[#FFEDD5]/80 text-[#C2410C] hover:bg-[#FFEDD5]'
    },
    {
        id: 'ia',
        label: '5. Inteligencia Artificial',
        activeClass: 'bg-[#4F46E5] text-white font-black shadow-xs',
        inactiveClass: 'bg-[#E0E7FF]/80 text-[#4338CA] hover:bg-[#E0E7FF]'
    },
    {
        id: 'ejecutivo',
        label: '6. Ejecutivo C-Level',
        activeClass: 'bg-[#9333EA] text-white font-black shadow-xs',
        inactiveClass: 'bg-[#F3E8FF]/80 text-[#6B21A8] hover:bg-[#F3E8FF]'
    },
];

export default function BIView() {
    const [activeModule, setActiveModule] = useState<ModuleId>('panel');
    const [subTab, setSubTab] = useState<string>('default');
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeStr = new Intl.DateTimeFormat('es-BO', {
                timeZone: 'America/La_Paz',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(now);
            setCurrentTime(timeStr);
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleModuleChange = (mod: ModuleId) => {
        if (mod === activeModule) return;
        setIsAnimating(true);
        setTimeout(() => {
            setActiveModule(mod);
            setSubTab('default');
            setIsAnimating(false);
        }, 180);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <div className="w-full space-y-0 rounded-3xl overflow-hidden bg-[#F8FAFC]">
            
            {/* BARRA SUPERIOR EN AZUL PASTEL CLARO */}
            <div className="bg-gradient-to-r from-sky-100/90 via-indigo-100/70 to-blue-100/90 px-6 pt-5 pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
                
                {/* LADO IZQUIERDO: TÍTULO EN TONOS AZUL PASTEL */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white text-indigo-600 rounded-2xl shadow-xs shrink-0 border border-indigo-100">
                        <BarChart3 size={24} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h1 className="text-base md:text-lg font-black tracking-tight uppercase text-indigo-950 leading-tight">
                            Centro de Inteligencia de Negocios
                        </h1>
                        <span className="text-[11px] font-bold text-indigo-600 tracking-wider flex items-center gap-1">
                            ★ MODELO ESTRELLA
                        </span>
                    </div>
                </div>

                {/* LADO DERECHO: ACCIONES Y ESTADO EN PASTEL */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-indigo-950">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-200/80">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span className="font-extrabold text-[11px]">Sistema en Línea</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-indigo-100 text-indigo-900 shadow-xs">
                        <Clock size={14} className="text-indigo-400" />
                        <span>{currentTime || '01:20:42'}</span>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-indigo-100 text-indigo-900 hover:text-indigo-600 shadow-xs transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-indigo-100 text-indigo-900 hover:text-indigo-600 shadow-xs transition-all cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-xl bg-white/80 hover:bg-white border border-indigo-100 text-indigo-900 hover:text-indigo-600 shadow-xs transition-all cursor-pointer"
                        title="Pantalla Completa"
                    >
                        <Maximize2 size={14} />
                    </button>

                    <button
                        className="p-2 rounded-xl bg-white/80 hover:bg-white border border-indigo-100 text-indigo-900 hover:text-indigo-600 shadow-xs transition-all cursor-pointer"
                        title="Configuración"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* PESTAÑAS ESTILO SOLAPA CON COLORES PASTEL INDIVIDUALES HARMONIZADOS */}
            <div className="bg-[#E4EFFD] px-4 pt-2.5 flex items-end gap-1.5 overflow-x-auto select-none">
                {MODULES.map((mod) => {
                    const isActive = activeModule === mod.id;
                    return (
                        <button
                            key={mod.id}
                            onClick={() => handleModuleChange(mod.id)}
                            className={`flex-1 min-w-[170px] py-3.5 px-4 font-black text-xs transition-all duration-200 flex items-center justify-center whitespace-nowrap cursor-pointer rounded-t-2xl relative ${
                                isActive
                                    ? `${mod.activeClass} -mb-[1px] z-10 scale-[1.01]`
                                    : `${mod.inactiveClass} opacity-90`
                            }`}
                        >
                            <span>{mod.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* BARRA DE SUB-MÓDULOS EN CÁPSULAS UNIFICADA SIN BORDES INTERMEDIOS */}
            <div className="bg-white px-6 py-3.5 flex items-center gap-2 overflow-x-auto text-xs font-bold select-none">
                
                {activeModule === 'panel' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-sky-100 text-sky-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-indigo-900 hover:bg-sky-50'
                            }`}
                        >
                            <Activity size={15} className={subTab === 'default' ? 'text-sky-700' : 'text-slate-400'} />
                            <span>Operación Diaria Día a Día</span>
                        </button>

                        <button
                            onClick={() => setSubTab('comparativas')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'comparativas'
                                    ? 'bg-sky-100 text-sky-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-indigo-900 hover:bg-sky-50'
                            }`}
                        >
                            <TrendingUp size={15} className={subTab === 'comparativas' ? 'text-sky-700' : 'text-slate-400'} />
                            <span>Comparativas Multitemporales (DoD/WoW/MoM)</span>
                        </button>

                        <button
                            onClick={() => setSubTab('monitor')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'monitor'
                                    ? 'bg-sky-100 text-sky-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-indigo-900 hover:bg-sky-50'
                            }`}
                        >
                            <Radio size={15} className={subTab === 'monitor' ? 'text-sky-700' : 'text-slate-400'} />
                            <span>Monitor POS & Conexiones</span>
                        </button>

                        <button
                            onClick={() => setSubTab('diagnostico')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'diagnostico'
                                    ? 'bg-sky-100 text-sky-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-indigo-900 hover:bg-sky-50'
                            }`}
                        >
                            <Sparkles size={15} className={subTab === 'diagnostico' ? 'text-sky-700 animate-pulse' : 'text-slate-400'} />
                            <span>Diagnóstico IA del Día</span>
                        </button>
                    </div>
                )}

                {activeModule === 'rentabilidad' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-emerald-100 text-emerald-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                            }`}
                        >
                            <DollarSign size={15} className="text-emerald-700" />
                            <span>Márgenes & Rentabilidad Contable</span>
                        </button>
                        <button
                            onClick={() => setSubTab('sucursales')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'sucursales'
                                    ? 'bg-emerald-100 text-emerald-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                            }`}
                        >
                            <Building2 size={15} className="text-emerald-700" />
                            <span>Rentabilidad por Sucursal</span>
                        </button>
                        <button
                            onClick={() => setSubTab('productividad')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'productividad'
                                    ? 'bg-emerald-100 text-emerald-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                            }`}
                        >
                            <UserCheck size={15} className="text-emerald-700" />
                            <span>Productividad & Cajeros</span>
                        </button>
                        <button
                            onClick={() => setSubTab('clientes')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'clientes'
                                    ? 'bg-emerald-100 text-emerald-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                            }`}
                        >
                            <Users size={15} className="text-emerald-700" />
                            <span>Comportamiento de Clientes & Pagos</span>
                        </button>
                    </div>
                )}

                {activeModule === 'catalogo' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-amber-100 text-amber-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
                            }`}
                        >
                            <Package size={15} className="text-amber-700" />
                            <span>Ranking de Productos & Matriz BCG</span>
                        </button>
                        <button
                            onClick={() => setSubTab('descuentos')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'descuentos'
                                    ? 'bg-amber-100 text-amber-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
                            }`}
                        >
                            <Tag size={15} className="text-amber-700" />
                            <span>Descuentos & Promociones</span>
                        </button>
                    </div>
                )}

                {activeModule === 'inventario' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-orange-100 text-orange-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-orange-900 hover:bg-orange-50'
                            }`}
                        >
                            <Boxes size={15} className="text-orange-700" />
                            <span>Stock Actual & Demanda Predictiva IA</span>
                        </button>
                    </div>
                )}

                {activeModule === 'ia' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-indigo-100 text-indigo-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50'
                            }`}
                        >
                            <Sparkles size={15} className="text-indigo-700 animate-pulse" />
                            <span>Forecast, Causal & Chat BI Conversacional</span>
                        </button>
                    </div>
                )}

                {activeModule === 'ejecutivo' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-purple-100 text-purple-900 font-black shadow-xs'
                                    : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                            }`}
                        >
                            <Crown size={15} className="text-purple-700" />
                            <span>Dashboard Gerencial C-Level & Score Empresarial</span>
                        </button>
                    </div>
                )}
            </div>

            {/* CONTENEDOR DE CONTENIDO CON ANIMACIÓN SUAVE */}
            <div className="p-4 bg-[#F8FAFC] min-h-[500px]">
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

        </div>
    );
}
