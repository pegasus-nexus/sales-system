import api from './axios';

export interface Cliente {
    _id: string;
    nombre: string;
    telefono?: string;
    email?: string;
    nit_ci?: string;
    direccion?: string;
    notas?: string;
    lista_precio_id?: string;
    total_compras: number;
    cantidad_compras: number;
    ultima_compra_at?: string;
    is_active: boolean;
    created_at: string;
}

export const getClientes = async (page: number = 1, limit: number = 50, q: string = '') => {
    // API pagination uses skip, but let's map it based on page
    const skip = (page - 1) * limit;
    const { data } = await api.get<Cliente[]>('/clientes', { params: { skip, limit, q } });
    return data;
};

export const createCliente = async (cliente: Partial<Cliente>) => {
    const { data } = await api.post<Cliente>('/clientes', cliente);
    return data;
};

export const updateCliente = async ({ id, data }: { id: string; data: Partial<Cliente> }) => {
    const response = await api.put<Cliente>(`/clientes/${id}`, data);
    return response.data;
};

export const deleteCliente = async (id: string) => {
    const { data } = await api.delete(`/clientes/${id}`);
    return data;
};
