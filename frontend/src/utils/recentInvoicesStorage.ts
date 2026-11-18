export interface RecentInvoiceEntry {
    id: string;
    timestamp: number; // Date.now()
    razon_social: string;
    nit?: string;
    telefono?: string;
    email?: string;
    es_factura: boolean;
    is_miembro_comunidad?: boolean;
    ticket_id?: string;
    ticket_corto?: string;
    total?: number;
    motivo?: 'VENTA_COMPLETADA' | 'CLIENTE_LIMPIADO' | 'CLIENTE_INGRESADO';
}

const STORAGE_KEY = 'pos_recent_invoices_trash_v1';
const MAX_ENTRIES = 25;

export function getRecentInvoices(): RecentInvoiceEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch {
        return [];
    }
}

export function saveRecentInvoice(data: Omit<RecentInvoiceEntry, 'id' | 'timestamp'>): RecentInvoiceEntry[] {
    try {
        // Ignorar si no tiene ni nombre ni nit ni teléfono
        const nom = (data.razon_social || '').trim();
        const nit = (data.nit || '').trim();
        const tel = (data.telefono || '').trim();

        if (!nom && !nit && !tel) {
            return getRecentInvoices();
        }

        const current = getRecentInvoices();
        
        // Evitar duplicados idénticos consecutivos recientes
        const isDuplicate = current.length > 0 && 
            current[0].nit === nit && 
            current[0].razon_social.toUpperCase() === nom.toUpperCase() &&
            current[0].telefono === tel;

        if (isDuplicate) {
            return current;
        }

        const newEntry: RecentInvoiceEntry = {
            ...data,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: Date.now(),
            razon_social: nom || 'SIN NOMBRE',
            nit: nit || undefined,
            telefono: tel || undefined,
            email: data.email?.trim() || undefined,
        };

        const updated = [newEntry, ...current].slice(0, MAX_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        
        // Disparar evento para que cualquier componente suscrito se actualice
        window.dispatchEvent(new CustomEvent('pos_recent_invoices_updated'));
        return updated;
    } catch {
        return [];
    }
}

export function removeRecentInvoice(id: string): RecentInvoiceEntry[] {
    try {
        const current = getRecentInvoices();
        const updated = current.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('pos_recent_invoices_updated'));
        return updated;
    } catch {
        return [];
    }
}

export function clearRecentInvoices(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('pos_recent_invoices_updated'));
    } catch {
        // ignore
    }
}
