import { client } from './client';

export interface LoteInventario {
  id: string;
  tenant_id: string;
  sucursal_id: string;
  almacen_id: string;
  producto_id: string;
  producto_nombre?: string;
  producto_codigo?: string;
  lote_codigo: string;
  fecha_vencimiento?: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  costo_unitario: number;
  estado: 'ACTIVO' | 'BLOQUEADO' | 'AGOTADO' | 'VENCIDO';
  dias_restantes?: number;
  estado_vencimiento: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'SIN_FECHA';
  proveedor_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface LotesPaginated {
  items: LoteInventario[];
  total: number;
  page: number;
  pages: number;
}

export interface LotesResumen {
  total_lotes_activos: number;
  total_unidades: number;
  por_vencer_30d: number;
  vencidos: number;
}

export interface GetLotesParams {
  sucursal_id?: string;
  almacen_id?: string;
  producto_id?: string;
  estado?: string;
  solo_vencidos?: boolean;
  por_vencer_dias?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const getLotes = (params: GetLotesParams = {}) => {
  const q = new URLSearchParams();
  if (params.sucursal_id && params.sucursal_id !== 'TODAS') q.append('sucursal_id', params.sucursal_id);
  if (params.almacen_id && params.almacen_id !== 'TODOS') q.append('almacen_id', params.almacen_id);
  if (params.producto_id) q.append('producto_id', params.producto_id);
  if (params.estado && params.estado !== 'TODOS') q.append('estado', params.estado);
  if (params.solo_vencidos) q.append('solo_vencidos', 'true');
  if (params.por_vencer_dias !== undefined) q.append('por_vencer_dias', String(params.por_vencer_dias));
  if (params.search) q.append('search', params.search);
  if (params.page) q.append('page', String(params.page));
  if (params.limit) q.append('limit', String(params.limit));

  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return client<LotesPaginated>(`/lotes${queryStr}`);
};

export const getResumenLotes = (sucursal_id?: string) => {
  const queryStr = sucursal_id && sucursal_id !== 'TODAS' ? `?sucursal_id=${encodeURIComponent(sucursal_id)}` : '';
  return client<LotesResumen>(`/lotes/resumen${queryStr}`);
};

export const cambiarEstadoLote = (loteId: string, nuevoEstado: string) => {
  return client<{ message: string; lote_id: string }>(
    `/lotes/${loteId}/estado?nuevo_estado=${encodeURIComponent(nuevoEstado)}`,
    { method: 'PUT' }
  );
};
