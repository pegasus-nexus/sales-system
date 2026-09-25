import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Search, Save, CheckCircle, ArrowLeft, Loader2, X } from 'lucide-react';
import { getConteos, iniciarConteo, getConteo, guardarProgresoConteo, finalizarConteo } from '../api/conteos_api';
import type { ConteoItem } from '../api/conteos_api';
import { getSucursales } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { useConfirm } from '../components/ConfirmModal';
import { formatFullDate } from '../utils/dateUtils';

const ControlInventarioPage = () => {
    const user = useAuthStore(s => s.user);
    const esMatriz = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MATRIZ';
    const sucursalIdDefault = esMatriz ? 'CENTRAL' : (user?.sucursal_id || 'CENTRAL');

    const [selectedSucursal, setSelectedSucursal] = useState<string>(sucursalIdDefault);
    const [activeConteoId, setActiveConteoId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales,
        enabled: esMatriz
    });

    const { data: conteos = [], isLoading: loadingConteos } = useQuery({
        queryKey: ['conteos', selectedSucursal],
        queryFn: () => getConteos(selectedSucursal)
    });

    const startMutation = useMutation({
        mutationFn: (notas: string) => iniciarConteo(selectedSucursal, notas),
        onSuccess: (data) => {
            setActiveConteoId(data.id);
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
            toast.success('Conteo iniciado. Ya puedes empezar a registrar el stock físico.');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Error al iniciar conteo');
        }
    });

    const [showStartModal, setShowStartModal] = useState(false);
    const [startNotas, setStartNotas] = useState("Conteo General");
    const handleStart = () => {
        setShowStartModal(true);
    };

    const confirmStart = () => {
        startMutation.mutate(startNotas);
        setShowStartModal(false);
    };

    if (activeConteoId) {
        return <ActiveConteoView conteoId={activeConteoId} onBack={() => setActiveConteoId(null)} />;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

            {showStartModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Iniciar Nuevo Conteo Físico</h3>
                            <button onClick={() => setShowStartModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600">
                                Se tomará una fotografía del inventario actual del sistema para compararlo con tu conteo físico.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo / Notas del Conteo</label>
                                <input 
                                    type="text" 
                                    value={startNotas}
                                    onChange={(e) => setStartNotas(e.target.value)}
                                    placeholder="Ej: Conteo mensual, Inventario general, etc."
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                            <button 
                                onClick={() => setShowStartModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmStart}
                                disabled={startMutation.isPending}
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                            >
                                {startMutation.isPending && <Loader2 size={16} className="animate-spin"/>}
                                Iniciar Conteo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList className="text-indigo-600" />
                        Control de Inventario (Auditoría)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Realiza conteos físicos sin afectar el inventario real para generar reportes de diferencias.
                    </p>
                </div>

                <div className="flex gap-3">
                    {esMatriz && (
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold"
                        >
                            <option value="CENTRAL">Central</option>
                            {sucursales.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                        </select>
                    )}
                    <button
                        onClick={handleStart}
                        disabled={startMutation.isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {startMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Nuevo Conteo Físico
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap text-gray-900">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                        <tr>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Creado Por</th>
                            <th className="px-4 py-3 text-right">Items Analizados</th>
                            <th className="px-4 py-3 text-right">Descuadre (Unidades)</th>
                            <th className="px-4 py-3 text-right">Descuadre (Monetario)</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {conteos.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{formatFullDate(c.fecha_inicio)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.estado === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {c.estado}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{c.creado_por_nombre || 'Desconocido'}</td>
                                <td className="px-4 py-3 text-right">{c.total_items}</td>
                                <td className={`px-4 py-3 text-right font-bold ${c.total_diferencia_items < 0 ? 'text-red-600' : (c.total_diferencia_items > 0 ? 'text-blue-600' : 'text-gray-900')}`}>
                                    {c.total_diferencia_items > 0 ? '+' : ''}{c.total_diferencia_items}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${c.total_diferencia_monetaria < 0 ? 'text-red-600' : (c.total_diferencia_monetaria > 0 ? 'text-blue-600' : 'text-gray-900')}`}>
                                    Bs. {c.total_diferencia_monetaria.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button 
                                        onClick={() => setActiveConteoId(c.id)}
                                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                                    >
                                        {c.estado === 'FINALIZADO' ? 'Ver Reporte' : 'Continuar Conteo'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {conteos.length === 0 && !loadingConteos && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No hay reportes de conteo físico para esta sucursal.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ActiveConteoView = ({ conteoId, onBack }: { conteoId: string, onBack: () => void }) => {
    const confirmModal = useConfirm();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [localItems, setLocalItems] = useState<ConteoItem[]>([]);

    const { data: conteo, isLoading } = useQuery({
        queryKey: ['conteo', conteoId],
        queryFn: () => getConteo(conteoId)
    });

    React.useEffect(() => {
        if (conteo) {
            setLocalItems(conteo.items);
        }
    }, [conteo]);

    const saveMutation = useMutation({
        mutationFn: () => guardarProgresoConteo(conteoId, localItems),
        onSuccess: (data) => {
            queryClient.setQueryData(['conteo', conteoId], data);
            toast.success('Progreso guardado correctamente');
        },
        onError: (err: any) => toast.error(err.message || 'Error al guardar')
    });

    const finishMutation = useMutation({
        mutationFn: async () => {
            await guardarProgresoConteo(conteoId, localItems);
            return finalizarConteo(conteoId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
            queryClient.invalidateQueries({ queryKey: ['conteo', conteoId] });
            toast.success('Conteo finalizado y reporte generado con éxito');
        },
        onError: (err: any) => toast.error(err.message || 'Error al finalizar')
    });

    const handleItemChange = (index: number, valStr: string) => {
        const newItems = [...localItems];
        if (valStr.trim() === '') {
            newItems[index].stock_fisico = null;
            newItems[index].diferencia = 0;
            newItems[index].valor_diferencia = 0;
        } else {
            const val = parseFloat(valStr);
            if (!isNaN(val)) {
                newItems[index].stock_fisico = val;
                newItems[index].diferencia = val - newItems[index].stock_sistema;
                newItems[index].valor_diferencia = newItems[index].diferencia * newItems[index].costo_unitario;
            }
        }
        setLocalItems(newItems);
    };

    if (isLoading || !conteo) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>;

    const isFinished = conteo.estado === 'FINALIZADO';
    const filteredItems = localItems.filter(i => (i.descripcion || '').toLowerCase().includes(search.toLowerCase()) || (i.codigo_corto || '').toLowerCase().includes(search.toLowerCase()));

    
    const totalDiff = localItems.reduce((acc, i) => acc + i.diferencia, 0);
    const totalValDiff = localItems.reduce((acc, i) => acc + i.valor_diferencia, 0);

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-4 flex flex-col h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {isFinished ? 'Reporte de Conteo Físico' : 'Ingreso de Conteo Físico'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {formatFullDate(conteo.fecha_inicio)} • {conteo.creado_por_nombre}
                        </p>
                    </div>
                </div>

                {!isFinished && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => saveMutation.mutate()} 
                            disabled={saveMutation.isPending || finishMutation.isPending}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                        >
                            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />}
                            Guardar Borrador
                        </button>
                        <button 
                            onClick={async () => {
                                if(await confirmModal({title: 'Finalizar Conteo', message: '¿Finalizar conteo? Ya no podrás editarlo y se generará el reporte definitivo.', type: 'warning'})) {
                                    finishMutation.mutate();
                                }
                            }}
                            disabled={saveMutation.isPending || finishMutation.isPending}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2"
                        >
                            {finishMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16} />}
                            Finalizar Conteo
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between shrink-0 bg-white p-3 rounded-lg border border-gray-200">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                    />
                </div>
                <div className="flex gap-6 text-sm">
                    <div>Descuadre Unidades: <span className={`font-bold ${totalDiff < 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalDiff}</span></div>
                    <div>Descuadre Monetario: <span className={`font-bold ${totalValDiff < 0 ? 'text-red-600' : 'text-gray-900'}`}>Bs. {totalValDiff.toFixed(2)}</span></div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap text-gray-900">
                    <thead className="bg-gray-800 text-white sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-semibold w-24">Cód</th>
                            <th className="px-4 py-3 font-semibold">Producto</th>
                            <th className="px-4 py-3 font-semibold text-right w-32">Stock Sistema</th>
                            <th className="px-4 py-3 font-semibold text-center w-40 bg-indigo-900">STOCK FÍSICO</th>
                            <th className="px-4 py-3 font-semibold text-right w-32">Diferencia</th>
                            <th className="px-4 py-3 font-semibold text-right w-32">Valor (Bs)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredItems.map((item) => {
                            const originalIdx = localItems.findIndex(i => i.producto_id === item.producto_id);
                            return (
                                <tr key={item.producto_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono text-xs">{item.codigo_corto || '-'}</td>
                                    <td className="px-4 py-2 max-w-[300px] truncate font-medium" title={item.descripcion}>{item.descripcion}</td>
                                    <td className="px-4 py-2 text-right text-gray-500 font-mono">{item.stock_sistema.toFixed(2)}</td>
                                    <td className="px-4 py-1.5 bg-indigo-50">
                                        {isFinished ? (
                                            <div className="text-center font-bold font-mono">
                                                {item.stock_fisico !== null ? item.stock_fisico.toFixed(2) : '-'}
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full text-center border border-indigo-200 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none font-bold font-mono bg-white text-gray-900"
                                                value={item.stock_fisico === null ? '' : item.stock_fisico}
                                                onChange={e => handleItemChange(originalIdx, e.target.value)}
                                                placeholder="Contar"
                                            />
                                        )}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-bold font-mono ${item.diferencia < 0 ? 'text-red-600' : (item.diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                        {item.stock_fisico !== null ? (item.diferencia > 0 ? '+' : '') + item.diferencia.toFixed(2) : '-'}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-mono ${item.valor_diferencia < 0 ? 'text-red-600' : (item.valor_diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                        {item.stock_fisico !== null ? item.valor_diferencia.toFixed(2) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ControlInventarioPage;
