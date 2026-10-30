import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BranchOption {
    id: string;
    nombre: string;
    ciudad?: string;
    direccion?: string;
    is_active?: boolean;
}

interface BranchState {
    activeSucursalId: string | null; // null = 'all' (Consolidado Matriz)
    activeSucursalName: string;
    setActiveBranch: (id: string | null, name?: string) => void;
}

export const useBranchStore = create<BranchState>()(
    persist(
        (set) => ({
            activeSucursalId: null,
            activeSucursalName: 'Todas las Sucursales',
            setActiveBranch: (id: string | null, name?: string) => {
                const isAll = !id || id === 'all' || id === 'null';
                set({
                    activeSucursalId: isAll ? null : id,
                    activeSucursalName: isAll ? 'Todas las Sucursales' : (name || 'Sucursal Seleccionada'),
                });
            },
        }),
        {
            name: 'pegasus-branch-context',
        }
    )
);
