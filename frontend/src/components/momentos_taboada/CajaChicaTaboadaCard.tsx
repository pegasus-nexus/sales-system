import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Wallet, ArrowDownRight, RefreshCcw, MinusCircle } from 'lucide-react';
import type { CajaChicaTaboadaResponse, Sucursal } from '../../api/types';
import { getMomentosTaboadaCajaChica } from '../../api/api';
import { RegistrarEgresoCajaModal } from './RegistrarEgresoCajaModal';

interface Props {
    sucursales: Sucursal[];
}

export const CajaChicaTaboadaCard: React.FC<Props> = ({ sucursales }) => {
    const [selectedSucursal, setSelectedSucursal] = useState<string>('TODAS');
    const [cajaData, setCajaData] = useState<CajaChicaTaboadaResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);

    const loadCaja = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMsg(null);
            const res = await getMomentosTaboadaCajaChica(
                selectedSucursal === 'TODAS' ? undefined : selectedSucursal
            );
            setCajaData(res);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar fondo de promoción';
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSucursal]);

    useEffect(() => {
        loadCaja();
    }, [loadCaja]);

    return (
        <div className="space-y-6">
            {/* Cabecera y Filtro de Sucursal */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-amber-600" />
                        Fondo & Caja Chica Promocional (Separado de Ventas POS)
                    </h3>
                    <p className="text-sm text-gray-500">
                        Control contable independiente del dinero recaudado por copagos de premios (Bs 19, Bs 39, Bs 69, Bs 99).
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedSucursal}
                        onChange={e => setSelectedSucursal(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                        <option value="TODAS">Todas las Sucursales</option>
                        {sucursales.map(s => {
                            const sId = s._id || s.id || '';
                            return (
                                <option key={sId} value={sId}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            );
                        })}
                    </select>

                    <button
                        onClick={() => setIsEgresoModalOpen(true)}
                        className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>Registrar Egreso</span>
                    </button>

                    <button
                        onClick={loadCaja}
                        disabled={isLoading}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                        title="Recargar balance"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">
                    {errorMsg}
                </div>
            )}

            {/* Tarjetas de Métricas de Caja Chica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Saldo Disponible en Fondo
                        </span>
                        <span className="text-3xl font-black text-amber-900">
                            Bs {cajaData ? cajaData.saldo_fondo_bs.toFixed(2) : '0.00'}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-1">
                            No mezclado con el arqueo regular de caja
                        </span>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Total Ingresos por Canjes
                        </span>
                        <span className="text-3xl font-black text-emerald-700">
                            Bs {cajaData ? cajaData.total_ingresos_bs.toFixed(2) : '0.00'}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                            Recaudado por aportes de clientes
                        </span>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ArrowDownRight className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Total Egresos / Retiros
                        </span>
                        <span className="text-3xl font-black text-rose-700">
                            Bs {cajaData ? cajaData.total_egresos_bs.toFixed(2) : '0.00'}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-1">
                            Retiros para reposición de tazas o insumos
                        </span>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Tabla de Movimientos del Fondo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm">
                        Libro de Movimientos del Fondo Momentos Taboada
                    </h4>
                    <span className="text-xs text-gray-500">
                        {cajaData?.movimientos.length || 0} movimientos registrados
                    </span>
                </div>

                {cajaData && cajaData.movimientos.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">Fecha & Hora</th>
                                    <th className="py-3 px-4">Sucursal</th>
                                    <th className="py-3 px-4">Tipo</th>
                                    <th className="py-3 px-4">Detalle / Concepto</th>
                                    <th className="py-3 px-4">Método</th>
                                    <th className="py-3 px-4 text-right">Monto</th>
                                    <th className="py-3 px-4">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cajaData.movimientos.map(m => (
                                    <tr key={m.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-4 font-medium text-gray-700">
                                            {new Date(m.fecha).toLocaleString('es-BO', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">
                                            {m.sucursal_nombre}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    m.tipo === 'INGRESO_CANJE'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}
                                            >
                                                {m.tipo === 'INGRESO_CANJE' ? 'Ingreso Canje' : 'Egreso'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-800 font-medium">
                                            {m.descripcion}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-600">
                                            {m.metodo_pago === 'QR' ? '📱 Pago QR' : '💵 Efectivo'}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-extrabold ${m.tipo === 'EGRESO_FONDO' ? 'text-rose-600' : 'text-emerald-700'}`}>
                                            {m.tipo === 'EGRESO_FONDO' ? '-' : '+'}{m.monto.toFixed(2)} Bs
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {m.usuario_nombre || 'Sistema'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-sm text-gray-400">
                        Aún no hay movimientos en la caja chica de la promoción.
                    </div>
                )}
            </div>

            {/* Modal de Registro de Egresos */}
            <RegistrarEgresoCajaModal
                isOpen={isEgresoModalOpen}
                onClose={() => setIsEgresoModalOpen(false)}
                sucursales={sucursales}
                defaultSucursalId={selectedSucursal === 'TODAS' ? undefined : selectedSucursal}
                onSuccess={() => {
                    loadCaja();
                }}
            />
        </div>
    );
};
