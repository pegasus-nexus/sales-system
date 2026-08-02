import { useState, useEffect, useCallback, useMemo } from "react";
import { getSalesPercentiles } from "../api/api";
import { Loader2, AlertTriangle, Store, BarChart2, ChevronLeft, ChevronRight, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx"; 
import { twMerge } from "tailwind-merge";

function cn(...i: any[]) { return twMerge(clsx(i)); }
const fmt = (n: number) => `Bs. ${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

const ZONES = {
  critico: { 
    label: "Crítico", 
    color: "text-rose-700",    
    bg: "bg-rose-50/90",    
    border: "border-rose-200/90",    
    dot: "bg-rose-500",    
    pill: "bg-rose-50 text-rose-700 border border-rose-200/80 font-black",
  },
  bajo: { 
    label: "Bajo",    
    color: "text-amber-700",  
    bg: "bg-amber-50/90",  
    border: "border-amber-200/90",  
    dot: "bg-amber-500",  
    pill: "bg-amber-50 text-amber-700 border border-amber-200/80 font-black",
  },
  normal: { 
    label: "Normal",  
    color: "text-blue-700",
    bg: "bg-blue-50/90",
    border: "border-blue-200/90",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border border-blue-200/80 font-black",
  },
  alto: { 
    label: "Alto",    
    color: "text-emerald-700", 
    bg: "bg-emerald-50/90", 
    border: "border-emerald-200/90", 
    dot: "bg-emerald-500", 
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black",
  },
} as const;

const SUCS = [
  {value:"",label:"Tiendas Minoristas (Consolidado)"},
  {value:"Heroinas",label:"Heroínas"},
  {value:"Recoleta",label:"Recoleta"},
  {value:"Calacoto",label:"Calacoto"},
];

const DAYS = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
const MES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getMonday(d:Date){ const c=new Date(d),day=c.getDay(); c.setDate(c.getDate()-(day===0?6:day-1)); c.setHours(0,0,0,0); return c; }
function iso(d:Date){ return d.toISOString().slice(0,10); }

// ───────────────────────────────────────────────────────────────────────────────
// FUNCIONES PURAS DE CÁLCULO ESTADÍSTICO (MEMOIZADAS Y REUTILIZABLES)
// ───────────────────────────────────────────────────────────────────────────────
export interface PercentileResult {
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
  media: number;
}

export function calculatePercentiles(values: number[]): PercentileResult {
  if (!values || values.length === 0) {
    return { p25: 0, p50: 0, p75: 0, min: 0, max: 0, media: 0 };
  }
  const sorted = [...values].filter(v => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { p25: 0, p50: 0, p75: 0, min: 0, max: 0, media: 0 };
  }
  const len = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  const getPercentile = (p: number) => {
    const idx = (len - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (upper >= len) return sorted[len - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    p25: Math.round(getPercentile(0.25)),
    p50: Math.round(getPercentile(0.50)),
    p75: Math.round(getPercentile(0.75)),
    min: Math.round(sorted[0]),
    max: Math.round(sorted[len - 1]),
    media: Math.round(sum / len)
  };
}

export function calculateDailyStatus(sales: number, p25: number, p50: number, p75: number) {
  if (sales < p25) return ZONES.critico;
  if (sales < p50) return ZONES.bajo;
  if (sales < p75) return ZONES.normal;
  return ZONES.alto;
}

function Tooltip({ entry, p25, p50, p75 }: { entry: any, p25: number, p50: number, p75: number }) {
  if (!entry) return null;
  const isFut = entry.is_future;
  const totalVal = entry.total || 0;
  const pctVsP50 = p50 > 0 ? Math.round(((totalVal - p50) / p50) * 100) : 0;

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none hidden group-hover:flex flex-col">
      <div className="bg-slate-900/95 text-white text-[10px] rounded-2xl px-3.5 py-2.5 shadow-2xl min-w-[170px] border border-slate-700">
        <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-1.5">{entry.fecha}</p>
        <div className="flex justify-between gap-4 mb-1">
          <span className="text-slate-300 font-semibold">{isFut ? "Referencia histórica" : "Venta real"}</span>
          <span className="font-black text-white">{fmt(totalVal)}</span>
        </div>
        <div className="h-px bg-slate-700/80 my-1.5"/>
        <div className="flex justify-between gap-4 mb-0.5">
          <span className="text-rose-400 flex items-center gap-1 font-bold"><TrendingDown size={10}/>Min (P25)</span>
          <span className="font-black text-rose-300">{fmt(p25)}</span>
        </div>
        <div className="flex justify-between gap-4 mb-0.5">
          <span className="text-amber-400 flex items-center gap-1 font-bold"><Minus size={10}/>Med (P50)</span>
          <span className="font-black text-amber-300">{fmt(p50)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400 flex items-center gap-1 font-bold"><TrendingUp size={10}/>Max (P75)</span>
          <span className="font-black text-emerald-300">{fmt(p75)}</span>
        </div>
        {!isFut && p50 > 0 && (
          <div className={cn("mt-2 pt-1 border-t border-slate-800 font-black text-[9px]", pctVsP50 >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {pctVsP50 >= 0 ? "+" : ""}{pctVsP50}% vs mediana (P50)
          </div>
        )}
      </div>
      <div className="w-2.5 h-2.5 bg-slate-900/95 rotate-45 -mt-1.5 self-center border-b border-r border-slate-700"/>
    </div>
  );
}

export default function SalesPercentileTracker(){
  const [sucursal,setSucursal]=useState("");
  const [data,setData]=useState<any>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [isError,setIsError]=useState(false);
  const [view,setView]=useState<"month"|"week">("month");
  const now=new Date();
  const [navYear,setNavYear]=useState(now.getFullYear());
  const [navMonth,setNavMonth]=useState(now.getMonth());
  const [weekOffset,setWeekOffset]=useState(0);
  const weekStart=(()=>{ const d=getMonday(new Date()); d.setDate(d.getDate()+weekOffset*7); return d; })();

  const fetchData=useCallback(async(suc:string)=>{
    setIsLoading(true);
    setIsError(false);
    try { 
      const res = await getSalesPercentiles(suc||undefined,365,"day"); 
      setData(res);
    } catch(err) { 
      setIsError(true); 
    } finally { 
      setIsLoading(false); 
    }
  },[]);

  useEffect(()=>{ fetchData(sucursal); },[sucursal,fetchData]);

  // Mapa rápido de períodos por fecha
  const byDate: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    if (data?.periods) {
      for (const p of data.periods) {
        map[p.fecha] = p;
      }
    }
    return map;
  }, [data]);

  // Histórico de ventas (solo períodos con ventas reales pre-futuras)
  const histPeriods = useMemo(() => {
    return data?.periods ? data.periods.filter((x: any) => !x.is_future && x.total > 0) : [];
  }, [data]);

  // Agrupación por día de la semana (0=Dom, 1=Lun, ..., 6=Sáb) para benchmark por día equivalente
  const salesByDow = useMemo(() => {
    const map: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const p of histPeriods) {
      const parts = p.fecha.split("-");
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dow = dObj.getDay();
        map[dow].push(p.total);
      }
    }
    return map;
  }, [histPeriods]);

  // Percentiles globales del filtro activo (calculados dinámicamente según el set de datos filtrado)
  const globalPercentiles = useMemo(() => {
    const allSales = histPeriods.map((p: any) => p.total);
    if (allSales.length === 0 && data?.percentiles) {
      return {
        p25: data.percentiles.p25 ?? 0,
        p50: data.percentiles.p50 ?? 0,
        p75: data.percentiles.p75 ?? 0,
        min: data.percentiles.min ?? 0,
        max: data.percentiles.max ?? 0,
        media: data.percentiles.media ?? 0,
      };
    }
    return calculatePercentiles(allSales);
  }, [histPeriods, data]);

  // Función para obtener el benchmark dinámico específico de un día según su día de la semana y fecha
  const getDailyBenchmark = useCallback((dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return globalPercentiles;
    const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dow = dObj.getDay();
    const dowSales = salesByDow[dow] || [];
    
    // Si tenemos suficientes datos históricos para ese día de la semana (e.g. todos los Viernes del año)
    if (dowSales.length >= 4) {
      return calculatePercentiles(dowSales);
    }
    return globalPercentiles;
  }, [salesByDow, globalPercentiles]);

  const p50 = globalPercentiles.p50;
  const p25 = globalPercentiles.p25;
  const p75 = globalPercentiles.p75;

  const firstOfMonth = new Date(navYear,navMonth,1);
  const daysInMonth  = new Date(navYear,navMonth+1,0).getDate();
  const startDow     = (firstOfMonth.getDay()+6)%7;
  const prevM=()=>{ if(navMonth===0){setNavYear(y=>y-1);setNavMonth(11);}else setNavMonth(m=>m-1); };
  const nextM=()=>{ if(navMonth===11){setNavYear(y=>y+1);setNavMonth(0);}else setNavMonth(m=>m+1); };
  function dayData(day:number){ const k=`${navYear}-${String(navMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; return byDate[k]||null; }
  function wkDay(i:number){ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return {date:d,entry:byDate[iso(d)]??null}; }

  return(
    <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 2. ENCABEZADO REORGANIZADO SIN EL BLOQUE 'RADAR DE VENTAS' (REGLA DIRECTA) */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-1">
            <BarChart2 className="text-indigo-600" size={24}/>
            Benchmark Histórico
          </h3>
          <p className="text-xs font-semibold text-slate-400">
            Evaluación del rendimiento utilizando datos históricos dinámicos y días equivalentes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none"/>
            <select 
              value={sucursal} 
              onChange={e=>setSucursal(e.target.value)} 
              className="pl-8 pr-6 py-2 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl font-bold text-xs text-slate-800 outline-none appearance-none cursor-pointer shadow-2xs"
            >
              {SUCS.map(s=>(
                <option key={s.value} value={s.value} className="bg-white text-slate-800">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 border border-slate-200/50">
            {([{v:"month",l:"Mes"},{v:"week",l:"Semana"}] as const).map(o=>(
              <button key={o.v} onClick={()=>setView(o.v)} className={cn("px-3.5 py-1.5 rounded-lg text-xs font-black transition-all",view===o.v?"bg-white text-indigo-700 shadow-2xs border border-slate-200/60":"text-slate-500 hover:text-slate-800")}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading?(
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-indigo-500">
          <Loader2 size={40} className="animate-spin"/>
          <p className="text-xs font-black uppercase tracking-widest animate-pulse">Calculando benchmark histórico dinámico...</p>
        </div>
      ):isError||!data?(
        <div className="flex items-center justify-center py-10 text-rose-500 text-xs font-bold bg-rose-50 rounded-2xl border border-rose-100 gap-2">
          <AlertTriangle size={18}/> Error cargando datos de percentiles.
        </div>
      ):(
        <div className="space-y-6">
          
          {/* ─────────────────────────────────────────────────────────────────────────── */}
          {/* RECUADROS DE PERCENTILES DINÁMICOS RECALCULADOS SEGÚN EL FILTRO ACTIVO */}
          {/* ─────────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-1 rounded-full uppercase block w-max">
                📈 Percentiles Históricos
              </span>
              {/* PUNTO 8: Pequeña descripción elegante sobre el origen de los datos */}
              <span className="text-[11px] font-bold text-slate-400">
                Base estadística: <strong className="text-slate-700">365 días históricos comparables</strong> segun filtro activo.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card P25 */}
              <div className="bg-rose-50/80 rounded-3xl p-5 border border-rose-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all min-h-[150px]">
                <div className="flex justify-between items-center pb-2 border-b border-rose-200/60">
                  <span className="text-xs font-black text-rose-800 uppercase flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"/> P25
                  </span>
                  <span className="text-[9px] font-black bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded-full uppercase">CRÍTICO</span>
                </div>
                <div className="my-auto py-2">
                  <h4 className="text-2xl font-black text-rose-900 tracking-tight">{fmt(p25)}</h4>
                  <p className="text-[10px] font-bold text-rose-700/80 mt-1">Mínimo recomendado</p>
                </div>
                <div className="pt-2 border-t border-rose-200/60 text-[10px] font-bold text-rose-600/80">
                  Límite inferior dinámico
                </div>
              </div>

              {/* Card P50 */}
              <div className="bg-amber-50/80 rounded-3xl p-5 border border-amber-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all min-h-[150px]">
                <div className="flex justify-between items-center pb-2 border-b border-amber-200/60">
                  <span className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"/> P50
                  </span>
                  <span className="text-[9px] font-black bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full uppercase">NORMAL</span>
                </div>
                <div className="my-auto py-2">
                  <h4 className="text-2xl font-black text-amber-900 tracking-tight">{fmt(p50)}</h4>
                  <p className="text-[10px] font-bold text-amber-700/80 mt-1">Punto medio histórico</p>
                </div>
                <div className="pt-2 border-t border-amber-200/60 text-[10px] font-bold text-amber-600/80">
                  Mediana del negocio
                </div>
              </div>

              {/* Card P75 */}
              <div className="bg-emerald-50/80 rounded-3xl p-5 border border-emerald-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all min-h-[150px]">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                  <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/> P75
                  </span>
                  <span className="text-[9px] font-black bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full uppercase">META</span>
                </div>
                <div className="my-auto py-2">
                  <h4 className="text-2xl font-black text-emerald-900 tracking-tight">{fmt(p75)}</h4>
                  <p className="text-[10px] font-bold text-emerald-700/80 mt-1">Nivel alto esperado</p>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 text-[10px] font-bold text-emerald-600/80">
                  Rendimiento superior
                </div>
              </div>
            </div>
          </div>
          
          {/* ─────────────────────────────────────────────────────────────────────────── */}
          {/* CALENDARIO RE DISEÑADO CON DÍAS EQUIVALENTES Y BENCHMARKS DÍA POR DÍA */}
          {/* ─────────────────────────────────────────────────────────────────────────── */}
          {view==="month"&&(
            <div className="space-y-4 pt-2">
              
              {/* Encabezado del Mes con Navegación Circular */}
              <div className="flex items-center justify-between bg-white p-3 sm:px-6 rounded-2xl border border-slate-100 shadow-2xs">
                <button 
                  onClick={prevM} 
                  className="p-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all shadow-2xs active:scale-95 flex items-center justify-center"
                  title="Mes anterior"
                >
                  <ChevronLeft size={18}/>
                </button>

                <h4 className="text-lg sm:text-xl font-black text-slate-900 flex items-center justify-center gap-2">
                  {MES[navMonth]} {navYear}
                  {(navYear>now.getFullYear()||(navYear===now.getFullYear()&&navMonth>now.getMonth()))&&(
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={11}/> Proyección
                    </span>
                  )}
                </h4>

                <button 
                  onClick={nextM} 
                  className="p-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all shadow-2xs active:scale-95 flex items-center justify-center"
                  title="Mes siguiente"
                >
                  <ChevronRight size={18}/>
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(d=>(
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grilla del Calendario con Benchmark Individual Día a Día (Puntos 5, 6 y 10) */}
              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {Array.from({length:startDow}).map((_,i)=><div key={i} className="min-h-[105px]"/>)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day=i+1; 
                  const entry=dayData(day);
                  const dateStr=`${navYear}-${String(navMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const dateObj=new Date(navYear,navMonth,day);
                  const isToday=iso(dateObj)===iso(now);
                  const isFut=dateObj>now;

                  // Benchmark estadístico individual del día equivalente
                  const dailyBench = getDailyBenchmark(dateStr);
                  const dailyP25 = dailyBench.p25;
                  const dailyP50 = dailyBench.p50;
                  const dailyP75 = dailyBench.p75;

                  // Estado según los percentiles individuales del día
                  const z = entry && !entry.is_future ? calculateDailyStatus(entry.total, dailyP25, dailyP50, dailyP75) : null;
                  const pctVsDailyP50 = dailyP50 > 0 && entry ? Math.round(((entry.total - dailyP50) / dailyP50) * 100) : 0;

                  return(
                    <div 
                      key={day} 
                      className={cn(
                        "relative group min-h-[105px] rounded-2xl border p-3 flex flex-col justify-between cursor-default transition-all duration-300 hover:shadow-md",
                        isToday ? "ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50/50" :
                        entry && !entry.is_future && z ? `${z.bg} ${z.border}` :
                        entry?.is_future ? "border-slate-200/80 bg-slate-50/90 opacity-90" :
                        "border-slate-100 bg-white"
                      )}
                    >
                      {/* Número del Día y Badge de Categoría */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          "text-xs font-black w-6 h-6 flex items-center justify-center rounded-xl shrink-0 transition-colors",
                          isToday ? "bg-indigo-600 text-white shadow-2xs" :
                          entry && !entry.is_future && z ? z.pill :
                          entry?.is_future ? "text-slate-600 bg-slate-200/70" :
                          isFut ? "text-slate-300" : "text-slate-500 bg-slate-100"
                        )}>
                          {day}
                        </span>

                        {entry && !entry.is_future && z && (
                          <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider", z.pill)}>
                            {z.label}
                          </span>
                        )}
                        {entry?.is_future && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Pronóstico
                          </span>
                        )}
                      </div>

                      {/* Monto Real Destacado + Variación vs P50 Diario */}
                      {entry && !entry.is_future && (
                        <div className="my-1.5 space-y-0.5">
                          <p className={cn("text-sm sm:text-base font-black tracking-tight leading-tight", z?.color)}>
                            {fmt(entry.total)}
                          </p>
                          {pctVsDailyP50 !== 0 && (
                            <div className={cn("text-[9px] font-black flex items-center gap-0.5", pctVsDailyP50 >= 0 ? "text-emerald-700" : "text-rose-700")}>
                              {pctVsDailyP50 > 0 ? "▲ +" : "▼ "}{pctVsDailyP50}% vs P50
                            </div>
                          )}
                        </div>
                      )}

                      {/* Indicadores de Percentiles Individuales del Día */}
                      {entry && !entry.is_future && (
                        <div className="flex items-center gap-1 mt-auto pt-1.5 border-t border-slate-200/60 text-[9px] font-bold text-slate-500">
                          {[
                            { l: "P25", ok: entry.total >= dailyP25, dot: "bg-amber-400" },
                            { l: "P50", ok: entry.total >= dailyP50, dot: "bg-blue-500" },
                            { l: "P75", ok: entry.total >= dailyP75, dot: "bg-emerald-500" }
                          ].map(s => (
                            <span key={s.l} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black", s.ok ? "bg-white/80 text-slate-800 border border-slate-200/60 shadow-2xs" : "bg-slate-200/50 text-slate-400")}>
                              <span className={cn("w-1.5 h-1.5 rounded-full inline-block", s.ok ? s.dot : "bg-slate-300")} />
                              {s.l}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Punto 11: Días Futuros (Solo Referencia Estadística y Rango Min-Max, Sin Venta Real) */}
                      {entry?.is_future && (
                        <div className="my-1 space-y-1 text-slate-700">
                          <p className="text-xs font-black text-indigo-700 leading-tight">
                            ~{fmt(dailyP50 > 0 ? dailyP50 : (entry.total || p50))}
                          </p>
                          <div className="text-[9px] font-bold text-slate-500 flex flex-col gap-0.5 pt-1 border-t border-slate-200/60">
                            <span>Min: {fmt(dailyP25 > 0 ? dailyP25 : (entry.total_low ?? p25))}</span>
                            <span>Max: {fmt(dailyP75 > 0 ? dailyP75 : (entry.total_high ?? p75))}</span>
                          </div>
                        </div>
                      )}

                      {/* Día Futuro Sin Datos */}
                      {!entry && isFut && (
                        <div className="flex-1 flex items-center justify-center min-h-[40px]">
                          <span className="text-[10px] text-slate-300 font-bold">—</span>
                        </div>
                      )}

                      {/* Día Pasado Sin Ventas */}
                      {!entry && !isFut && (
                        <div className="flex-1 flex items-center justify-center min-h-[40px]">
                          <span className="text-[10px] text-slate-400 font-bold italic">Sin ventas</span>
                        </div>
                      )}

                      {/* Tooltip con Estadísticas Únicas por Día (Punto 7) */}
                      <Tooltip entry={entry} p25={dailyP25} p50={dailyP50} p75={dailyP75}/>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda de Categorías */}
              <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-bold text-slate-500 justify-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                {(Object.entries(ZONES) as any[]).map(([k,z])=>(
                  <span key={k} className="flex items-center gap-1.5">
                    <span className={cn("w-2.5 h-2.5 rounded-full",z.dot)}/>
                    {z.label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <Sparkles size={11} className="text-indigo-500"/>
                  Referencia estadística / Pronóstico
                </span>
              </div>
            </div>
          )}

          {/* VISTA SEMANAL */}
          {view==="week"&&(
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={()=>setWeekOffset(w=>w-1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"><ChevronLeft size={16}/></button>
                <div className="text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {weekOffset===0?"Semana actual":weekOffset<0?`Hace ${Math.abs(weekOffset)} semana(s)`:`En ${weekOffset} semana(s)`}
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {weekStart.toLocaleDateString("es-ES",{day:"numeric",month:"long"})} – {new Date(weekStart.getTime()+6*86400000).toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}
                  </p>
                </div>
                <button onClick={()=>setWeekOffset(w=>w+1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"><ChevronRight size={16}/></button>
              </div>
              <div className="space-y-3">
                {DAYS.map((_,i)=>{
                  const {date,entry}=wkDay(i);
                  const dateStr = iso(date);
                  const isToday=dateStr===iso(now); 
                  const isFut=date>now;
                  const dailyBench = getDailyBenchmark(dateStr);
                  const z = entry && !entry.is_future ? calculateDailyStatus(entry.total, dailyBench.p25, dailyBench.p50, dailyBench.p75) : null;
                  
                  return(
                    <div key={i} className={cn("relative group bg-white rounded-2xl border border-slate-100 transition-all hover:shadow-md p-3 flex items-center justify-between",
                      isToday ? "ring-2 ring-indigo-400 bg-indigo-50/50 border-indigo-200" : isFut ? "border-dashed border-indigo-200 bg-indigo-50/20" : "")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-10 rounded-full shrink-0", z ? z.dot : isFut ? "bg-indigo-300" : "bg-slate-200")}/>
                        <div>
                          <p className={cn("text-sm font-black",isToday?"text-indigo-700":z?z.color:isFut?"text-indigo-500":"text-slate-400")}>{DAYS[i]}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{date.toLocaleDateString("es-ES",{day:"numeric",month:"short"})}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-black", z?.color || "text-slate-800")}>
                          {entry ? fmt(entry.total) : isFut ? `~${fmt(dailyBench.p50)}` : 'Sin ventas'}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">
                          {entry?.is_future ? 'Pronóstico' : z?.label || (isFut ? 'Esperado' : 'Sin datos')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
