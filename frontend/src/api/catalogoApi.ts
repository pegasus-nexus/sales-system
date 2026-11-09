import { client, BASE_URL } from './client';
import { useAuthStore } from '../store/authStore';

export interface CatalogoRegisterRequest {
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    password: string;
    whatsapp?: string;
    slug?: string;
}

export interface CatalogoGoogleAuthRequest {
    credential: string;
    company_name?: string;
    whatsapp?: string;
}

export interface CatalogoAuthResponse {
    access_token: string;
    token_type: string;
    user_id: string;
    full_name: string;
    email: string;
    tenant_id: string;
    slug: string;
    business_name: string;
}

export interface CatalogoConfig {
    id: string;
    tenant_id: string;
    business_name: string;
    slug: string;
    description?: string | null;
    primary_color: string;
    secondary_color: string;
    logo_url?: string | null;
    banner_url?: string | null;
    whatsapp_number: string;
    whatsapp_message_template?: string | null;
    currency_symbol: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CatalogoProducto {
    id: string;
    tenant_id: string;
    title: string;
    description?: string | null;
    price: number;
    currency_symbol: string;
    images: string[];
    category: string;
    is_available: boolean;
    is_featured: boolean;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface PublicCatalogoResponse {
    config: CatalogoConfig;
    products: CatalogoProducto[];
    categories: string[];
}

export interface CatalogoProductoCreate {
    title: string;
    description?: string;
    price: number;
    currency_symbol?: string;
    images?: string[];
    category?: string;
    is_available?: boolean;
    is_featured?: boolean;
    order?: number;
}

export interface CatalogoProductoUpdate {
    title?: string;
    description?: string;
    price?: number;
    currency_symbol?: string;
    images?: string[];
    category?: string;
    is_available?: boolean;
    is_featured?: boolean;
    order?: number;
}

// ─── Authentication & Public ───────────────────────────────────────────

export async function registerCatalogo(data: CatalogoRegisterRequest): Promise<CatalogoAuthResponse> {
    return client<CatalogoAuthResponse>('/catalogo/register', {
        method: 'POST',
        body: data,
    });
}

export async function googleAuthCatalogo(data: CatalogoGoogleAuthRequest): Promise<CatalogoAuthResponse> {
    return client<CatalogoAuthResponse>('/catalogo/google-auth', {
        method: 'POST',
        body: data,
    });
}

export async function getPublicCatalog(slug: string): Promise<PublicCatalogoResponse> {
    return client<PublicCatalogoResponse>(`/catalogo/public/${encodeURIComponent(slug)}`, {
        method: 'GET',
    });
}

export async function checkEmailExists(email: string): Promise<boolean> {
    try {
        const res = await client<{ email: string; exists: boolean }>(`/catalogo/check-email/${encodeURIComponent(email)}`, {
            method: 'GET',
        });
        return Boolean(res.exists);
    } catch {
        return false;
    }
}

export async function checkSlugAvailability(slug: string): Promise<{ slug: string; available: boolean }> {
    return client<{ slug: string; available: boolean }>(`/catalogo/check-slug/${encodeURIComponent(slug)}`, {
        method: 'GET',
    });
}

// ─── Protected Management ─────────────────────────────────────────────

export async function getMyCatalogConfig(): Promise<CatalogoConfig> {
    return client<CatalogoConfig>('/catalogo/config', {
        method: 'GET',
    });
}

export async function updateMyCatalogConfig(data: Partial<CatalogoConfig>): Promise<CatalogoConfig> {
    return client<CatalogoConfig>('/catalogo/config', {
        method: 'PUT',
        body: data,
    });
}

export async function getMyCatalogProducts(): Promise<CatalogoProducto[]> {
    return client<CatalogoProducto[]>('/catalogo/productos', {
        method: 'GET',
    });
}

export async function createCatalogProduct(data: CatalogoProductoCreate): Promise<CatalogoProducto> {
    return client<CatalogoProducto>('/catalogo/productos', {
        method: 'POST',
        body: data,
    });
}

export async function updateCatalogProduct(productId: string, data: CatalogoProductoUpdate): Promise<CatalogoProducto> {
    return client<CatalogoProducto>(`/catalogo/productos/${productId}`, {
        method: 'PUT',
        body: data,
    });
}

export async function deleteCatalogProduct(productId: string): Promise<{ success: boolean; message: string }> {
    return client<{ success: boolean; message: string }>(`/catalogo/productos/${productId}`, {
        method: 'DELETE',
    });
}

export async function uploadCatalogImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Error al subir la imagen a la nube.');
    }

    const json = await response.json();
    return json.url;
}
