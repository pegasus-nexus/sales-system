import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { getBIPanelGeneral, getBISucursales } from '../../api/biApi';
import type { BIPanelGeneralResponse, BISucursalOption } from '../../api/biApi';
import { BIOperacionDiariaView } from './BIOperacionDiariaView';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getFormattedBoliviaDate = (daysOffset: number = 0): string => {
    const now = new Date();
    const boliviaDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);

    if (daysOffset === 0) return boliviaDateStr;

    const [y, m, d] = boliviaDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + daysOffset);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const BIPanelGeneralView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const requestIdRef = useRef<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [preset, setPreset] = useState<'hoy' | 'ayer' | '7dias' | '30dias' | 'historial' | 'custom'>('hoy');
    const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => ({
        startDate: getFormattedBoliviaDate(0),
        endDate: getFormattedBoliviaDate(0)
    }));
    const { startDate, endDate } = dateRange;

    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);
    const [data, setData] = useState<BIPanelGeneralResponse | null>(null);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales para BI:', err);
        }
    };

    const fetchBIData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const currentRequestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const res = await getBIPanelGeneral(sDate, eDate, sucId, { signal: controller.signal });
            if (currentRequestId !== requestIdRef.current) return;
            setData(res);
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (currentRequestId === requestIdRef.current) {
                console.error('Error obteniendo métricas del BI:', err);
                setError('No fue posible obtener los datos del BI. Error de conexión con el servidor.');
                setData(null);
            }
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadSucursales();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchBIData(dateRange.startDate, dateRange.endDate, selectedSucursal);
        }
    }, [dateRange, selectedSucursal, fetchBIData]);

    const handlePresetChange = (newPreset: 'hoy' | 'ayer' | '7dias' | '30dias' | 'historial') => {
        setPreset(newPreset);
        const todayBoliviaStr = getFormattedBoliviaDate(0);
        if (newPreset === 'hoy') {
            setDateRange({ startDate: todayBoliviaStr, endDate: todayBoliviaStr });
        } else if (newPreset === 'ayer') {
            const yesterdayBoliviaStr = getFormattedBoliviaDate(-1);
            setDateRange({ startDate: yesterdayBoliviaStr, endDate: yesterdayBoliviaStr });
        } else if (newPreset === '7dias') {
            const d7Str = getFormattedBoliviaDate(-6);
            setDateRange({ startDate: d7Str, endDate: todayBoliviaStr });
        } else if (newPreset === '30dias') {
            const d30Str = getFormattedBoliviaDate(-29);
            setDateRange({ startDate: d30Str, endDate: todayBoliviaStr });
        } else if (newPreset === 'historial') {
            setDateRange({ startDate: 'historial', endDate: 'historial' });
        }
    };

    const handleReset = () => {
        setPreset('hoy');
        const todayBoliviaStr = getFormattedBoliviaDate(0);
        setDateRange({ startDate: todayBoliviaStr, endDate: todayBoliviaStr });
        setSelectedSucursal('all');
    };

    if (error && !loading) {
        return (
            <div className="bg-rose-50/90 border-2 border-rose-200/80 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-600 shadow-xs">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No se pudo obtener los datos del BI</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchBIData(startDate, endDate, selectedSucursal)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all"
                    >
                        <RefreshCw size={14} />
                        <span>Reintentar Conexión</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fd] p-1 sm:p-2 space-y-6 font-sans text-slate-800 w-full">
            <BIOperacionDiariaView
                data={data}
                loading={loading}
                formatBs={formatBs}
                startDate={startDate}
                endDate={endDate}
                preset={preset}
                selectedSucursal={selectedSucursal}
                sucursales={sucursales}
                onPresetChange={handlePresetChange}
                onDateChange={(start, end) => {
                    setPreset('custom');
                    setDateRange({ startDate: start, endDate: end });
                }}
                onSucursalChange={(sucId) => setSelectedSucursal(sucId)}
                onReset={handleReset}
                onRefresh={() => fetchBIData(startDate, endDate, selectedSucursal)}
            />
        </div>
    );
};
