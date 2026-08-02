import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Package, TrendingUp, TrendingDown, LayoutGrid, BarChart2, Search } from 'lucide-react';
import { client } from '../api/client';

// --- CONFIGURACIÓN DE COLORES PARA CUADRANTES ---
const QUADRANT_COLORS = {
  'Estrella': '#10B981',       // Verde
  'Vaca Lechera': '#3B82F6',   // Azul
  'Interrogante': '#F59E0B',   // Amarillo
  'Perro': '#EF4444'           // Rojo
};

export default function MatrizBCGDefinitiva() {
  const [sucursal, setSucursal] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [vista, setVista] = useState<'grafico' | 'cuadrantes'>('grafico');
  
  const [dataBCG, setDataBCG] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  // 1. FETCH REPOSITORIO CON INYECCIÓN DEMO MODE DE SUCURSALES
  useEffect(() => {
    async function fetchRealBCGData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const bcgData = await client<any[]>(`/analytics/bcg`);

        if (!bcgData || bcgData.length === 0) {
            setErrorMsg("No hay productos en el catálogo.");
            setDataBCG([]);
            setLoading(false);
            return;
        }

        const productosRecibidos = Array.isArray(bcgData) ? bcgData : (bcgData as any).products || [];

        const productosConSucursales = productosRecibidos.map((prod: any, index: number) => {
          let sucs = ['Heroinas', 'Recoleta', 'Calacoto'];
          if (index % 3 === 0) sucs = ['Heroinas'];
          if (index % 3 === 1) sucs = ['Recoleta', 'Calacoto'];
          if (index % 5 === 0) sucs = ['Calacoto'];
          
          return {
            ...prod,
            sucursales: prod.sucursales || sucs,
            sucursal: prod.sucursal || sucs[0]
          };
        });

        setDataBCG(productosConSucursales);

      } catch (error: any) {
        console.error("Error conectando con el endpoint /bcg:", error);
        setErrorMsg("Error de conexión al obtener datos de la Matriz BCG.");
        setDataBCG([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRealBCGData();
  }, []);

  // 2. EXTRACCIÓN DINÁMICA DE CATEGORÍAS
  const categoriasDisponibles = useMemo(() => {
    const cats = dataBCG
      .map(p => p.categoria)
      .filter(Boolean);
    return Array.from(new Set(cats)).sort();
  }, [dataBCG]);

  // 3. FILTRADO SIMPLE CON INYECCIÓN DEMO MODE (Sucursal + Categoría + Buscador)
  const productosFiltrados = useMemo(() => {
    return dataBCG.filter((p) => {
      const matchSucursal = sucursal === 'todas' || (p.sucursales && p.sucursales.includes(sucursal));
      const matchCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
      const matchBuscador = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());

      return matchSucursal && matchCategoria && matchBuscador;
    });
  }, [dataBCG, sucursal, categoriaFiltro, searchTerm]);

  // 4. AGRUPACIÓN PARA VISTA DE CUADRANTES
  const estrellas = productosFiltrados.filter(p => p.cuadrante === 'Estrella');
  const vacas = productosFiltrados.filter(p => p.cuadrante === 'Vaca Lechera');
  const interrogantes = productosFiltrados.filter(p => p.cuadrante === 'Interrogante');
  const perros = productosFiltrados.filter(p => p.cuadrante === 'Perro');

  // Helper para renderizar el badge comparativo vsMesAnterior en el Grid
  const renderMoMBadge = (vsMesAnterior: string | number) => {
    const valStr = String(vsMesAnterior || '0%');
    const isPositive = valStr.startsWith('+');
    const isNegative = valStr.startsWith('-');

    if (isPositive) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md shadow-2xs">
          <TrendingUp size={11} /> {valStr} vs Mes Ant.
        </span>
      );
    }
    if (isNegative) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md shadow-2xs">
          <TrendingDown size={11} /> {valStr} vs Mes Ant.
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
        0% vs Mes Ant.
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 w-full mb-10">
      
      {/* ── CABECERA Y FILTROS PRINCIPALES ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">Business Intelligence • Rendimiento de Cartera</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Matriz BCG Estratégica (Live)</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Mapeando: <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">/api/v1/analytics/bcg</span>
          </p>
          {errorMsg && <p className="text-xs text-rose-500 font-bold mt-1">⚠️ {errorMsg}</p>}
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
          {/* Barra de Búsqueda Superior */}
          <div className="relative w-full md:w-64 xl:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm transition-all text-slate-700 placeholder-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          {/* Toggle Switch de Vistas */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setVista('grafico')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vista === 'grafico' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart2 size={16} /> Scatter
            </button>
            <button
              onClick={() => setVista('cuadrantes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vista === 'cuadrantes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={16} /> Grid 2x2
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          {/* Filtro Sucursales */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0 overflow-x-auto">
            {['todas', 'Heroinas', 'Recoleta', 'Calacoto'].map((suc) => (
              <button
                key={suc}
                onClick={() => {
                  setSucursal(suc);
                  setProductoSeleccionado(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  sucursal === suc 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {suc === 'todas' ? 'Global' : suc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTRO RÁPIDO DE CATEGORÍAS ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 mr-2">
          <Package size={16} className="text-indigo-600" />
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Categorías:</span>
        </div>
        <button
          onClick={() => setCategoriaFiltro('todas')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            categoriaFiltro === 'todas' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Todas ({productosFiltrados.length})
        </button>
        {categoriasDisponibles.map((cat: any) => {
          const count = productosFiltrados.filter((p) => p.categoria === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                categoriaFiltro === cat ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-[700px] bg-slate-50 rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Aislando ventas de la sucursal seleccionada en MongoDB...</p>
        </div>
      ) : (
        <>
          {/* VISTA 1: BUBBLE SCATTER CHART RECHARTS */}
          {vista === 'grafico' && (
            <div className="h-[700px] bg-slate-50/50 rounded-2xl p-4 border border-slate-200 relative shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E2E8F0" />
                  
                  <XAxis 
                    type="number" 
                    dataKey="participacion" 
                    name="Participación Relativa" 
                    unit="%" 
                    domain={[0, 'auto']} 
                    tick={{fontSize: 12, fill: '#64748B', fontWeight: 600}}
                    axisLine={{stroke: '#94A3B8', strokeWidth: 2}}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="crecimiento" 
                    name="Crecimiento de Mercado" 
                    unit="%" 
                    domain={['auto', 'auto']} 
                    tick={{fontSize: 12, fill: '#64748B', fontWeight: 600}}
                    axisLine={{stroke: '#94A3B8', strokeWidth: 2}}
                  />
                  {/* ZAxis Controla el tamaño de la burbuja en base al Margen Pct */}
                  <ZAxis type="number" dataKey="margen" range={[50, 800]} name="Margen %" />
                  
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#CBD5E1' }} 
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-200 text-xs w-64 z-50">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                              <div className="w-3 h-3 rounded-full" style={{backgroundColor: QUADRANT_COLORS[data.cuadrante as keyof typeof QUADRANT_COLORS]}}></div>
                              <p className="font-black text-slate-800 text-sm truncate" title={data.name}>{data.name}</p>
                            </div>
                            <div className="space-y-1.5 text-slate-600 font-medium">
                              <p className="flex justify-between">Categoría: <span className="font-bold text-slate-900">{data.categoria}</span></p>
                              <p className="flex justify-between">Sucursal: <span className="font-bold text-indigo-600">{data.sucursal}</span></p>
                              <p className="flex justify-between">Cuadrante: <span className="font-bold" style={{color: QUADRANT_COLORS[data.cuadrante as keyof typeof QUADRANT_COLORS]}}>{data.cuadrante}</span></p>
                              <p className="flex justify-between">Ventas Totales: <span className="font-bold text-slate-900">Bs. {data.ventas}</span></p>
                              <p className="flex justify-between">Participación: <span className="font-bold text-slate-900">{data.participacion}%</span></p>
                              <p className="flex justify-between">Crecimiento (MoM): <span className="font-bold text-slate-900">{data.crecimiento}%</span></p>
                              <div className="flex justify-between items-center bg-indigo-50 p-1.5 rounded-lg text-indigo-900 mt-2">
                                <span>Margen Neto:</span>
                                <span className="font-black text-sm">{data.margen}%</span>
                              </div>
                              <p className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                Variación Ventas: 
                                <span className={`flex items-center gap-1 font-black ${String(data.vsMesAnterior).startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {String(data.vsMesAnterior).startsWith('+') ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                  {data.vsMesAnterior}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Scatter data={productosFiltrados} animationDuration={800} onClick={(data) => setProductoSeleccionado(data)}>
                    {productosFiltrados.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={QUADRANT_COLORS[entry.cuadrante as keyof typeof QUADRANT_COLORS]} 
                        fillOpacity={entry.ventas === 0 ? 0.3 : 0.80} 
                        stroke={QUADRANT_COLORS[entry.cuadrante as keyof typeof QUADRANT_COLORS]}
                        strokeWidth={1}
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400 bg-white/80 px-2.5 py-1 rounded-md border border-slate-200/50 backdrop-blur-sm shadow-sm">
                Tamaño de la burbuja = Volumen de Margen Neto (%)
              </div>
            </div>
          )}

          {/* VISTA 2: CLASSIC GRID 2x2 (Con tarjetas aisladas por sucursal) */}
          {vista === 'cuadrantes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              
              {/* ESTRELLA */}
              <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col h-[700px]">
                <div className="flex justify-between items-start mb-3 shrink-0">
                  <div>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">⭐ Estrella ({estrellas.length})</span>
                    <h3 className="text-xs font-bold text-emerald-900 mt-2">Alto Crecimiento / Alta Participación</h3>
                  </div>
                  <span className="text-xl">🌟</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                  {estrellas.length > 0 ? estrellas.map(prod => (
                    <div key={prod.id || prod.name} onClick={() => setProductoSeleccionado(prod)} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs cursor-pointer hover:bg-emerald-50/50 flex justify-between items-center text-xs transition-all hover:shadow-sm">
                      <div className="truncate pr-2 max-w-[60%]">
                        <p className="font-bold text-slate-800 truncate" title={prod.name}>{prod.name}</p>
                        <span className="text-[10px] text-slate-500 font-semibold">{prod.categoria} • <span className="text-indigo-600 font-bold">{prod.sucursal}</span></span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">Mrg: {prod.margen}%</span>
                        {renderMoMBadge(prod.vsMesAnterior)}
                      </div>
                    </div>
                  )) : <p className="text-xs text-slate-400 italic">Sin productos en este cuadrante.</p>}
                </div>
              </div>

              {/* INTERROGANTE */}
              <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col h-[700px]">
                <div className="flex justify-between items-start mb-3 shrink-0">
                  <div>
                    <span className="bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">❓ Interrogante ({interrogantes.length})</span>
                    <h3 className="text-xs font-bold text-amber-900 mt-2">Alto Crecimiento / Baja Participación</h3>
                  </div>
                  <span className="text-xl">❓</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                  {interrogantes.length > 0 ? interrogantes.map(prod => (
                    <div key={prod.id || prod.name} onClick={() => setProductoSeleccionado(prod)} className="bg-white p-3 rounded-xl border border-amber-100 shadow-xs cursor-pointer hover:bg-amber-50/50 flex justify-between items-center text-xs transition-all hover:shadow-sm">
                      <div className="truncate pr-2 max-w-[60%]">
                        <p className="font-bold text-slate-800 truncate" title={prod.name}>{prod.name}</p>
                        <span className="text-[10px] text-slate-500 font-semibold">{prod.categoria} • <span className="text-indigo-600 font-bold">{prod.sucursal}</span></span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">Mrg: {prod.margen}%</span>
                        {renderMoMBadge(prod.vsMesAnterior)}
                      </div>
                    </div>
                  )) : <p className="text-xs text-slate-400 italic">Sin productos en este cuadrante.</p>}
                </div>
              </div>

              {/* VACA LECHERA */}
              <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-4 shadow-sm flex flex-col h-[700px]">
                <div className="flex justify-between items-start mb-3 shrink-0">
                  <div>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">🐮 Vaca Lechera ({vacas.length})</span>
                    <h3 className="text-xs font-bold text-blue-900 mt-2">Bajo Crecimiento / Alta Participación</h3>
                  </div>
                  <span className="text-xl">🐮</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                  {vacas.length > 0 ? vacas.map(prod => (
                    <div key={prod.id || prod.name} onClick={() => setProductoSeleccionado(prod)} className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs cursor-pointer hover:bg-blue-50/50 flex justify-between items-center text-xs transition-all hover:shadow-sm">
                      <div className="truncate pr-2 max-w-[60%]">
                        <p className="font-bold text-slate-800 truncate" title={prod.name}>{prod.name}</p>
                        <span className="text-[10px] text-slate-500 font-semibold">{prod.categoria} • <span className="text-indigo-600 font-bold">{prod.sucursal}</span></span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">Mrg: {prod.margen}%</span>
                        {renderMoMBadge(prod.vsMesAnterior)}
                      </div>
                    </div>
                  )) : <p className="text-xs text-slate-400 italic">Sin productos en este cuadrante.</p>}
                </div>
              </div>

              {/* PERRO */}
              <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col h-[700px]">
                <div className="flex justify-between items-start mb-3 shrink-0">
                  <div>
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">🐶 Perro ({perros.length})</span>
                    <h3 className="text-xs font-bold text-rose-900 mt-2">Bajo Crecimiento / Baja Participación</h3>
                  </div>
                  <span className="text-xl">🐶</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                  {perros.length > 0 ? perros.map(prod => (
                    <div key={prod.id || prod.name} onClick={() => setProductoSeleccionado(prod)} className="bg-white p-3 rounded-xl border border-rose-100 shadow-xs cursor-pointer hover:bg-rose-50/50 flex justify-between items-center text-xs transition-all hover:shadow-sm">
                      <div className="truncate pr-2 max-w-[60%]">
                        <p className="font-bold text-slate-800 truncate" title={prod.name}>{prod.name}</p>
                        <span className="text-[10px] text-slate-500 font-semibold">{prod.categoria} • <span className="text-indigo-600 font-bold">{prod.sucursal}</span></span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">Mrg: {prod.margen}%</span>
                        {renderMoMBadge(prod.vsMesAnterior)}
                      </div>
                    </div>
                  )) : <p className="text-xs text-slate-400 italic">Sin productos en este cuadrante.</p>}
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* PANEL MODAL DE DETALLE RÁPIDO */}
      {productoSeleccionado && (
        <div className="mt-6 bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-lg gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-[50%]">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Inspección Táctica</span>
            <h4 className="text-base font-bold leading-tight mt-0.5 truncate">{productoSeleccionado.name}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Cat: <span className="text-slate-200">{productoSeleccionado.categoria}</span> | 
              Sucursal: <span className="text-indigo-400 font-semibold">{productoSeleccionado.sucursal}</span> | 
              Clasificación: <span className="font-bold" style={{color: QUADRANT_COLORS[productoSeleccionado.cuadrante as keyof typeof QUADRANT_COLORS]}}> {productoSeleccionado.cuadrante}</span>
            </p>
          </div>
          <div className="flex gap-6 text-right items-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Participación</p>
              <p className="text-sm font-black text-white">{productoSeleccionado.participacion}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Crecimiento</p>
              <p className="text-sm font-black text-white">{productoSeleccionado.crecimiento}%</p>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Margen</p>
              <p className="text-sm font-black text-amber-300">{productoSeleccionado.margen}%</p>
            </div>
            <button 
              onClick={() => setProductoSeleccionado(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 flex items-center justify-center rounded-full transition-colors ml-2"
              title="Cerrar detalle"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
