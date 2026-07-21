import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import {
    BrainCircuit, TrendingUp, Cpu,
    AlertTriangle, Sparkles, Activity, ArrowUpRight, BarChart3,
    Star, Coins, ArrowDownCircle, HelpCircle, Package,
    Zap, ShoppingCart, AlertCircle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
    ScatterChart, Scatter, ZAxis, ReferenceLine, BarChart, Bar, Cell
} from 'recharts';
import { getDemandPrediction, getAnalyticsBcg, getInventario } from '../api/api';
import type { DemandPredictionResponse } from '../api/types';

const fBs = (n?: number) => `Bs. ${(n||0).toLocaleString('es-BO',{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const fPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

type BcgItem = { nombre:string; crecimiento:number; cuota_mercado:number; ingresos:number; tipo:string };
type Horizonte = '30d'|'6m'|'1a';
type Prio = 'ALTA'|'MEDIA'|'BAJA';
interface Sug { producto:string; cuadrante:string; accion:string; prio:Prio; urgencia:string; ingresos:number }

const FACTOR:Record<string,number>={Estrella:1.4,Vaca:0.8,Interrogante:1.2,Perro:0.5};

/** Reclasifica usando umbrales por mediana para distribución balanceada, proyectando a futuro */
function buildFlat(raw:any, trend: number): BcgItem[] {
    if(!raw) return [];
    const keys=['estrellas','vacas','interrogantes','perros'];
    const all: BcgItem[] = [];
    for(const k of keys){
        for(const p of (raw[k]??[])){
            const ingresosActuales = Number(p.ingresos_actuales)||0;
            const originalType = k === 'estrellas' ? 'Estrella' : k === 'vacas' ? 'Vaca' : k === 'interrogantes' ? 'Interrogante' : 'Perro';
            const factor = FACTOR[originalType] || 1;
            
            // Predicción a 30 días (1 periodo)
            const ingresosFuturos = ingresosActuales * Math.pow(1 + (trend / 100) * factor, 1);
            const crecimientoFuturo = ingresosActuales > 0 ? (ingresosFuturos - ingresosActuales) / ingresosActuales : 0;
            
            all.push({
                nombre: String(p.nombre||''),
                crecimiento: crecimientoFuturo,
                cuota_mercado: 0, // se recalcula abajo
                ingresos: ingresosFuturos,
                tipo: ''
            });
        }
    }
    
    // Recalcular cuota de mercado predictiva
    const maxIngresosFuturos = Math.max(...all.map(p => p.ingresos), 1);
    all.forEach(p => {
        p.cuota_mercado = p.ingresos / maxIngresosFuturos;
    });

    // Filtrar inactivos para no sesgar la mediana
    const active = all.filter(p => p.ingresos > 0);
    
    let medCuota = 0.05;
    let medCrec = 0;
    
    if (active.length > 0) {
        const sorted_c = [...active.map(p=>p.cuota_mercado)].sort((a,b)=>a-b);
        const sorted_g = [...active.map(p=>p.crecimiento)].sort((a,b)=>a-b);
        const mid = Math.floor(active.length/2);
        medCuota = sorted_c[mid];
        medCrec  = sorted_g[mid];
    }
    
    // Establecer pisos mínimos para no clasificar productos muertos como "altos"
    const thresholdCuota = Math.max(0.01, medCuota);
    const thresholdCrec = Math.max(0, medCrec);
    
    return all.map(p=>{
        const hiCuota = p.cuota_mercado > thresholdCuota;
        const hiCrec  = p.crecimiento > thresholdCrec;
        
        let tipo = 'Perro';
        if(hiCuota && hiCrec)  tipo = 'Estrella';
        else if(hiCuota && !hiCrec) tipo = 'Vaca';
        else if(!hiCuota && hiCrec) tipo = 'Interrogante';
        return {...p, tipo};
    }).sort((a,b)=>b.ingresos-a.ingresos);
}

function getExplicacion(p: BcgItem, projectedGrowthPct: string): string {
    const g = (p.crecimiento*100).toFixed(1);
    const q = (p.cuota_mercado*100).toFixed(1);
    if(p.tipo==='Estrella')
        return `Crecimiento histórico de ${g}% con alta cuota de mercado (${q}%). El modelo proyecta una variación de ${projectedGrowthPct}% para los próximos 30 días. Priorizar reabastecimiento.`;
    if(p.tipo==='Vaca')
        return `Producto maduro (cuota ${q}%). Genera ingresos estables. La predicción indica un cambio de ${projectedGrowthPct}% en el próximo mes. Mantener inventario base.`;
    if(p.tipo==='Interrogante')
        return `Crecimiento detectado (${g}%) pero participación baja (${q}%). Proyección mensual: ${projectedGrowthPct}%. Requiere inversión en marketing focal.`;
    const dir = p.crecimiento<0 ? `Declive de ${Math.abs(Number(g))}%` : 'Estancamiento';
    return `${dir} histórico. La IA proyecta ${projectedGrowthPct}% a 30 días y recomienda ${p.crecimiento < -0.1 ? 'liquidar o descontinuar este SKU' : 'reducir pedidos gradualmente'}.`;
}

function buildSugs(flat:BcgItem[]): Sug[] {
    return flat.map(p=>{
        let accion='Mantener stock actual', prio:Prio='BAJA', urgencia='Sin urgencia';
        if(p.tipo==='Estrella'){accion='Reabastecer +30% inmediatamente';prio=p.crecimiento>0.5?'ALTA':'MEDIA';urgencia=p.crecimiento>0.5?'Inmediata':'Esta semana';}
        else if(p.tipo==='Vaca'){accion='Mantener inventario base planificado';prio='BAJA';urgencia='Sin urgencia';}
        else if(p.tipo==='Interrogante'){accion='Evaluar stock y ejecutar marketing';prio='MEDIA';urgencia='Esta semana';}
        else{accion=p.crecimiento<-0.1?'Liquidar / Descontinuar SKU':'Reducir volumen de pedido';prio=p.crecimiento<-0.1?'ALTA':'MEDIA';urgencia=p.crecimiento<-0.1?'Inmediata':'Este mes';}
        return {producto:p.nombre,cuadrante:p.tipo,accion,prio,urgencia,ingresos:p.ingresos};
    }).sort((a,b)=>({'ALTA':0,'MEDIA':1,'BAJA':2}[a.prio])-({'ALTA':0,'MEDIA':1,'BAJA':2}[b.prio]));
}

function proj(ing:number,trend:number,h:Horizonte,factor=1):number{
    const n=h==='30d'?1:h==='6m'?6:12;
    return ing*Math.pow(1+(trend/100)*factor,n);
}

const BCGC:Record<string,string>={Estrella:'#10b981',Vaca:'#3b82f6',Interrogante:'#8b5cf6',Perro:'#9ca3af'};
const BCGBG:Record<string,string>={Estrella:'bg-emerald-50 border-emerald-200',Vaca:'bg-blue-50 border-blue-200',Interrogante:'bg-purple-50 border-purple-200',Perro:'bg-gray-50 border-gray-200'};
const PRIOC:Record<Prio,string>={ALTA:'text-rose-600 bg-rose-50 border-rose-200',MEDIA:'text-amber-600 bg-amber-50 border-amber-200',BAJA:'text-emerald-600 bg-emerald-50 border-emerald-200'};
const PRIOD:Record<Prio,string>={ALTA:'bg-rose-500',MEDIA:'bg-amber-400',BAJA:'bg-emerald-500'};

export default function AnaliticaAvanzada() {
    const { role } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(false);
    const [mlData, setMlData] = useState<DemandPredictionResponse|null>(null);
    const [bcgRaw, setBcgRaw] = useState<any>(null);
    const [horizonte, setHorizonte] = useState<Horizonte>('30d');
    const [expandedQ, setExpandedQ] = useState<string|null>('Estrella');
    const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});
    const [showCriticalStock, setShowCriticalStock] = useState(false);
    const [dateRange, setDateRange] = useState<{start: string, end: string} | null>(null);
    const [limitProds, setLimitProds] = useState(10);
    const [highlightedProd, setHighlightedProd] = useState<string|null>(null);

    useEffect(()=>{
        let ok=true;
        const load=async()=>{
            setLoading(true); setErr(false);
            try{
                const end=new Date(); const start=new Date(); start.setDate(end.getDate()-90);
                const sd=start.toISOString().split('T')[0]; const ed=end.toISOString().split('T')[0];
                if (ok) setDateRange({start: sd, end: ed});
                const [ml,bcg,inv]=await Promise.all([
                    getDemandPrediction(7),
                    getAnalyticsBcg(sd,ed),
                    getInventario('CENTRAL', 'default', 1, 2000).catch(() => ({ items: [] }))
                ]);
                if(ok){
                    setMlData(ml);
                    setBcgRaw(bcg);
                    const map: Record<string, number> = {};
                    (inv?.items || []).forEach((item: any) => {
                        if (item.producto_nombre) {
                            map[item.producto_nombre.toLowerCase().trim()] = item.cantidad;
                        }
                    });
                    setInventoryMap(map);
                }
            }catch(e){
                console.error(e);
                if(ok){
                    setErr(true);
                    toast.error("Error de conexión al cargar la Matriz BCG. El servidor podría estar inactivo.");
                }
            }
            finally{if(ok)setLoading(false);}
        };
        load();
        return()=>{ok=false;};
    },[]);


    const esAdmin=['SUPERADMIN','ADMIN_MATRIZ','ADMIN'].includes(role||'');
    const trend=mlData?.trend_percentage??0;
    const bcgFlat=useMemo(()=>buildFlat(bcgRaw, trend),[bcgRaw, trend]);
    const sugs=useMemo(()=>buildSugs(bcgFlat),[bcgFlat]);
    const hayEvento=!!(mlData?.insight&&(mlData.insight.includes('Feriado')||mlData.insight.includes('feriado')||mlData.insight.includes('Atención')||mlData.insight.includes('salto')||mlData.insight.includes('Anormal')||mlData.insight.includes('Pico')));
    const alertasStock=bcgFlat.filter(p=>p.tipo==='Perro'&&p.crecimiento<-0.05).length;
    const topProds=useMemo(()=>bcgFlat.slice(0,limitProds),[bcgFlat, limitProds]);

    const handleDotClick = (d: any) => {
        if (!d || !d.nombre) return;
        setExpandedQ(d.tipo);
        setHighlightedProd(d.nombre);
        setTimeout(() => {
            document.getElementById('bcg-quadrants')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                const elId = `prod-${d.nombre.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const el = document.getElementById(elId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }, 100);
    };

    const qProds=(t:string)=>bcgFlat.filter(p=>p.tipo===t);

    if(!esAdmin) return(
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <AlertTriangle className="text-amber-500 mb-4" size={48}/>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-500">Se requieren permisos de alta gerencia.</p>
        </div>
    );

    return(
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20">

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-30 animate-pulse"/>
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl relative"><BrainCircuit size={26}/></div>
                    </div>
                    Analítica Avanzada &amp; Machine Learning
                </h1>
                <p className="text-gray-500 mt-2 text-sm font-medium flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-500"/>
                    Motor predictivo basado en Gradient Boosting Quantile Regression sobre datos históricos reales.
                </p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <span className="text-xs font-bold text-indigo-700">{bcgFlat.length} productos analizados</span>
            </div>
        </div>

        {loading?(
            <div className="flex flex-col justify-center items-center py-32 space-y-4">
                <div className="relative"><div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"/><Cpu size={56} className="text-indigo-500 animate-bounce relative z-10"/></div>
                <p className="text-indigo-600 font-bold tracking-widest text-sm uppercase">Entrenando modelo sobre datos históricos...</p>
                <div className="w-64 h-1.5 bg-indigo-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 animate-pulse w-2/3 rounded-full"/></div>
            </div>
        ):err||!mlData?(
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
                <AlertTriangle size={32} className="mx-auto mb-2"/>
                <h3 className="font-bold">Error conectando con ML Pipeline</h3>
                <p className="text-sm">Revisa que el backend esté activo en puerto 8001.</p>
            </div>
        ):(
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ══════════════════════════════════════════════
                SECCIÓN 1: KPIs DEL MODELO
                Métricas clave del motor de Machine Learning
                ══════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full"/>
                    <h2 className="text-lg font-black text-gray-800">Indicadores del Motor ML</h2>
                    <span className="text-xs text-gray-400 font-medium ml-1">— Estado del modelo y alertas activas</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-5 shadow-xl border border-indigo-900 text-white relative overflow-hidden group xl:col-span-1">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500"><TrendingUp size={80}/></div>
                        <div className="flex items-center gap-2 mb-3 text-indigo-400"><Activity size={15}/><span className="font-bold uppercase tracking-wider text-xs">Precisión ML</span></div>
                        <h2 className="text-4xl font-black mb-1">{mlData.model_accuracy}%</h2>
                        <p className="text-xs text-indigo-200/60">Gradient Boosting Quantile</p>
                    </div>
                    <div className="bg-white border rounded-3xl p-5 shadow-sm border-indigo-50 flex flex-col justify-center xl:col-span-1">
                        <div className="flex items-center gap-2 mb-3 text-indigo-600"><BrainCircuit size={15}/><span className="font-bold uppercase tracking-wider text-xs">Insight Generado</span></div>
                        <p className="text-xs font-semibold text-gray-800 leading-relaxed mb-2">"{mlData.insight}"</p>
                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1"><Sparkles size={11} className="text-amber-500"/>Modelo Autónomo</p>
                    </div>
                    <div className="bg-white border rounded-3xl p-5 shadow-sm border-indigo-50 flex justify-between items-center xl:col-span-1">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Demanda 7 días</p>
                            <h3 className="text-3xl font-black text-indigo-900">{trend>0?'+':''}{trend}%</h3>
                            <p className={`text-xs font-semibold flex items-center gap-1 ${trend>=0?'text-emerald-500':'text-rose-500'}`}>
                                <ArrowUpRight size={13} className={trend<0?'rotate-90':''}/>{trend>=0?'Tendencia Alcista':'Tendencia Bajista'}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><BarChart3 size={26}/></div>
                    </div>
                    <div 
                        onClick={() => { if (alertasStock > 0) setShowCriticalStock(!showCriticalStock); }}
                        className={`rounded-3xl p-5 shadow-sm border flex justify-between items-center xl:col-span-1 ${alertasStock > 0 ? 'cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]' : 'opacity-80'} ${
                            showCriticalStock ? 'ring-2 ring-indigo-500 shadow-md' : ''
                        } ${alertasStock>0?'bg-rose-50 border-rose-200 hover:bg-rose-100/50':'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50'}`}
                    >
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Crítico</p>
                            <h3 className={`text-3xl font-black ${alertasStock>0?'text-rose-600':'text-emerald-600'}`}>{alertasStock}</h3>
                            <p className={`text-xs font-semibold ${alertasStock>0?'text-rose-500':'text-emerald-500'} flex items-center gap-1`}>
                                {alertasStock>0?`SKUs en riesgo alto`:'Inventario controlado'}
                                {showCriticalStock ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${alertasStock>0?'bg-rose-200 text-rose-600 animate-pulse':'bg-emerald-200 text-emerald-600'}`}><Package size={26}/></div>
                    </div>
                    <div className={`rounded-3xl p-5 shadow-sm border flex justify-between items-center xl:col-span-1 ${hayEvento?'bg-amber-50 border-amber-200':'bg-slate-50 border-slate-200'}`}>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evento</p>
                            <h3 className={`text-xl font-black ${hayEvento?'text-amber-600':'text-slate-500'}`}>{hayEvento?'¡Activo!':'Normal'}</h3>
                            <p className={`text-xs font-semibold ${hayEvento?'text-amber-500':'text-slate-400'}`}>{hayEvento?'Ver insight arriba':'Sin alertas próximas'}</p>
                        </div>
                        <div className={`p-3 rounded-full ${hayEvento?'bg-amber-200 text-amber-600 animate-bounce':'bg-slate-200 text-slate-400'}`}><Zap size={26}/></div>
                    </div>
                </div>

                {/* Detalle de Stock Crítico desplegable */}
                {showCriticalStock && (
                    <div className="bg-white rounded-[2rem] p-6 shadow-md border-2 border-indigo-250 mt-4 animate-in slide-in-from-top-4 duration-300 space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-indigo-600"/>
                                    Detalle de SKUs en Declive (Monitoreo de Inventario)
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Lista de productos clasificados en la Matriz BCG como <strong>Perro</strong> (baja participación y bajo crecimiento).
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowCriticalStock(false)}
                                className="text-xs font-black text-gray-400 hover:text-gray-600 px-3.5 py-1.5 bg-gray-100 rounded-xl transition-all"
                            >
                                Ocultar
                            </button>
                        </div>
                        
                        {(() => {
                            const list = bcgFlat.filter(p => p.tipo === 'Perro' && p.crecimiento < -0.05);
                            
                            if (list.length === 0) {
                                return (
                                    <p className="text-sm font-semibold text-gray-500 text-center py-6">
                                        No hay productos en estado crítico o declive agudo.
                                    </p>
                                );
                            }
                            
                            return (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-medium border-collapse">
                                        <thead>
                                            <tr className="border-b text-gray-400 uppercase tracking-wider text-[10px]">
                                                <th className="py-2.5">Producto</th>
                                                <th className="py-2.5 text-center">Crecimiento</th>
                                                <th className="py-2.5 text-right">Ingresos Históricos (90d)</th>
                                                <th className="py-2.5 text-right">Stock Físico (Central)</th>
                                                <th className="py-2.5 text-center">Estado Alerta</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {list.slice(0, 15).map((p, idx) => {
                                                const stock = inventoryMap[p.nombre.toLowerCase().trim()] ?? 0;
                                                const esDeclinante = p.crecimiento < -0.05;
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="py-3 font-bold text-gray-800">{p.nombre}</td>
                                                        <td className={`py-3 text-center font-black ${p.crecimiento < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                            {fPct(p.crecimiento * 100)}
                                                        </td>
                                                        <td className="py-3 text-right text-gray-900 font-bold">{fBs(p.ingresos)}</td>
                                                        <td className="py-3 text-right">
                                                            <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${stock === 0 ? 'bg-amber-100 text-amber-800' : stock < 10 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                                                                {stock} uds
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center font-bold">
                                                            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                                                esDeclinante 
                                                                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                            }`}>
                                                                {esDeclinante ? '🚨 CRÍTICO' : '📉 DECLIVE'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {list.length > 15 && (
                                        <p className="text-[10px] text-gray-400 text-center mt-3 font-bold">
                                            Mostrando los primeros 15 de {list.length} productos en declive.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </section>

            {/* ══════════════════════════════════════════════
                SECCIÓN 2: TOP PRODUCTOS CON PREDICCIÓN
                Muestra los productos reales del historial con
                su clasificación BCG y proyección individual
                ══════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-purple-500 rounded-full"/>
                    <h2 className="text-lg font-black text-gray-800">Productos Reales — Predicción Individual</h2>
                    <span className="text-xs text-gray-400 font-medium ml-1">
                        — Evaluación del {dateRange ? new Date(dateRange.start+'T00:00:00').toLocaleDateString('es-BO') : ''} al {dateRange ? new Date(dateRange.end+'T00:00:00').toLocaleDateString('es-BO') : ''} (90 días)
                    </span>
                </div>
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Cada producto muestra sus ingresos históricos reales, la clasificación BCG calculada automáticamente y la proyección de demanda para los próximos 30 días, explicando el razonamiento del modelo.
                            </p>
                        </div>
                        <span className="shrink-0 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full">{topProds.length} de {bcgFlat.length} productos</span>
                    </div>
                    {topProds.length===0?(
                        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
                            <Package size={36} className="opacity-40"/>
                            <p className="text-sm font-medium">Cargando productos históricos...</p>
                            <p className="text-xs">Asegúrate de que el backend está activo y hay datos en ventas_historicas_crudas.</p>
                        </div>
                    ):(
                    <div className="divide-y divide-gray-50">
                        {topProds.map((p,i)=>{
                            const py30=proj(p.ingresos,trend,'30d',FACTOR[p.tipo]);
                            const delta=py30-p.ingresos;
                            const pct=p.ingresos>0?(delta/p.ingresos*100).toFixed(1):'0';
                            const up=delta>=0;
                            const bgColor=BCGBG[p.tipo];
                            return(
                            <div key={i} className="p-5 hover:bg-gray-50/50 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Ranking + Nombre */}
                                    <div className="flex items-center gap-3 lg:w-64 shrink-0">
                                        <span className="text-2xl font-black text-gray-200 w-8 text-right shrink-0">#{i+1}</span>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm leading-tight">{p.nombre}</p>
                                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs font-bold border ${bgColor}`} style={{color:BCGC[p.tipo]}}>
                                                {p.tipo==='Estrella'?'⭐':p.tipo==='Vaca'?'🐄':p.tipo==='Interrogante'?'❓':'📉'} {p.tipo}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Métricas */}
                                    <div className="flex flex-wrap gap-4 flex-1">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Ingresos Reales</p>
                                            <p className="font-black text-gray-900 text-sm">{fBs(p.ingresos)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Proyección 30d</p>
                                            <p className={`font-black text-sm ${up?'text-emerald-600':'text-rose-600'}`}>{fBs(py30)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Variación</p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${up?'bg-emerald-50 text-emerald-600':'bg-rose-50 text-rose-600'}`}>
                                                {up?'+':''}{pct}%
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Cuota Relativa</p>
                                            <p className="font-bold text-gray-700 text-sm">{(p.cuota_mercado*100).toFixed(1)}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Crecimiento</p>
                                            <p className={`font-bold text-sm ${p.crecimiento>=0?'text-emerald-600':'text-rose-600'}`}>{fPct(p.crecimiento*100)}</p>
                                        </div>
                                    </div>
                                    {/* Explicación */}
                                    <div className={`flex-1 lg:max-w-sm p-3 rounded-xl border text-xs font-medium leading-relaxed ${bgColor}`} style={{color: BCGC[p.tipo]+'dd'}}>
                                        <div className="flex items-start gap-1.5">
                                            <Info size={12} className="shrink-0 mt-0.5 opacity-70"/>
                                            <span>{getExplicacion(p, `${up?'+':''}${pct}`)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                    )}
                    {bcgFlat.length>limitProds&&(
                        <div className="p-4 text-center border-t border-gray-100 bg-gray-50/30">
                            <button 
                                onClick={() => setLimitProds(prev => prev + 10)}
                                className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-indigo-600 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Mostrar más ({bcgFlat.length - limitProds} restantes)
                            </button>
                        </div>
                    )}
                    {bcgFlat.length <= limitProds && bcgFlat.length > 0 && (
                        <div className="p-4 text-center border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-medium">Todos los productos han sido mostrados.</p>
                        </div>
                    )}
                </div>
            </section>

            

            {/* ══════════════════════════════════════════════
                SECCIÓN 4: MATRIZ BCG
                Clasificación estratégica de productos usando
                crecimiento vs cuota de mercado relativa.
                Umbrales: mediana de cada eje (distribución natural)
                ══════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-violet-500 rounded-full"/>
                    <h2 className="text-lg font-black text-gray-800">Matriz BCG Predictiva a 30 Días</h2>
                    <span className="text-xs text-gray-400 font-medium ml-1">
                        — Simulación generada a partir del modelo algorítmico
                    </span>
                </div>
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 font-medium mb-4">
                            Cada burbuja representa un producto. <strong>El sistema proyecta su posición futura en los próximos 30 días</strong> basándose en su inercia histórica y multiplicándolo por la tendencia general calculada por el modelo ({fPct(trend)}). El eje X muestra la <strong>cuota de mercado futura</strong> y el eje Y muestra la <strong>tasa de crecimiento predictiva</strong>. Esto te permite anticipar qué productos podrían caer al cuadrante "Perro" antes de que suceda.
                        </p>
                        {trend < 0 && (
                            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 shadow-sm">
                                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-amber-900 mb-1">
                                        ¿Por qué no hay Estrellas ni Interrogantes en esta predicción?
                                    </p>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        El modelo detecta una tendencia global severamente negativa (<strong>{fPct(trend)}</strong>). Al proyectar esto a futuro usando la fórmula <code>Ingreso × (1 + Tendencia × Factor BCG)</code>, el cálculo advierte que <strong>todos los productos sufrirán un decrecimiento</strong> en los próximos 30 días. Matemáticamente, un producto debe tener "Alto Crecimiento" (&gt;0%) para ser Estrella o Interrogante. Bajo este escenario pesimista, todo tu catálogo se desplazará forzosamente hacia <strong>Vacas Lecheras</strong> (los que sobrevivan reteniendo cuota) o <strong>Perros</strong> (los que caigan).
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-8">
                        {/* Scatter */}
                        <div className="h-[550px] w-full bg-slate-950 rounded-[2rem] p-6 shadow-2xl border border-slate-800 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-slate-900/20 to-purple-900/30 pointer-events-none"/>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"/>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>
                            
                            {bcgFlat.length===0?(
                                <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-3 relative z-10">
                                    <AlertCircle size={40} className="text-slate-600"/>
                                    <p className="text-sm font-medium">Sin datos BCG. Verifica que el backend esté activo.</p>
                                </div>
                            ):(
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} className="relative z-10">
                                <ScatterChart margin={{top:20,right:30,bottom:40,left:20}}>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#334155" opacity={0.6} horizontal={true} vertical={true}/>
                                    <XAxis type="number" dataKey="cuota_mercado" name="Cuota" domain={[0,1.05]} tick={{fontSize:11,fill:'#94a3b8'}} label={{value:'← Cuota de Mercado Relativa →',position:'insideBottom',offset:-25,style:{fontSize:'12px',fontWeight:'bold',fill:'#cbd5e1'}}} stroke="#475569"/>
                                    <YAxis type="number" dataKey="crecimiento" name="Crecimiento" tick={{fontSize:11,fill:'#94a3b8'}} label={{value:'Tasa de Crecimiento',angle:-90,position:'insideLeft',offset:-10,style:{fontSize:'12px',fontWeight:'bold',fill:'#cbd5e1'}}} stroke="#475569"/>
                                    <ZAxis type="number" dataKey="ingresos" range={[60,900]} name="Ingresos"/>
                                    <Tooltip cursor={{strokeDasharray:'3 3', stroke:'#64748b'}} content={({payload})=>{
                                        if(!payload?.length) return null;
                                        const d=payload[0].payload;
                                        return(<div className="bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-700 max-w-[240px] backdrop-blur-md">
                                            <p className="font-black text-white text-sm mb-3 leading-tight">{d.nombre}</p>
                                            <div className="space-y-1.5 text-xs">
                                                <p className="text-slate-400">Cuadrante Futuro: <span className="font-black tracking-wider uppercase" style={{color:BCGC[d.tipo]}}>{d.tipo}</span></p>
                                                <p className="text-slate-400">Crec. Proyectado: <span className="font-bold text-white">{(d.crecimiento*100).toFixed(1)}%</span></p>
                                                <p className="text-slate-400">Cuota Proyectada: <span className="font-bold text-white">{(d.cuota_mercado*100).toFixed(1)}%</span></p>
                                                <div className="h-px w-full bg-slate-800 my-2"/>
                                                <p className="text-slate-400">Ingreso Esperado: <span className="font-black text-emerald-400 text-sm">{fBs(d.ingresos)}</span></p>
                                            </div>
                                        </div>);
                                    }}/>
                                    <ReferenceLine y={0} stroke="#64748b" strokeWidth={2}/>
                                    <ReferenceLine x={0.5} stroke="#64748b" strokeDasharray="5 5" label={{value:'Mediana cuota',fontSize:10,fill:'#94a3b8'}}/>
                                    {(['Estrella','Vaca','Interrogante','Perro'] as const).map(t=>(
                                        <Scatter key={t} name={t} data={bcgFlat.filter(d=>d.tipo===t)} fill={BCGC[t]} shape="circle" opacity={0.85} onClick={handleDotClick} style={{cursor: 'pointer'}}/>
                                    ))}
                                </ScatterChart>
                            </ResponsiveContainer>
                            )}
                        </div>
                        
                        {/* Cuadrantes con productos */}
                        <div id="bcg-quadrants" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[
                                {t:'Estrella',Icon:Star,label:'⭐ Estrellas',desc:'Alta cuota + alto crecimiento. ROI máximo.'},
                                {t:'Vaca',Icon:Coins,label:'🐄 Vacas Lecheras',desc:'Alta cuota + bajo crecimiento. Caja estable.'},
                                {t:'Interrogante',Icon:HelpCircle,label:'❓ Interrogantes',desc:'Baja cuota + alto crecimiento. A evaluar.'},
                                {t:'Perro',Icon:ArrowDownCircle,label:'📉 Perros',desc:'Baja cuota + bajo crecimiento. Descontinuar.'},
                            ].map(({t,Icon,label,desc})=>{
                                const prods=qProds(t);
                                const isOpen=expandedQ===t;
                                
                                let displayProds = prods.slice(0, 30);
                                const hasSelected = highlightedProd && prods.some(x => x.nombre === highlightedProd);
                                const selectedInView = hasSelected && displayProds.some(x => x.nombre === highlightedProd);
                                if (hasSelected && !selectedInView) {
                                    const selected = prods.find(x => x.nombre === highlightedProd);
                                    if (selected) displayProds = [selected, ...displayProds.slice(0, 29)];
                                }

                                return(
                                <div key={t} className={`flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${isOpen ? 'ring-2' : ''} ${BCGBG[t]}`} style={{ '--tw-ring-color': BCGC[t] } as any}>
                                    <button className="w-full p-5 flex flex-col items-start text-left gap-3 relative overflow-hidden" onClick={()=>setExpandedQ(isOpen?null:t)}>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform duration-500 group-hover:scale-110">
                                            <Icon size={80} style={{color:BCGC[t]}}/>
                                        </div>
                                        <div className="flex items-center justify-between w-full relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm" style={{color:BCGC[t]}}>
                                                    <Icon size={20}/>
                                                </div>
                                                <p className="font-black text-gray-900 text-base">{label}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black px-3 py-1.5 rounded-full text-white shadow-sm" style={{backgroundColor:BCGC[t]}}>{prods.length}</span>
                                                <div className="p-1 rounded-full bg-white/50">{isOpen?<ChevronUp size={16} className="text-gray-600"/>:<ChevronDown size={16} className="text-gray-600"/>}</div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium relative z-10">{desc}</p>
                                    </button>
                                    {isOpen&&prods.length>0&&(
                                        <div className="flex-1 border-t border-black/5 max-h-80 overflow-y-auto bg-white/40 backdrop-blur-sm custom-scrollbar">
                                            {displayProds.map((p,i)=>{
                                                const isHighlighted = highlightedProd === p.nombre;
                                                return (
                                                    <div key={i} id={`prod-${p.nombre.replace(/[^a-zA-Z0-9]/g, '-')}`} className={`flex flex-col px-5 py-3 transition-colors border-b border-black/5 last:border-0 ${isHighlighted ? 'bg-indigo-100 ring-2 ring-indigo-400 z-10 relative shadow-sm' : 'hover:bg-white/60'}`}>
                                                        <span className="text-xs font-bold text-gray-800 leading-tight mb-1">{p.nombre}</span>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-semibold text-gray-500">Ingresos</span>
                                                            <span className="text-xs font-black" style={{color:BCGC[t]}}>{fBs(p.ingresos)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {prods.length>30&&<div className="px-5 py-4 bg-white/50 text-center"><span className="text-xs font-bold text-indigo-600 cursor-pointer hover:underline" onClick={() => setExpandedQ(null)}>Cerrar lista</span></div>}
                                        </div>
                                    )}
                                    {isOpen&&prods.length===0&&(
                                        <div className="p-6 text-center text-sm font-medium text-gray-400 bg-white/40">Sin productos.</div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECCIÓN 5: SUGERENCIAS DE PEDIDOS IA
                Priorización automática de reabastecimiento
                ══════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"/>
                    <h2 className="text-lg font-black text-gray-800">Sugerencias de Pedidos — IA</h2>
                    <span className="text-xs text-gray-400 font-medium ml-1">— Acciones recomendadas por prioridad de urgencia</span>
                </div>
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Info size={15} className="text-amber-600 shrink-0 mt-0.5"/>
                        <p className="text-xs font-medium text-amber-800">
                            La prioridad se calcula combinando el cuadrante BCG de cada producto y su tasa de crecimiento histórica.
                            <strong> ALTA</strong>: Estrellas en auge o Perros en declive.
                            <strong> MEDIA</strong>: Interrogantes o Perros estancados.
                            <strong> BAJA</strong>: Vacas maduras sin urgencia.
                        </p>
                    </div>
                    {sugs.length===0?(
                        <div className="text-center py-12 text-gray-400"><ShoppingCart size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">Cargando sugerencias...</p></div>
                    ):(
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-24">Prioridad</th>
                                    <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Producto</th>
                                    <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-28">Cuadrante</th>
                                    <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Acción Recomendada</th>
                                    <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-28">Urgencia</th>
                                    <th className="text-right p-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-32">Ingresos Act.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sugs.slice(0,20).map((s,i)=>(
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${PRIOC[s.prio]}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${PRIOD[s.prio]}`}/>{s.prio}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800 max-w-[200px] truncate">{s.producto}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold" style={{backgroundColor:`${BCGC[s.cuadrante]}20`,color:BCGC[s.cuadrante]}}>
                                                {s.cuadrante==='Estrella'?'⭐':s.cuadrante==='Vaca'?'🐄':s.cuadrante==='Interrogante'?'❓':'📉'} {s.cuadrante}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700 font-medium">{s.accion}</td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${s.urgencia==='Inmediata'?'text-rose-600':s.urgencia==='Esta semana'?'text-amber-600':'text-gray-400'}`}>
                                                {s.urgencia==='Inmediata'?'🔴':s.urgencia==='Esta semana'?'🟡':'🟢'} {s.urgencia}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-900">{fBs(s.ingresos)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECCIÓN 6: PROYECCIONES POR HORIZONTE
                Simula el impacto de la tendencia ML por 30d,
                6 meses o 1 año con factor multiplicador
                según el cuadrante BCG de cada producto
                ══════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-teal-500 rounded-full"/>
                    <h2 className="text-lg font-black text-gray-800">Proyecciones por Horizonte Temporal</h2>
                    <span className="text-xs text-gray-400 font-medium ml-1">— Aplicación compuesta de la tendencia ML por cuadrante BCG</span>
                </div>
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">
                                Proyección de ingresos aplicando la tasa de tendencia detectada por el modelo ML
                                (<strong>{fPct(trend)}</strong> en 7 días) de forma compuesta. Las Estrellas reciben un multiplicador de ×1.4 y los Perros ×0.5 para reflejar su trayectoria esperada.
                            </p>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1 shrink-0">
                            {(['30d','6m','1a'] as Horizonte[]).map(h=>(
                                <button key={h} onClick={()=>setHorizonte(h)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${horizonte===h?'bg-white text-teal-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                                    {h==='30d'?'30 Días':h==='6m'?'6 Meses':'1 Año'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {bcgFlat.length>0&&(
                    <>
                    <div className="h-[260px] w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                            <BarChart data={bcgFlat.slice(0,10).map(p=>({
                                name:p.nombre.length>13?p.nombre.slice(0,13)+'…':p.nombre,
                                actual:Math.round(p.ingresos),
                                proyectado:Math.round(proj(p.ingresos,trend,horizonte,FACTOR[p.tipo])),
                                tipo:p.tipo
                            }))} margin={{top:5,right:10,left:0,bottom:5}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                                <XAxis dataKey="name" tick={{fontSize:9,fill:'#6b7280'}} axisLine={false} tickLine={false}/>
                                <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                <Tooltip formatter={(v:any,n?:string|number)=>{const ns=String(n??'');return[fBs(v),ns==='actual'?'Actual (30d hist.)':ns==='proyectado'?`Proyectado (${horizonte})`:'—'] as [string,string];}} contentStyle={{borderRadius:'12px',border:'1px solid #f3f4f6'}}/>
                                <Bar dataKey="actual" fill="#e0e7ff" radius={[4,4,0,0]} name="actual"/>
                                <Bar dataKey="proyectado" radius={[4,4,0,0]} name="proyectado">
                                    {bcgFlat.slice(0,10).map((p,i)=>(<Cell key={i} fill={BCGC[p.tipo]}/>))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left p-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Producto</th>
                                <th className="text-left p-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Cuadrante</th>
                                <th className="text-right p-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Ingresos Reales</th>
                                <th className="text-right p-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Proyectado ({horizonte==='30d'?'60d':horizonte==='6m'?'12m':'2a'})</th>
                                <th className="text-right p-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Δ Variación</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {bcgFlat.slice(0,15).map((p,i)=>{
                                    const py=proj(p.ingresos,trend,horizonte,FACTOR[p.tipo]);
                                    const diff=py-p.ingresos;
                                    const pct=p.ingresos>0?(diff/p.ingresos*100).toFixed(1):'0';
                                    const up=diff>=0;
                                    return(<tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3 font-semibold text-gray-800 max-w-[180px] truncate">{p.nombre}</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{backgroundColor:`${BCGC[p.tipo]}20`,color:BCGC[p.tipo]}}>{p.tipo}</span></td>
                                        <td className="p-3 text-right text-gray-600 font-medium">{fBs(p.ingresos)}</td>
                                        <td className="p-3 text-right font-bold text-gray-900">{fBs(py)}</td>
                                        <td className="p-3 text-right"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${up?'bg-emerald-50 text-emerald-600':'bg-rose-50 text-rose-600'}`}>{up?'+':''}{pct}%</span></td>
                                    </tr>);
                                })}
                            </tbody>
                        </table>
                    </div>
                    </>
                    )}
                </div>
            </section>
        </div>
        )}
    </div>
    );
}
