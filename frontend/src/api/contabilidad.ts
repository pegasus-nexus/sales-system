import { client } from './client';

// Types
export interface CuentaContable {
  _id: string;
  tenant_id: string;
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'COSTO' | 'GASTO';
  naturaleza: 'DEUDORA' | 'ACREEDORA';
  padre_id: string | null;
  nivel: number;
  es_cuenta_de_detalle: boolean;
  descripcion: string | null;
  saldo_actual: number;
  is_active: boolean;
  created_at: string;
}

export interface EstadoResultados {
  periodo: { inicio: string; fin: string };
  ventas_brutas: number;
  descuentos: number;
  anulaciones: number;
  ventas_netas: number;
  costo_ventas: number;
  utilidad_bruta: number;
  gastos_operativos: number;
  utilidad_operativa: number;
  utilidad_neta: number;
  margen_bruto_pct: number;
  margen_neto_pct: number;
}

export interface BalanceGeneral {
  fecha_corte: string;
  activos: {
    efectivo: number;
    cuentas_cobrar: number;
    inventario: number;
    total: number;
  };
  pasivos: {
    cuentas_pagar: number;
    total: number;
  };
  patrimonio: {
    capital: number;
    resultados_acumulados: number;
    total: number;
  };
  ecuacion_contable_ok: boolean;
}

export interface FlujoEfectivo {
  periodo: { inicio: string; fin: string };
  operativas: {
    cobros_ventas: number;
    cobros_creditos: number;
    pagos_proveedores: number;
    gastos_operativos: number;
    flujo_neto: number;
  };
  inversion: { total: number };
  financiamiento: { total: number };
  variacion_neta: number;
}

// API functions
export const getPlanCuentas = () => client<CuentaContable[]>('/contabilidad/plan-cuentas');
export const seedPlanCuentas = () => client<{ message: string; total: number }>('/contabilidad/plan-cuentas/seed', { method: 'POST' });
export const createCuenta = (data: Partial<CuentaContable>) => client<CuentaContable>('/contabilidad/cuentas', { method: 'POST', body: data });
export const updateCuenta = (id: string, data: Partial<CuentaContable>) => client<CuentaContable>(`/contabilidad/cuentas/${id}`, { method: 'PUT', body: data });

export const getEstadoResultados = (fechaInicio: string, fechaFin: string, sucursalId?: string) => {
  const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
  if (sucursalId) params.append('sucursal_id', sucursalId);
  return client<EstadoResultados>(`/contabilidad/estado-resultados?${params}`);
};

export const getBalanceGeneral = (fechaCorte: string, sucursalId?: string) => {
  const params = new URLSearchParams({ fecha_corte: fechaCorte });
  if (sucursalId) params.append('sucursal_id', sucursalId);
  return client<BalanceGeneral>(`/contabilidad/balance-general?${params}`);
};

export const getFlujoEfectivo = (fechaInicio: string, fechaFin: string, sucursalId?: string) => {
  const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
  if (sucursalId) params.append('sucursal_id', sucursalId);
  return client<FlujoEfectivo>(`/contabilidad/flujo-efectivo?${params}`);
};
