import api from './client';

export interface TrasladoItemCreate {
    producto_id: string;
    cantidad: number;
}

export interface TrasladoCreate {
    sucursal_destino_id: string;
    notas?: string;
    items: TrasladoItemCreate[];
}

export interface TrasladoItemReceive {
    producto_id: string;
    cantidad_recibida: number;
}

export interface TrasladoReceive {
    notas?: string;
    items: TrasladoItemReceive[];
}

export const despacharTraslado = async (data: TrasladoCreate) => {
    const response = await api.post('/traslados/', data);
    return response.data;
};

export const recibirTraslado = async (trasladoId: string, data: TrasladoReceive) => {
    const response = await api.post(`/traslados/${trasladoId}/recibir`, data);
    return response.data;
};

export const cancelarTraslado = async (trasladoId: string) => {
    const response = await api.post(`/traslados/${trasladoId}/cancelar`);
    return response.data;
};

export const getTraslados = async (params: { tipo: 'enviados' | 'recibidos' | 'todos', estado?: string, page?: number, page_size?: number }) => {
    const response = await api.get('/traslados/', { params });
    return response.data;
};

export const getTrasladoById = async (trasladoId: string) => {
    const response = await api.get(`/traslados/${trasladoId}`);
    return response.data;
};
