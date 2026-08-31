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
}

const MODULES: ModuleConfig[] = [
    { id: 'panel', label: '1. Panel General' },
    { id: 'rentabilidad', label: '2. Rentabilidad & Negocio' },
    { id: 'catalogo', label: '3. Catálogo Inteligente' },
    { id: 'inventario', label: '4. Inventario & Operación' },
    { id: 'ia', label: '5. Inteligencia Artificial' },
    { id: 'ejecutivo', label: '6. Ejecutivo C-Level' },
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
        <div className="w-full space-y-0 shadow-lg rounded-3xl overflow-hidden border border-slate-800/80 bg-[#0F172A]">
            
            {/* BARRA SUPERIOR OSCURA CON TÍTULO, ACCIONES Y ESTADO EN LÍNEA */}
            <div className="bg-[#0F172A] px-6 pt-5 pb-3 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
                
                {/* LADO IZQUIERDO: LOGO / TÍTULO DEL SISTEMA */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white text-blue-600 rounded-2xl shadow-sm shrink-0">
                        <BarChart3 size={24} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h1 className="text-base md:text-lg font-black tracking-tight uppercase text-white leading-tight">
                            Centro de Inteligencia de Negocios
                        </h1>
                        <span className="text-[11px] font-bold text-amber-400 tracking-wider flex items-center gap-1">
                            ★ MODELO ESTRELLA
                        </span>
                    </div>
                </div>

                {/* LADO DERECHO: METADATOS Y BOTONES DE ACCIÓN */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span className="font-extrabold text-[11px]">Sistema en Línea</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-750 text-slate-200">
                        <Clock size={14} className="text-slate-400" />
                        <span>{currentTime || '01:20:42'}</span>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-750 border border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-750 border border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-xl bg-slate-850 hover:bg-slate-750 border border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                        title="Pantalla Completa"
                    >
                        <Maximize2 size={14} />
                    </button>

                    <button
                        className="p-2 rounded-xl bg-slate-850 hover:bg-slate-750 border border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                        title="Configuración"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* PESTAÑAS PRINCIPALES ESTILO SOLAPA DE CARPETA (SIN ÍCONOS DE CARPETAS) */}
            <div className="bg-[#0F172A] px-4 pt-2 flex items-end gap-1.5 overflow-x-auto select-none border-b border-slate-800">
                {MODULES.map((mod) => {
                    const isActive = activeModule === mod.id;
                    return (
                        <button
                            key={mod.id}
                            onClick={() => handleModuleChange(mod.id)}
                            className={`flex-1 min-w-[170px] py-3.5 px-5 font-black text-xs transition-all duration-200 flex items-center justify-center whitespace-nowrap cursor-pointer rounded-t-2xl relative ${
                                isActive
                                    ? 'bg-white text-blue-600 shadow-md border-t-2 border-x-2 border-blue-200 -mb-[1px] z-10 scale-[1.01]'
                                    : 'bg-slate-100/90 text-slate-800 hover:bg-white hover:text-blue-900 border-t border-x border-slate-200/80 opacity-90'
                            }`}
                        >
                            <span>{mod.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* BARRA DE SUB-MÓDULOS EN CÁPSULAS CON ÍCONOS PINTADOS */}
            <div className="bg-white px-6 py-3 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs font-bold select-none">
                
                {activeModule === 'panel' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSubTab('default')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'default'
                                    ? 'bg-blue-50 text-blue-600 font-black border border-blue-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Activity size={15} className={subTab === 'default' ? 'text-blue-600' : 'text-slate-400'} />
                            <span>Operación Diaria Día a Día</span>
                        </button>

                        <button
                            onClick={() => setSubTab('comparativas')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'comparativas'
                                    ? 'bg-blue-50 text-blue-600 font-black border border-blue-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <TrendingUp size={15} className={subTab === 'comparativas' ? 'text-blue-600' : 'text-slate-400'} />
                            <span>Comparativas Multitemporales (DoD/WoW/MoM)</span>
                        </button>

                        <button
                            onClick={() => setSubTab('monitor')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'monitor'
                                    ? 'bg-blue-50 text-blue-600 font-black border border-blue-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Radio size={15} className={subTab === 'monitor' ? 'text-blue-600' : 'text-slate-400'} />
                            <span>Monitor POS & Conexiones</span>
                        </button>

                        <button
                            onClick={() => setSubTab('diagnostico')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'diagnostico'
                                    ? 'bg-blue-50 text-blue-600 font-black border border-blue-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Sparkles size={15} className={subTab === 'diagnostico' ? 'text-blue-600 animate-pulse' : 'text-slate-400'} />
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
                                    ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <DollarSign size={15} className="text-emerald-600" />
                            <span>Márgenes & Rentabilidad Contable</span>
                        </button>
                        <button
                            onClick={() => setSubTab('sucursales')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'sucursales'
                                    ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Building2 size={15} className="text-emerald-600" />
                            <span>Rentabilidad por Sucursal</span>
                        </button>
                        <button
                            onClick={() => setSubTab('productividad')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'productividad'
                                    ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <UserCheck size={15} className="text-emerald-600" />
                            <span>Productividad & Cajeros</span>
                        </button>
                        <button
                            onClick={() => setSubTab('clientes')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'clientes'
                                    ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Users size={15} className="text-emerald-600" />
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
                                    ? 'bg-amber-50 text-amber-800 font-black border border-amber-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Package size={15} className="text-amber-600" />
                            <span>Ranking de Productos & Matriz BCG</span>
                        </button>
                        <button
                            onClick={() => setSubTab('descuentos')}
                            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'descuentos'
                                    ? 'bg-amber-50 text-amber-800 font-black border border-amber-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Tag size={15} className="text-amber-600" />
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
                                    ? 'bg-orange-50 text-orange-800 font-black border border-orange-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Boxes size={15} className="text-orange-600" />
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
                                    ? 'bg-indigo-50 text-indigo-800 font-black border border-indigo-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Sparkles size={15} className="text-indigo-600 animate-pulse" />
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
                                    ? 'bg-purple-50 text-purple-800 font-black border border-purple-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Crown size={15} className="text-purple-600" />
                            <span>Dashboard Gerencial C-Level & Score Empresarial</span>
                        </button>
                    </div>
                )}
            </div>

            {/* CONTENEDOR CON ANIMACIÓN DE TRANSICIÓN SUAVE ENTRE MÓDULOS */}
            <div className="p-4 bg-slate-100/60 min-h-[500px]">
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
