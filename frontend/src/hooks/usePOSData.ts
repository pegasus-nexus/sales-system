import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories, getUsers, getSucursales, getAlmacenes, getInventario } from '../api/api';
import { useDescuentos } from './useDescuentos';

export function usePOSData(sucursalId: string, almacenId: string) {
    const { data: productsData, isLoading: loadingP } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts(1, 1000),
        staleTime: 5 * 60 * 1000,
    });
    const products = productsData?.items || [];

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        staleTime: 10 * 60 * 1000,
    });

    const { data: descuentosDisponibles = [], isLoading: loadingD } = useDescuentos();

    const { data: usersData = [] } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
        staleTime: 10 * 60 * 1000,
    });

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales,
        staleTime: 10 * 60 * 1000,
    });

    const { data: almacenes = [] } = useQuery({
        queryKey: ['almacenes', sucursalId],
        queryFn: () => getAlmacenes(sucursalId),
        staleTime: 10 * 60 * 1000,
    });

    const vendedores = useMemo(() => {
        return usersData.filter(
            (u) =>
                u.is_active !== false &&
                (u.sucursal_id === sucursalId || u.sucursal_id === 'CENTRAL' || !u.sucursal_id) &&
                ['VENDEDOR', 'ADMIN_SUCURSAL', 'CAJERO'].includes(u.role)
        );
    }, [usersData, sucursalId]);

    const { data: invData } = useQuery({
        queryKey: ['inventario', sucursalId, almacenId],
        queryFn: () => getInventario(sucursalId, almacenId, 1, 1000),
        staleTime: 30_000,
    });

    const stockMap = useMemo(() => {
        const m: Record<string, number> = {};
        for (const i of invData?.items || []) m[i.producto_id] = i.cantidad;
        return m;
    }, [invData]);

    return {
        products,
        loadingP,
        categories,
        descuentosDisponibles,
        loadingD,
        usersData,
        vendedores,
        sucursales,
        almacenes,
        stockMap,
    };
}
