import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAsientos, type AsientoContable } from '../../api/contabilidad';
import { FileSpreadsheet, Loader2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import Pagination from '../Pagination';

export default function LibroDiarioTab() {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [referenciaTipo, setReferenciaTipo] = useState<string>('TODOS');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['asientos-contables', fechaInicio, fechaFin, referenciaTipo, page],
    queryFn: () => getAsientos({
      fecha_inicio: fechaInicio ? `${fechaInicio}T00:00:00Z` : undefined,
      fecha_fin: fechaFin ? `${fechaFin}T23:59:59Z` : undefined,
      referencia_tipo: referenciaTipo === 'TODOS' ? undefined : referenciaTipo,
      page,
      limit: LIMIT
    })
  });

  const asientos = data?.items || [];
  const totalPages = data?.pages || 1;
  const totalItems = data?.total || 0;

  const formatBs = (num: number) => `Bs. ${num.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;

  const formatFecha = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha Inicio</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }} 
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
              onChange={(e) => { setFechaFin(e.target.value); setPage(1); }} 
              className="pl-10 pr-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tipo Operación</label>
          <select 
            value={referenciaTipo} 
            onChange={(e) => { setReferenciaTipo(e.target.value); setPage(1); }} 
            className="px-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="TODOS">Todas las operaciones</option>
            <option value="VENTA">Ventas POS</option>
            <option value="COMPRA">Compras de Mercadería</option>
            <option value="GASTO">Gastos de Caja</option>
          </select>
        </div>
      </div>

      {/* Lista de Asientos */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-sm text-gray-500">Cargando libro diario y asientos contables...</p>
          </div>
        ) : asientos.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-gray-200">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-base font-bold text-gray-700">No hay asientos contables en este período</p>
            <p className="text-xs text-gray-400 mt-1">Los asientos se generan automáticamente al confirmar ventas, compras o egresos de caja.</p>
          </div>
        ) : (
          asientos.map((asiento: AsientoContable) => {
            const cuadrado = Math.abs(asiento.total_debe - asiento.total_haber) < 0.01;

            return (
              <div key={asiento.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-mono font-bold text-xs rounded-lg">
                      Asiento #{asiento.numero}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {formatFecha(asiento.fecha)}
                    </span>
                    {asiento.referencia_tipo && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-full uppercase">
                        {asiento.referencia_tipo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {cuadrado ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} /> Balance Cuadrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <AlertCircle size={12} /> Descuadre
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-medium">Por: {asiento.creado_por || 'Sistema'}</span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">{asiento.descripcion}</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Cuenta Contable</th>
                          <th className="py-2 px-3">Glosa / Detalle</th>
                          <th className="py-2 px-3 text-right">Debe</th>
                          <th className="py-2 px-3 text-right">Haber</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {asiento.lineas.map((linea, lIdx) => (
                          <tr key={lIdx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-mono text-gray-600 font-semibold">{linea.cuenta_codigo}</td>
                            <td className="py-2 px-3 text-gray-900">{linea.cuenta_nombre}</td>
                            <td className="py-2 px-3 text-gray-500">{linea.descripcion || '-'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                              {linea.debe > 0 ? formatBs(linea.debe) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                              {linea.haber > 0 ? formatBs(linea.haber) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-black text-xs bg-gray-50/50">
                          <td colSpan={3} className="py-2 px-3 text-right text-gray-700 uppercase">Totales Asiento:</td>
                          <td className="py-2 px-3 text-right font-mono text-indigo-900">{formatBs(asiento.total_debe)}</td>
                          <td className="py-2 px-3 text-right font-mono text-indigo-900">{formatBs(asiento.total_haber)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {totalPages > 1 && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">Total: {totalItems} asientos contables</span>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
              totalItems={totalItems} 
              itemsPerPage={LIMIT} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
