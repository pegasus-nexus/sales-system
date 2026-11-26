/**
 * Módulos a medida (custom modules) por tenant.
 *
 * Un módulo exclusivo de un cliente se habilita SOLO asignando su código en
 * `Tenant.modulos_activos` (lo hace el SUPERADMIN). Nunca por nombre, slug,
 * username, email ni id escrito a mano: esos datos los edita el propio tenant
 * o no escalan a nuevos clientes. El backend aplica la misma regla.
 */
export const MODULO_MOMENTOS_TABOADA = 'MOMENTOS_TABOADA';

export function hasCustomModule(
    modulo: string,
    role: string | null | undefined,
    modulosActivos: string[] | null | undefined,
): boolean {
    if (role === 'SUPERADMIN') return true;
    return Boolean(modulosActivos?.includes(modulo));
}

export function hasMomentosTaboada(
    role: string | null | undefined,
    modulosActivos: string[] | null | undefined,
): boolean {
    return hasCustomModule(MODULO_MOMENTOS_TABOADA, role, modulosActivos);
}
