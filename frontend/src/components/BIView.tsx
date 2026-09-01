import { useState, useEffect } from 'react';
import {
    BarChart3, Clock, RefreshCw, Download, Maximize2, Settings,
    Activity, TrendingUp, Sparkles, DollarSign, Package,
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
import { BIDiagnosticoIAView } from './bi/BIDiagnosticoIAView';
import { BIBenchmarkHistoricoView } from './bi/BIBenchmarkHistoricoView';

type ModuleId = 'panel' | 'rentabilidad' | 'catalogo' | 'inventario' | 'ia' | 'ejecutivo';

interface ModuleConfig {
    id: ModuleId;
    label: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    containerBg: string;
    subTabActiveBg: string;
}

const MODULES: ModuleConfig[] = [
    {
        id: 'panel',
        label: '1. Panel General',
        activeBg: 'bg-[#EAF2FE]',
        activeText: 'text-sky-700',
        activeBorder: 'border-t-2 border-sky-500',
        containerBg: 'bg-[#EAF2FE]/70',
        subTabActiveBg: 'bg-sky-600 text-white'
    },
    {
        id: 'rentabilidad',
        label: '2. Rentabilidad & Negocio',
        activeBg: 'bg-[#E6F8F0]',
        activeText: 'text-emerald-700',
        activeBorder: 'border-t-2 border-emerald-500',
        containerBg: 'bg-[#E6F8F0]/70',
        subTabActiveBg: 'bg-emerald-600 text-white'
    },
    {
        id: 'catalogo',
        label: '3. Catálogo Inteligente',
        activeBg: 'bg-[#FEF6E6]',
        activeText: 'text-amber-800',
        activeBorder: 'border-t-2 border-amber-500',
        containerBg: 'bg-[#FEF6E6]/70',
        subTabActiveBg: 'bg-amber-600 text-white'
    },
    {
        id: 'inventario',
        label: '4. Inventario & Operación',
        activeBg: 'bg-[#FFEDE6]',
        activeText: 'text-orange-800',
        activeBorder: 'border-t-2 border-orange-500',
        containerBg: 'bg-[#FFEDE6]/70',
        subTabActiveBg: 'bg-orange-600 text-white'
    },
    {
        id: 'ia',
        label: '5. Inteligencia Artificial',
        activeBg: 'bg-[#EEF2FF]',
        activeText: 'text-indigo-700',
        activeBorder: 'border-t-2 border-indigo-500',
        containerBg: 'bg-[#EEF2FF]/70',
        subTabActiveBg: 'bg-indigo-600 text-white'
    },
    {
        id: 'ejecutivo',
        label: '6. Ejecutivo C-Level',
        activeBg: 'bg-[#F5EEFE]',
        activeText: 'text-purple-800',
        activeBorder: 'border-t-2 border-purple-500',
        containerBg: 'bg-[#F5EEFE]/70',
        subTabActiveBg: 'bg-purple-700 text-white'
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

    const currentModConfig = MODULES.find(m => m.id === activeModule) || MODULES[0];

    return (
        <div className="w-full space-y-0 rounded-3xl overflow-hidden bg-[#F6F9FE]">
            
            {/* ENCABEZADO SUPERIOR LIMPIO EN AZUL PASTEL */}
            <div className="bg-gradient-to-r from-sky-100/90 via-indigo-100/70 to-blue-100/90 px-6 pt-5 pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
                
                {/* LADO IZQUIERDO: TÍTULO Y SUBTÍTULO */}
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

                {/* LADO DERECHO: ACCIONES Y ESTADO EN LÍNEA */}
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

            {/* PESTAÑAS PRINCIPALES: BLANCAS ANTES DE PRESIONAR, PASTEL LUMINOSO AL SELECCIONAR */}
            <div className="bg-[#EBF2FD] px-4 pt-2.5 flex items-end gap-1 overflow-x-auto select-none">
                {MODULES.map((mod) => {
                    const isActive = activeModule === mod.id;
                    return (
                        <button
                            key={mod.id}
                            onClick={() => handleModuleChange(mod.id)}
                            className={`flex-1 min-w-[170px] py-3.5 px-5 font-black text-xs transition-all duration-200 flex items-center justify-center whitespace-nowrap cursor-pointer rounded-t-2xl relative ${
                                isActive
                                    ? `${mod.activeBg} ${mod.activeText} ${mod.activeBorder} shadow-xs -mb-[1px] z-10 scale-[1.01]`
                                    : 'bg-white text-slate-700 hover:bg-white hover:text-slate-900 shadow-2xs opacity-90'
                            }`}
                        >
                            <span>{mod.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* BARRA DE SUB-MÓDULOS CON EL COLOR PREDOMINANTE DE LA SECCIÓN SELECCIONADA */}
            <div className={`${currentModConfig.containerBg} px-6 py-3.5 flex items-center gap-2 overflow-x-auto text-xs font-bold select-none transition-colors duration-300`}>
                
                {activeModule === 'panel' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-sky-950 hover:bg-white/80'
                            }`}
                        >
                            <Activity size={15} className={subTab === 'default' ? 'text-white' : 'text-sky-600'} />
                            <span>Operación Diaria Día a Día</span>
                        </button>

                        <button
                            onClick={() => setSubTab('comparativas')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'comparativas'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-sky-950 hover:bg-white/80'
                            }`}
                        >
                            <TrendingUp size={15} className={subTab === 'comparativas' ? 'text-white' : 'text-sky-600'} />
                            <span>Comparativas Multitemporales (DoD/WoW/MoM)</span>
                        </button>

                        <button
                            onClick={() => setSubTab('benchmark')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'benchmark'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-sky-950 hover:bg-white/80'
                            }`}
                        >
                            <BarChart3 size={15} className={subTab === 'benchmark' ? 'text-white' : 'text-sky-600'} />
                            <span>Benchmark Histórico</span>
                        </button>

                        <button
                            onClick={() => setSubTab('diagnostico')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'diagnostico'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-sky-950 hover:bg-white/80'
                            }`}
                        >
                            <Sparkles size={15} className={subTab === 'diagnostico' ? 'text-amber-300 animate-pulse' : 'text-sky-600'} />
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
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-emerald-950 hover:bg-white/80'
                            }`}
                        >
                            <DollarSign size={15} className={subTab === 'default' ? 'text-white' : 'text-emerald-600'} />
                            <span>Márgenes & Rentabilidad Contable</span>
                        </button>
                        <button
                            onClick={() => setSubTab('sucursales')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'sucursales'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-emerald-950 hover:bg-white/80'
                            }`}
                        >
                            <Building2 size={15} className={subTab === 'sucursales' ? 'text-white' : 'text-emerald-600'} />
                            <span>Rentabilidad por Sucursal</span>
                        </button>
                        <button
                            onClick={() => setSubTab('productividad')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'productividad'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-emerald-950 hover:bg-white/80'
                            }`}
                        >
                            <UserCheck size={15} className={subTab === 'productividad' ? 'text-white' : 'text-emerald-600'} />
                            <span>Productividad & Cajeros</span>
                        </button>
                        <button
                            onClick={() => setSubTab('clientes')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'clientes'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-emerald-950 hover:bg-white/80'
                            }`}
                        >
                            <Users size={15} className={subTab === 'clientes' ? 'text-white' : 'text-emerald-600'} />
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
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-amber-950 hover:bg-white/80'
                            }`}
                        >
                            <Package size={15} className={subTab === 'default' ? 'text-white' : 'text-amber-600'} />
                            <span>Ranking de Productos & Matriz BCG</span>
                        </button>
                        <button
                            onClick={() => setSubTab('descuentos')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'descuentos'
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-amber-950 hover:bg-white/80'
                            }`}
                        >
                            <Tag size={15} className={subTab === 'descuentos' ? 'text-white' : 'text-amber-600'} />
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
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-orange-950 hover:bg-white/80'
                            }`}
                        >
                            <Boxes size={15} className={subTab === 'default' ? 'text-white' : 'text-orange-600'} />
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
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-indigo-950 hover:bg-white/80'
                            }`}
                        >
                            <Sparkles size={15} className={subTab === 'default' ? 'text-amber-300 animate-pulse' : 'text-indigo-600'} />
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
                                    ? `${currentModConfig.subTabActiveBg} font-black shadow-xs`
                                    : 'text-purple-950 hover:bg-white/80'
                            }`}
                        >
                            <Crown size={15} className={subTab === 'default' ? 'text-amber-300' : 'text-purple-600'} />
                            <span>Dashboard Gerencial C-Level & Score Empresarial</span>
                        </button>
                    </div>
                )}
            </div>

            {/* CONTENEDOR DE CONTENIDO CON ANIMACIÓN SUAVE */}
            <div className="p-4 bg-[#F6F9FE] min-h-[500px]">
                <div
                    className={`transition-all duration-300 transform ${
                        isAnimating
                            ? 'opacity-0 translate-y-2 scale-[0.995]'
                            : 'opacity-100 translate-y-0 scale-100'
                    }`}
                >
                    {activeModule === 'panel' && (
                        subTab === 'comparativas' ? <BIComparativasView /> :
                        subTab === 'benchmark' ? <BIBenchmarkHistoricoView /> :
                        subTab === 'diagnostico' ? <BIDiagnosticoIAView /> :
                        <BIPanelGeneralView />
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
