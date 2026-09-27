import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPlanCuentas, 
  seedPlanCuentas, 
  getEstadoResultados, 
  getBalanceGeneral, 
  getFlujoEfectivo 
} from '../api/contabilidad';
import { getSucursales } from '../api/api';
import { 
  BookOpen, 
  FileText, 
  Scale, 
  TrendingUp, 
  Play, 
  CheckCircle, 
  XCircle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const TAB_OPTIONS = [
  { id: 'plan', label: 'Plan de Cuentas', icon: BookOpen },
  { id: 'resultados', label: 'Estado de Resultados', icon: FileText },
  { id: 'balance', label: 'Balance General', icon: Scale },
  { id: 'flujo', label: 'Flujo de Efectivo', icon: TrendingUp },
] as const;

export default function ContabilidadPage() {
  const [activeTab, setActiveTab] = useState<string>('plan');
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [sucursalId, setSucursalId] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => getSucursales(false),
  });

  const { data: planCuentas, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['plan-cuentas'],
    queryFn: getPlanCuentas,
    enabled: activeTab === 'plan',
  });

  const { data: estadoResultados, isLoading: isLoadingResultados } = useQuery({
    queryKey: ['estado-resultados', fechaInicio, fechaFin, sucursalId],
    queryFn: () => getEstadoResultados(fechaInicio, fechaFin, sucursalId || undefined),
    enabled: activeTab === 'resultados',
  });

  const { data: balanceGeneral, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance-general', fechaCorte, sucursalId],
    queryFn: () => getBalanceGeneral(fechaCorte, sucursalId || undefined),
    enabled: activeTab === 'balance',
  });

  const { data: flujoEfectivo, isLoading: isLoadingFlujo } = useQuery({
    queryKey: ['flujo-efectivo', fechaInicio, fechaFin, sucursalId],
    queryFn: () => getFlujoEfectivo(fechaInicio, fechaFin, sucursalId || undefined),
    enabled: activeTab === 'flujo',
  });

  const seedMutation = useMutation({
    mutationFn: seedPlanCuentas,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['plan-cuentas'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al inicializar');
    }
  });

  const formatBs = (num: number) => `Bs. ${num.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;

  const renderFiltros = (showRango: boolean, showCorte: boolean) => (
    <div className="flex flex-wrap gap-4 items-end mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
      {showRango && (
        <>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                className="pl-10 pr-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                className="pl-10 pr-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>
        </>
      )}
      {showCorte && (
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha de Corte</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={fechaCorte} 
              onChange={(e) => setFechaCorte(e.target.value)} 
              className="pl-10 pr-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Sucursal</label>
        <select 
          value={sucursalId} 
          onChange={(e) => setSucursalId(e.target.value)} 
          className="px-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]"
        >
          <option value="">Todas las sucursales</option>
          {sucursales?.map(s => (
            <option key={s._id} value={s._id}>{s.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f2f4f7] p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-indigo-600" size={32} />
            Contabilidad
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestión contable y reportes financieros</p>
        </div>
        
        {activeTab === 'plan' && (!planCuentas || planCuentas.length === 0) && (
          <button 
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Play size={16} />
            {seedMutation.isPending ? 'Inicializando...' : 'Inicializar Plan de Cuentas'}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {TAB_OPTIONS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plan' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Estructura de Cuentas</h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
              {planCuentas?.length || 0} cuentas
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            {isLoadingPlan ? (
              <p className="text-center text-gray-500 py-10">Cargando...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                    <th className="pb-3 font-bold">Código</th>
                    <th className="pb-3 font-bold">Nombre</th>
                    <th className="pb-3 font-bold">Tipo</th>
                    <th className="pb-3 font-bold">Naturaleza</th>
                    <th className="pb-3 font-bold text-right">Saldo Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {planCuentas?.map(cuenta => (
                    <tr key={cuenta._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-mono text-xs text-gray-500 whitespace-nowrap" style={{ paddingLeft: `${(cuenta.nivel - 1) * 20}px` }}>
                        {cuenta.codigo}
                      </td>
                      <td className={`py-3 ${cuenta.es_cuenta_de_detalle ? 'text-gray-900' : 'font-bold text-gray-900'}`} style={{ paddingLeft: `${(cuenta.nivel - 1) * 20}px` }}>
                        {cuenta.nombre}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                          {cuenta.tipo}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">{cuenta.naturaleza}</td>
                      <td className={`py-3 text-right font-mono ${cuenta.saldo_actual !== 0 ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                        {formatBs(cuenta.saldo_actual)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'resultados' && (
        <div className="flex flex-col gap-6">
          {renderFiltros(true, false)}
          {isLoadingResultados ? (
             <p className="text-center text-gray-500 py-10">Cargando...</p>
          ) : estadoResultados ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto w-full">
              <h2 className="text-2xl font-black text-gray-900 text-center mb-6">Estado de Resultados</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Ventas Brutas</span>
                  <span className="font-mono">{formatBs(estadoResultados.ventas_brutas)}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span>(-) Descuentos</span>
                  <span className="font-mono">{formatBs(estadoResultados.descuentos)}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span>(-) Anulaciones</span>
                  <span className="font-mono">{formatBs(estadoResultados.anulaciones)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                  <span>= Ventas Netas</span>
                  <span className="font-mono">{formatBs(estadoResultados.ventas_netas)}</span>
                </div>
                <div className="flex justify-between items-center text-red-500 mt-4">
                  <span>(-) Costo de Ventas</span>
                  <span className="font-mono">{formatBs(estadoResultados.costo_ventas)}</span>
                </div>
                <div className={`flex justify-between items-center font-bold pt-3 border-t border-gray-200 text-base ${estadoResultados.utilidad_bruta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>= Utilidad Bruta</span>
                  <span className="font-mono">{formatBs(estadoResultados.utilidad_bruta)}</span>
                </div>
                <div className="flex justify-between items-center text-red-500 mt-4">
                  <span>(-) Gastos Operativos</span>
                  <span className="font-mono">{formatBs(estadoResultados.gastos_operativos)}</span>
                </div>
                <div className={`flex justify-between items-center font-black pt-4 border-t-2 border-gray-900 text-xl mt-4 ${estadoResultados.utilidad_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>= Utilidad Neta</span>
                  <span className="font-mono">{formatBs(estadoResultados.utilidad_neta)}</span>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 justify-center">
                  <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 flex flex-col items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase mb-1">Margen Bruto</span>
                    <span className="text-lg font-black text-gray-900">{estadoResultados.margen_bruto_pct.toFixed(2)}%</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 flex flex-col items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase mb-1">Margen Neto</span>
                    <span className="text-lg font-black text-gray-900">{estadoResultados.margen_neto_pct.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'balance' && (
        <div className="flex flex-col gap-6">
          {renderFiltros(false, true)}
          {isLoadingBalance ? (
             <p className="text-center text-gray-500 py-10">Cargando...</p>
          ) : balanceGeneral ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-5xl mx-auto w-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">Balance General</h2>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${balanceGeneral.ecuacion_contable_ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {balanceGeneral.ecuacion_contable_ok ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  Ecuación Contable: {balanceGeneral.ecuacion_contable_ok ? 'Cuadra' : 'No Cuadra'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">ACTIVOS</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efectivo (Cajas)</span>
                      <span className="font-mono">{formatBs(balanceGeneral.activos.efectivo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cuentas por Cobrar</span>
                      <span className="font-mono">{formatBs(balanceGeneral.activos.cuentas_cobrar)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inventario Valorado</span>
                      <span className="font-mono">{formatBs(balanceGeneral.activos.inventario)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                      <span>Total Activos</span>
                      <span className="font-mono">{formatBs(balanceGeneral.activos.total)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">PASIVOS</h3>
                  <div className="space-y-3 text-sm mb-8">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cuentas por Pagar</span>
                      <span className="font-mono">{formatBs(balanceGeneral.pasivos.cuentas_pagar)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                      <span>Total Pasivos</span>
                      <span className="font-mono">{formatBs(balanceGeneral.pasivos.total)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">PATRIMONIO</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capital</span>
                      <span className="font-mono">{formatBs(balanceGeneral.patrimonio.capital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resultados Acumulados</span>
                      <span className="font-mono">{formatBs(balanceGeneral.patrimonio.resultados_acumulados)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                      <span>Total Patrimonio</span>
                      <span className="font-mono">{formatBs(balanceGeneral.patrimonio.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'flujo' && (
        <div className="flex flex-col gap-6">
          {renderFiltros(true, false)}
          {isLoadingFlujo ? (
             <p className="text-center text-gray-500 py-10">Cargando...</p>
          ) : flujoEfectivo ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto w-full">
              <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Estado de Flujo de Efectivo</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">1. Actividades Operativas</h3>
                  <div className="space-y-3 text-sm pl-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cobros por Ventas</span>
                      <span className="font-mono text-green-600">{formatBs(flujoEfectivo.operativas.cobros_ventas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cobros de Créditos</span>
                      <span className="font-mono text-green-600">{formatBs(flujoEfectivo.operativas.cobros_creditos)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagos a Proveedores</span>
                      <span className="font-mono text-red-500">({formatBs(flujoEfectivo.operativas.pagos_proveedores)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gastos Operativos</span>
                      <span className="font-mono text-red-500">({formatBs(flujoEfectivo.operativas.gastos_operativos)})</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                      <span>Flujo Neto Operativo</span>
                      <span className="font-mono">{formatBs(flujoEfectivo.operativas.flujo_neto)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">2. Actividades de Inversión</h3>
                  <div className="space-y-3 text-sm pl-4">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Flujo Neto de Inversión</span>
                      <span className="font-mono">{formatBs(flujoEfectivo.inversion.total)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">3. Actividades de Financiamiento</h3>
                  <div className="space-y-3 text-sm pl-4">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Flujo Neto de Financiamiento</span>
                      <span className="font-mono">{formatBs(flujoEfectivo.financiamiento.total)}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex justify-between items-center font-black pt-6 border-t-2 border-gray-900 text-xl mt-4 ${flujoEfectivo.variacion_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Variación Neta de Efectivo</span>
                  <span className="font-mono">{formatBs(flujoEfectivo.variacion_neta)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
