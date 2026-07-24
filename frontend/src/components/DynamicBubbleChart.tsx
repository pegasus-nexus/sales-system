import { useState, useMemo, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Settings2, Info, Loader2 } from 'lucide-react';
import { client } from '../api/api';

// --- Tipos ---
interface PortfolioProduct {
    producto_id: string;
    nombre: string;
    categoria: string;
    ventas: number;
    cantidad: number;
    margen: number;
}

interface PortfolioResponse {
    period: string; // ej. "2026-06"
    products: PortfolioProduct[];
}

interface DynamicBubbleChartProps {
    startDates: Date[]; // Arreglo de fechas de inicio (una por mes seleccionado)
    endDates: Date[];   // Arreglo de fechas de fin
    sucursalId?: string;
}

// Colores por cuadrante (Modo 1 Mes)
const QUADRANT_COLORS = {
    topRight: '#10b981', // Verde (Estrella)
    topLeft: '#3b82f6', // Azul (Interrogante)
    bottomRight: '#f59e0b', // Amarillo (Vaca)
    bottomLeft: '#ef4444' // Rojo (Perro)
};

// Colores por Mes (Modo Multi-Mes)
const MONTH_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'
];

export default function DynamicBubbleChart({ startDates, endDates, sucursalId }: DynamicBubbleChartProps) {
    const [dataByPeriod, setDataByPeriod] = useState<PortfolioResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Controles UI
    const [thresholdType, setThresholdType] = useState<'mediana' | 'pareto' | 'custom'>('mediana');
    const [customThresholdX, setCustomThresholdX] = useState<number>(0);
    const [customThresholdY, setCustomThresholdY] = useState<number>(0);
    const [bubbleSizeBy, setBubbleSizeBy] = useState<'ventas' | 'margen'>('ventas');

    // Fetch data
    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            if (startDates.length === 0) return;
            setIsLoading(true);
            
            try {
                const promises = startDates.map((start, i) => {
                    const end = endDates[i];
                    const params = new URLSearchParams({
                        start_date: start.toISOString(),
                        end_date: end.toISOString()
                    });
                    if (sucursalId) params.append('sucursal_id', sucursalId);
                    
                    return client<PortfolioResponse>(`/analytics/portfolio?${params.toString()}`);
                });
                
                const results = await Promise.all(promises);
                if (isMounted) setDataByPeriod(results);
            } catch (err) {
                console.error("Error fetching portfolio:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        
        fetchData();
        return () => { isMounted = false; };
    }, [startDates, endDates, sucursalId]);

    // Procesamiento Matemático
    const { processedData, thresholds, maxX, maxY } = useMemo(() => {
        if (dataByPeriod.length === 0) return { processedData: [], thresholds: { x: 0, y: 0 }, maxX: 100, maxY: 100 };

        let allProducts: any[] = [];
        let combinedVentas: number[] = [];
        let combinedCantidad: number[] = [];
        
        let maxXVal = 0;
        let maxYVal = 0;
        let maxZVal = 0;

        // Calcular totales generales para participaciones
        let totalVentasGlobal = 0;
        let totalMargenGlobal = 0;

        dataByPeriod.forEach((periodData, pIdx) => {
            periodData.products.forEach(p => {
                totalVentasGlobal += p.ventas;
                totalMargenGlobal += p.margen;
                
                combinedVentas.push(p.ventas);
                combinedCantidad.push(p.cantidad);

                if (p.ventas > maxXVal) maxXVal = p.ventas;
                if (p.cantidad > maxYVal) maxYVal = p.cantidad;

                // Para Z (Tamaño) dependemos del modo
                let zVal = bubbleSizeBy === 'ventas' ? p.ventas : p.margen;
                if (zVal < 0) zVal = 0; // Margen negativo -> tamaño 0 o minimo
                if (zVal > maxZVal) maxZVal = zVal;

                allProducts.push({
                    ...p,
                    periodIndex: pIdx,
                    periodName: periodData.period,
                    zVal
                });
            });
        });

        // Calcular Participaciones (%)
        allProducts = allProducts.map(p => ({
            ...p,
            participacion_ventas: totalVentasGlobal > 0 ? (p.ventas / totalVentasGlobal) * 100 : 0,
            participacion_margen: totalMargenGlobal > 0 ? (p.margen / totalMargenGlobal) * 100 : 0
        }));

        // === CALCULAR UMBRALES ===
        let thresX = customThresholdX;
        let thresY = customThresholdY;

        if (thresholdType === 'mediana' && combinedVentas.length > 0) {
            const sortedV = [...combinedVentas].sort((a,b) => a-b);
            const sortedC = [...combinedCantidad].sort((a,b) => a-b);
            
            const midV = Math.floor(sortedV.length / 2);
            thresX = sortedV.length % 2 !== 0 ? sortedV[midV] : (sortedV[midV - 1] + sortedV[midV]) / 2;
            
            const midC = Math.floor(sortedC.length / 2);
            thresY = sortedC.length % 2 !== 0 ? sortedC[midC] : (sortedC[midC - 1] + sortedC[midC]) / 2;
        } 
        else if (thresholdType === 'pareto' && combinedVentas.length > 0) {
            // Pareto X (Ventas)
            const sortedByVentas = [...allProducts].sort((a, b) => b.ventas - a.ventas);
            let cumVentas = 0;
            const targetVentas = totalVentasGlobal * 0.8;
            for (let p of sortedByVentas) {
                cumVentas += p.ventas;
                thresX = p.ventas;
                if (cumVentas >= targetVentas) break;
            }

            // Pareto Y (Cantidad)
            const totalQty = combinedCantidad.reduce((acc, curr) => acc + curr, 0);
            const sortedByQty = [...allProducts].sort((a, b) => b.cantidad - a.cantidad);
            let cumQty = 0;
            const targetQty = totalQty * 0.8;
            for (let p of sortedByQty) {
                cumQty += p.cantidad;
                thresY = p.cantidad;
                if (cumQty >= targetQty) break;
            }
        }
        
        // Si custom, usar el state
        if (thresholdType === 'custom') {
            thresX = customThresholdX;
            thresY = customThresholdY;
        }

        return {
            processedData: allProducts,
            thresholds: { x: thresX, y: thresY },
            maxX: maxXVal * 1.1, // 10% padding
            maxY: maxYVal * 1.1
        };

    }, [dataByPeriod, thresholdType, bubbleSizeBy, customThresholdX, customThresholdY]);

    // Función para obtener color
    const getBubbleColor = (item: any) => {
        if (dataByPeriod.length > 1) {
            // Modo Multi-Mes: Color por Mes
            return MONTH_COLORS[item.periodIndex % MONTH_COLORS.length];
        } else {
            // Modo 1 Mes: Color por Cuadrante
            const isHighX = item.ventas >= thresholds.x;
            const isHighY = item.cantidad >= thresholds.y;
            
            if (isHighX && isHighY) return QUADRANT_COLORS.topRight;
            if (!isHighX && isHighY) return QUADRANT_COLORS.topLeft;
            if (isHighX && !isHighY) return QUADRANT_COLORS.bottomRight;
            return QUADRANT_COLORS.bottomLeft;
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-sm z-50">
                    <p className="font-bold text-gray-800 mb-1">{data.nombre}</p>
                    <p className="text-gray-500 text-xs mb-3">{data.categoria} • {data.periodName}</p>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Ventas (Eje X):</span>
                            <span className="font-semibold text-gray-800">Bs. {data.ventas.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Unidades (Eje Y):</span>
                            <span className="font-semibold text-gray-800">{data.cantidad.toLocaleString()} u.</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Margen:</span>
                            <span className="font-semibold text-gray-800">Bs. {data.margen.toLocaleString()}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">% en Ventas:</span>
                            <span className="font-semibold text-blue-600">{data.participacion_ventas.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">% en Margen:</span>
                            <span className="font-semibold text-emerald-600">{data.participacion_margen.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full flex flex-col gap-6">
            
            {/* Controles Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                
                {/* Opciones de Umbral */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Settings2 className="w-3 h-3" /> Cruce de Ejes (Cuadrantes)
                    </label>
                    <div className="flex items-center gap-2">
                        <select 
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                            value={thresholdType}
                            onChange={(e: any) => setThresholdType(e.target.value)}
                        >
                            <option value="mediana">Mediana Estadística</option>
                            <option value="pareto">Ley de Pareto (80/20)</option>
                            <option value="custom">Personalizado</option>
                        </select>
                        
                        {thresholdType === 'custom' && (
                            <div className="flex items-center gap-2 ml-2">
                                <input 
                                    type="number" 
                                    className="w-24 p-2 text-sm border border-gray-200 rounded-lg"
                                    placeholder="Meta Ventas (X)"
                                    value={customThresholdX}
                                    onChange={e => setCustomThresholdX(Number(e.target.value))}
                                />
                                <input 
                                    type="number" 
                                    className="w-24 p-2 text-sm border border-gray-200 rounded-lg"
                                    placeholder="Meta Unidades (Y)"
                                    value={customThresholdY}
                                    onChange={e => setCustomThresholdY(Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Opciones de Burbuja */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3 h-3" /> Tamaño de Burbuja
                    </label>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => setBubbleSizeBy('ventas')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                bubbleSizeBy === 'ventas' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            % Ventas
                        </button>
                        <button
                            onClick={() => setBubbleSizeBy('margen')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                bubbleSizeBy === 'margen' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            % Rentabilidad
                        </button>
                    </div>
                </div>
            </div>

            {/* Grafico Recharts */}
            <div className="w-full relative bg-white border border-gray-100 rounded-[2rem] shadow-sm p-4 pt-10" style={{ height: '600px' }}>
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem]">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-sm font-medium text-gray-500 animate-pulse">Procesando miles de registros...</p>
                        </div>
                    </div>
                )}
                
                {dataByPeriod.length > 0 && processedData.length === 0 && !isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <p className="text-gray-400 font-medium">No se encontraron datos para este periodo.</p>
                    </div>
                )}

                {/* SVG Definitions para las flechas */}
                <svg width="0" height="0">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                    </marker>
                  </defs>
                </svg>

                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis 
                            type="number" 
                            dataKey="ventas" 
                            name="Ventas" 
                            unit=" Bs" 
                            tickFormatter={(tick) => `${(tick / 1000).toFixed(0)}k`}
                            stroke="#9ca3af"
                            domain={[0, maxX]}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="cantidad" 
                            name="Unidades" 
                            unit=" u"
                            stroke="#9ca3af"
                            domain={[0, maxY]}
                        />
                        <ZAxis 
                            type="number" 
                            dataKey="zVal" 
                            range={[50, 800]} 
                            name="Tamaño" 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        
                        {/* Ejes Centrales (Umbrales) */}
                        {dataByPeriod.length <= 1 && (
                            <>
                                <ReferenceLine x={thresholds.x} stroke="#cbd5e1" strokeDasharray="3 3" />
                                <ReferenceLine y={thresholds.y} stroke="#cbd5e1" strokeDasharray="3 3" />
                            </>
                        )}

                        {/* Puntos (Burbujas) */}
                        <Scatter data={processedData} fill="#3b82f6" shape="circle" fillOpacity={0.7} strokeWidth={1.5} stroke="#fff">
                            {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBubbleColor(entry)} />
                            ))}
                        </Scatter>

                        {/* Flechas de Trayectoria (Multi-Mes) */}
                        {dataByPeriod.length > 1 && (
                            // Generamos ReferenceLines con segments
                            (() => {
                                const productPaths: Record<string, any[]> = {};
                                processedData.forEach(p => {
                                    if (!productPaths[p.producto_id]) productPaths[p.producto_id] = [];
                                    productPaths[p.producto_id].push(p);
                                });

                                const lines: import("react").JSX.Element[] = [];
                                Object.values(productPaths).forEach((history) => {
                                    if (history.length < 2) return;
                                    history.sort((a, b) => a.periodIndex - b.periodIndex);
                                    
                                    for (let i = 0; i < history.length - 1; i++) {
                                        const p1 = history[i];
                                        const p2 = history[i+1];
                                        if (p1.ventas === p2.ventas && p1.cantidad === p2.cantidad) continue;
                                        
                                        lines.push(
                                            <ReferenceLine 
                                                key={`arrow-${p1.producto_id}-${i}`}
                                                segment={[{ x: p1.ventas, y: p1.cantidad }, { x: p2.ventas, y: p2.cantidad }]}
                                                stroke="#9ca3af"
                                                strokeWidth={2}
                                                style={{ markerEnd: 'url(#arrowhead)' }}
                                            />
                                        );
                                    }
                                });
                                return lines;
                            })()
                        )}
                    </ScatterChart>
                </ResponsiveContainer>

                {/* Leyenda Absoluta */}
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md border border-gray-200 p-4 rounded-xl shadow-lg text-xs">
                    {dataByPeriod.length > 1 ? (
                        <div>
                            <p className="font-bold text-gray-700 mb-2">Evolución (Meses)</p>
                            {dataByPeriod.map((pd, i) => (
                                <div key={pd.period} className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MONTH_COLORS[i % MONTH_COLORS.length] }}></div>
                                    <span className="text-gray-600 font-medium">{pd.period}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold text-gray-700 mb-2 flex items-center justify-between">
                                Cuadrantes (Rendimiento)
                                <span className="text-gray-400 font-normal ml-2">(Threshold: {thresholds.x.toFixed(0)} Bs, {thresholds.y.toFixed(0)} u)</span>
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-gray-600">Alta V, Alta U</span></div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-gray-600">Baja V, Alta U</span></div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-gray-600">Alta V, Baja U</span></div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-gray-600">Baja V, Baja U</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
