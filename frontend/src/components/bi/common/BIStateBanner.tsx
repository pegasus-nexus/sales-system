import React from 'react';
import { AlertCircle, Sparkles, RefreshCw, CalendarX } from 'lucide-react';

export type BIStateType = 'REAL_DATA' | 'NO_ACTIVITY' | 'LOADING' | 'API_ERROR' | 'FEATURE_COMING_SOON';

interface BIStateBannerProps {
  type: BIStateType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  dateRange?: string;
}

export const BIStateBanner: React.FC<BIStateBannerProps> = ({
  type,
  title,
  message,
  onRetry,
  dateRange
}) => {
  if (type === 'REAL_DATA') {
    return null;
  }

  if (type === 'LOADING') {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-900/50 border border-slate-800 rounded-xl my-4 animate-pulse">
        <div className="flex items-center gap-3 text-blue-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Cargando métricas analíticas conciliadas...</span>
        </div>
      </div>
    );
  }

  if (type === 'NO_ACTIVITY') {
    return (
      <div className="flex items-start gap-3.5 p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl my-4 text-slate-300">
        <div className="p-2 bg-blue-950/60 text-blue-400 rounded-lg border border-blue-800/50 shrink-0">
          <CalendarX className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            {title || 'Sin registros de ventas en la fecha seleccionada'}
            <span className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded border border-blue-700/50 font-normal">
              200 OK - Período Válido
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {message || `No se detectaron transacciones emitidas por el POS para el rango ${dateRange || 'seleccionado'}. La base de datos responde correctamente con Bs. 0.00 en total.`}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'API_ERROR') {
    return (
      <div className="flex items-start gap-3.5 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl my-4 text-rose-200">
        <div className="p-2 bg-rose-900/60 text-rose-300 rounded-lg border border-rose-700/50 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-100 flex items-center gap-2">
            {title || 'Error de comunicación con el servidor BI'}
            <span className="text-xs px-2 py-0.5 bg-rose-900/60 text-rose-300 rounded border border-rose-700/50 font-normal">
              Conexión Interrumpida
            </span>
          </h4>
          <p className="text-xs text-rose-300/80 mt-1">
            {message || 'No fue posible conectar con el servidor para extraer las métricas de MongoDB. Verifica tu conexión a internet o el backend.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar Consulta
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'FEATURE_COMING_SOON') {
    return (
      <div className="flex items-start gap-3.5 p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl my-4 text-indigo-200">
        <div className="p-2 bg-indigo-900/50 text-indigo-300 rounded-lg border border-indigo-700/50 shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-indigo-100 flex items-center gap-2">
            {title || 'Métrica predictiva de IA / ML'}
            <span className="text-xs px-2 py-0.5 bg-indigo-900/60 text-indigo-300 rounded border border-indigo-700/50 font-medium">
              Disponible Próximamente
            </span>
          </h4>
          <p className="text-xs text-indigo-300/80 mt-1">
            {message || 'Esta funcionalidad analítica de inteligencia artificial y modelo predictivo avanzado se habilitará en una fase posterior sin generar estimaciones ficticias.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
