import React, { useState } from 'react';
import type { TenantSettings } from '../../api/types';
import { Copy, Check, Image as ImageIcon, Trash2, Sparkles, ExternalLink, ShieldCheck, Zap, Store, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginCustomizationTabProps {
    settings: TenantSettings;
    setSettings: React.Dispatch<React.SetStateAction<TenantSettings>>;
    slug: string;
    setSlug: (slug: string) => void;
    tenantName: string;
    onSave: () => void;
    isSaving: boolean;
}

const COLOR_PRESETS = [
    { name: 'Pegasus Indigo', primary: '#4f46e5', secondary: '#06b6d4' },
    { name: 'Odoo Blue', primary: '#2563eb', secondary: '#38bdf8' },
    { name: 'Emerald Forest', primary: '#059669', secondary: '#10b981' },
    { name: 'Purple Luxury', primary: '#7c3aed', secondary: '#ec4899' },
    { name: 'Ruby Enterprise', primary: '#e11d48', secondary: '#f97316' },
];

export const LoginCustomizationTab: React.FC<LoginCustomizationTabProps> = ({
    settings,
    setSettings,
    slug,
    setSlug,
    tenantName,
    onSave,
    isSaving,
}) => {
    const [copied, setCopied] = useState(false);

    const primaryColor = settings.login_primary_color || settings.brand_color || '#4f46e5';
    const secondaryColor = settings.login_secondary_color || '#06b6d4';
    const headline = settings.login_headline || `Potencia las operaciones de ${tenantName || 'tu empresa'}`;
    const description = settings.login_description || 'Control total en tiempo real: Punto de venta ágil, trazabilidad exacta de inventarios y reportes unificados.';
    const badgeText = settings.login_badge_text || 'Portal Corporativo Seguro';

    const loginUrl = `${window.location.origin}/login?tenant=${slug || 'empresa'}`;

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(loginUrl);
            setCopied(true);
            toast.success('¡Enlace de acceso copiado al portapapeles!');
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error('No se pudo copiar el enlace.');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setSettings((prev) => ({ ...prev, login_bg_image: base64 }));
            toast.success('Imagen de fondo cargada.');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setSettings((prev) => ({ ...prev, login_bg_image: undefined }));
        toast.info('Imagen de fondo eliminada.');
    };

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setSettings((prev) => ({
            ...prev,
            login_primary_color: preset.primary,
            login_secondary_color: preset.secondary,
        }));
    };

    return (
        <div className="space-y-8">
            {/* Banner de Información y Enlace Corporativo */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1">
                            <Sparkles className="w-4 h-4" />
                            <span>Enlace Único de Acceso Corporativo</span>
                        </div>
                        <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                            Comparte este enlace a tus empleados o sucursales. Al abrirlo, el sistema recordará automáticamente tu empresa y mostrará tu marca, colores y anuncios exclusivos.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyUrl}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
                        </button>
                        <a
                            href={loginUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs transition-all"
                            title="Probar en nueva pestaña"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Abrir</span>
                        </a>
                    </div>
                </div>

                {/* Input de Slug editable */}
                <div className="mt-4 pt-4 border-t border-indigo-100/80 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                        Identificador (Slug) en URL:
                    </label>
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <span className="text-xs text-gray-400 font-mono">/login?tenant=</span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="mi-empresa"
                            className="w-full text-xs font-mono font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Formulario de Controles */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Imagen de Fondo / Banner */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-indigo-600" />
                            <span>1. Foto o Banner del Panel Izquierdo</span>
                        </h3>
                        <p className="text-xs text-gray-500">
                            Sube una fotografía de tu negocio, tienda o fachada. Se adaptará automáticamente con un filtro profesional que garantiza legibilidad del texto.
                        </p>

                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold rounded-xl border border-gray-300 transition-colors">
                                <ImageIcon className="w-4 h-4" />
                                <span>{settings.login_bg_image ? 'Cambiar Imagen' : 'Subir Imagen (Máx 2MB)'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>

                            {settings.login_bg_image && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Quitar imagen</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Colores Corporativos */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900">2. Colores Corporativos</h3>
                        <p className="text-xs text-gray-500">
                            Afectan a las luces ambientales, los botones de acción y los acentos visuales de tu pantalla de acceso.
                        </p>

                        {/* Presets */}
                        <div className="flex items-center gap-2 flex-wrap pb-2">
                            <span className="text-xs text-gray-400 font-semibold">Paletas sugeridas:</span>
                            {COLOR_PRESETS.map((p) => (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-200 flex items-center gap-1.5 hover:border-gray-400 transition-all cursor-pointer"
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }} />
                                    <span className="text-gray-700">{p.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                    Color Primario
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, login_primary_color: e.target.value }))}
                                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, login_primary_color: e.target.value }))}
                                        className="text-xs font-mono font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2.5 w-full uppercase"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                    Color Secundario (Acento)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, login_secondary_color: e.target.value }))}
                                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, login_secondary_color: e.target.value }))}
                                        className="text-xs font-mono font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2.5 w-full uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Titular y Novedades */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900">3. Textos y Novedades</h3>

                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Etiqueta / Badge Superior
                            </label>
                            <input
                                type="text"
                                value={settings.login_badge_text || ''}
                                onChange={(e) => setSettings((prev) => ({ ...prev, login_badge_text: e.target.value }))}
                                placeholder="ej. Portal Corporativo Oficial"
                                className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Titular Principal
                            </label>
                            <input
                                type="text"
                                value={settings.login_headline || ''}
                                onChange={(e) => setSettings((prev) => ({ ...prev, login_headline: e.target.value }))}
                                placeholder={`ej. Bienvenidos al Portal de ${tenantName || 'tu empresa'}`}
                                className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Novedades / Comunicados / Eslogan
                            </label>
                            <textarea
                                rows={3}
                                value={settings.login_description || ''}
                                onChange={(e) => setSettings((prev) => ({ ...prev, login_description: e.target.value }))}
                                placeholder="ej. Informamos que el cierre de mes se realizará el viernes a las 18:00. Contacte a soporte si requiere asistencia."
                                className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Botón Guardar */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Personalización'}
                        </button>
                    </div>
                </div>

                {/* Previsualización en Vivo (Live Preview Mockup) */}
                <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Vista Previa en Vivo
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Panel Izquierdo</span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#07090e] p-6 text-white min-h-[460px] flex flex-col justify-between shadow-2xl">
                        {/* Fondo con imagen si existe */}
                        {settings.login_bg_image && (
                            <div
                                className="absolute inset-0 bg-cover bg-center z-0"
                                style={{ backgroundImage: `url(${settings.login_bg_image})` }}
                            />
                        )}

                        {/* Overlay */}
                        <div className={`absolute inset-0 z-0 ${settings.login_bg_image ? 'bg-gradient-to-br from-[#090d16]/90 via-[#07090e]/85 to-[#04060a]/95 backdrop-blur-[1px]' : ''}`} />

                        {/* Luces de ambiente en el mockup */}
                        <div
                            className="absolute top-[-20%] left-[-20%] w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-30 z-0"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <div
                            className="absolute bottom-[-20%] right-[-20%] w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-25 z-0"
                            style={{ backgroundColor: secondaryColor }}
                        />

                        {/* Mock Header */}
                        <div className="relative z-10 flex items-center gap-2.5">
                            {settings.logo_base64 ? (
                                <img
                                    src={settings.logo_base64}
                                    alt="Logo"
                                    className="h-8 w-auto max-w-[120px] object-contain rounded-lg p-0.5 bg-white/5 border border-white/10"
                                />
                            ) : (
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Zap className="w-4 h-4" />
                                </div>
                            )}
                            <div>
                                <span className="text-xs font-black tracking-tight block text-white">
                                    {tenantName || 'PEGASUS NEXUS'}
                                </span>
                                <span className="text-[8px] text-gray-400 uppercase tracking-widest block font-semibold">
                                    Portal Corporativo
                                </span>
                            </div>
                        </div>

                        {/* Mock Body */}
                        <div className="relative z-10 my-auto py-6">
                            <div
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold mb-3"
                                style={{
                                    backgroundColor: `${primaryColor}15`,
                                    borderColor: `${primaryColor}35`,
                                    color: '#e2e8f0'
                                }}
                            >
                                <ShieldCheck className="w-3 h-3" style={{ color: primaryColor }} />
                                <span>{badgeText}</span>
                            </div>

                            <h4 className="text-lg font-black tracking-tight leading-snug mb-2.5 text-white">
                                {headline}
                            </h4>

                            <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 mb-4">
                                {description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2">
                                    <Store className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                    <span className="font-bold text-white">POS Ultra Rápido</span>
                                </div>
                                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                                    <span className="font-bold text-white">Analítica & Kárdex</span>
                                </div>
                            </div>
                        </div>

                        {/* Mock Footer */}
                        <div className="relative z-10 text-[9px] text-gray-500 border-t border-white/5 pt-2 flex items-center justify-between">
                            <span>© 2026 {tenantName || 'SalesSystem'}</span>
                            <span>Versión 2.0 Cloud</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
