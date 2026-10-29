import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Zap, BarChart3, Store, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../api/client';
import { getLoginBranding } from '../api/api';
import type { LoginBrandingResponse } from '../api/types';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Branding State
    const [branding, setBranding] = useState<LoginBrandingResponse | null>(null);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    // 1. Detección automática del Tenant (Opción A: Query Param > Subdominio > LocalStorage)
    useEffect(() => {
        const detectAndFetchBranding = async () => {
            try {
                let detectedSlug: string | null = null;

                // A. Prioridad 1: Query param en URL (?tenant=taboada o ?slug=taboada)
                const params = new URLSearchParams(window.location.search);
                const querySlug = params.get('tenant') || params.get('slug');
                if (querySlug && querySlug.trim()) {
                    detectedSlug = querySlug.trim();
                }

                // B. Prioridad 2: Subdominio (ej. taboada.pegasus-nexus.com o taboada.localhost)
                if (!detectedSlug) {
                    const hostnameParts = window.location.hostname.split('.');
                    if (hostnameParts.length > 2) {
                        const sub = hostnameParts[0].toLowerCase();
                        if (!['app', 'www', 'api', 'admin', 'localhost', 'portal'].includes(sub)) {
                            detectedSlug = sub;
                        }
                    }
                }

                // C. Prioridad 3: Último tenant recordado en este navegador
                if (!detectedSlug) {
                    const savedSlug = localStorage.getItem('pegasus_last_tenant_slug');
                    if (savedSlug && savedSlug.trim()) {
                        detectedSlug = savedSlug.trim();
                    }
                }

                if (detectedSlug) {
                    const data = await getLoginBranding(detectedSlug);
                    if (data && data.custom_branding) {
                        setBranding(data);
                        // Persistir para próximas visitas
                        if (data.tenant_slug) {
                            localStorage.setItem('pegasus_last_tenant_slug', data.tenant_slug);
                        }
                    }
                }
            } catch {
                // Fallback silencioso a diseño por defecto de Pegasus
            }
        };

        detectAndFetchBranding();
    }, []);

    const handleClearTenant = () => {
        localStorage.removeItem('pegasus_last_tenant_slug');
        setBranding(null);
        // Limpiar URL si tenía parámetros
        if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Obtener Token
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${BASE_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Usuario o contraseña incorrectos');
            }

            const data = await response.json();
            const token = data.access_token;

            // 2. Obtener datos del usuario
            const userResponse = await fetch(`${BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!userResponse.ok) {
                throw new Error('Error al obtener datos del usuario');
            }

            const userData = await userResponse.json();

            // 3. Actualizar estado y redirigir
            login(token, userData);
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error de autenticación';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Colores dinámicos para estilizar panel y botones
    const primaryColor = branding?.primary_color || '#6366f1';
    const secondaryColor = branding?.secondary_color || '#10b981';

    return (
        <div className="min-h-screen bg-[#07090e] flex flex-col lg:flex-row relative overflow-hidden font-sans">
            {/* ── PANEL IZQUIERDO: Branding & Presentación (Desktop) ── */}
            <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 xl:p-16 border-r border-white/10 overflow-hidden bg-gradient-to-br from-[#090d16] via-[#07090e] to-[#04060a]">
                {/* Fondo personalizado con imagen (si fue configurada por el tenant) */}
                {branding?.login_bg_image && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
                        style={{ backgroundImage: `url(${branding.login_bg_image})` }}
                    />
                )}

                {/* Overlay oscuro para garantizar contraste y legibilidad absoluta */}
                <div className={`absolute inset-0 z-0 ${branding?.login_bg_image ? 'bg-gradient-to-br from-[#090d16]/92 via-[#07090e]/88 to-[#04060a]/95 backdrop-blur-[1px]' : ''}`} />

                {/* Luces de ambiente sutiles con colores de la marca */}
                <div
                    className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-25 z-0"
                    style={{ backgroundColor: primaryColor }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-20 z-0"
                    style={{ backgroundColor: secondaryColor }}
                />

                {/* Encabezado Logo */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {branding?.logo_url ? (
                            <img
                                src={branding.logo_url}
                                alt={branding.tenant_name}
                                className="h-12 w-auto max-w-[200px] object-contain rounded-xl p-1 bg-white/5 border border-white/10 shadow-lg"
                            />
                        ) : (
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg border"
                                style={{
                                    backgroundColor: `${primaryColor}25`,
                                    borderColor: `${primaryColor}40`,
                                    boxShadow: `0 10px 25px -5px ${primaryColor}30`
                                }}
                            >
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div>
                            <span className="text-xl font-black text-white tracking-tight">
                                {branding?.tenant_name || (
                                    <>PEGASUS <span className="text-indigo-400">NEXUS</span></>
                                )}
                            </span>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                                {branding?.custom_branding ? 'Portal Corporativo Autorizado' : 'Retail & Enterprise ERP'}
                            </span>
                        </div>
                    </div>

                    {/* Botón para cambiar o salir del tenant actual */}
                    {branding?.custom_branding && (
                        <button
                            type="button"
                            onClick={handleClearTenant}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                            title="Cambiar a Pegasus genérico u otra empresa"
                        >
                            <RefreshCw className="w-3 h-3" />
                            <span>Cambiar empresa</span>
                        </button>
                    )}
                </div>

                {/* Cuerpo del Mensaje Central */}
                <div className="relative z-10 max-w-lg my-auto py-12">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 transition-all"
                        style={{
                            backgroundColor: `${primaryColor}15`,
                            borderColor: `${primaryColor}35`,
                            color: '#e2e8f0'
                        }}
                    >
                        <ShieldCheck className="w-4 h-4" style={{ color: primaryColor }} />
                        {branding?.badge_text || 'Plataforma Segura Multi-Sucursal'}
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] mb-6">
                        {branding?.headline ? (
                            branding.headline
                        ) : (
                            <>
                                Potencia tus operaciones retail con{' '}
                                <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                                    velocidad y precisión
                                </span>.
                            </>
                        )}
                    </h1>

                    <p className="text-gray-300 text-base leading-relaxed mb-8 whitespace-pre-line">
                        {branding?.description ||
                            'Control total en tiempo real: Punto de venta ágil, trazabilidad exacta de inventarios, reportes inteligentes y cotizaciones B2B unificadas.'}
                    </p>

                    {/* Características clave */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                            <div
                                className="p-2 rounded-lg shrink-0"
                                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                            >
                                <Store className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">POS Ultra Rápido</h4>
                                <p className="text-[11px] text-gray-400">Cobros fluidos con tickets y QR.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                            <div
                                className="p-2 rounded-lg shrink-0"
                                style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
                            >
                                <BarChart3 className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Analítica & Kárdex</h4>
                                <p className="text-[11px] text-gray-400">Stock auditado y márgenes reales.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer del panel izquierdo */}
                <div className="relative z-10 flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-6">
                    <span>© 2026 {branding?.tenant_name || 'Pegasus SalesSystem'}</span>
                    <span>Versión 2.0 • Cloud High Performance</span>
                </div>
            </div>

            {/* ── PANEL DERECHO: Formulario de Acceso ── */}
            <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-10 relative z-10 my-auto min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-md bg-[#0f131c]/90 border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl relative"
                >
                    {/* Header para Mobile con Logo o Nombre */}
                    <div className="lg:hidden flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            {branding?.logo_url ? (
                                <img
                                    src={branding.logo_url}
                                    alt={branding.tenant_name}
                                    className="h-9 w-auto max-w-[140px] object-contain rounded-lg"
                                />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div>
                                <span className="text-lg font-black text-white">
                                    {branding?.tenant_name || 'PEGASUS'}
                                </span>
                                <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                                    {branding?.custom_branding ? 'Portal Corporativo' : 'Retail ERP'}
                                </span>
                            </div>
                        </div>

                        {branding?.custom_branding && (
                            <button
                                type="button"
                                onClick={handleClearTenant}
                                className="text-xs text-gray-400 hover:text-white p-2 rounded-lg bg-white/5"
                                title="Cambiar empresa"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión</h2>
                            {branding?.custom_branding && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                    {branding.tenant_name}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1.5">
                            Ingresa tus credenciales corporativas para acceder.
                        </p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-semibold text-center overflow-hidden"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-300 tracking-wide block">
                                Usuario o Correo
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#181d29] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all text-sm font-medium hover:border-white/20"
                                    placeholder="ej. administrador o correo"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-300 tracking-wide block">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#181d29] border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all text-sm font-medium hover:border-white/20"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                boxShadow: `0 10px 25px -5px ${primaryColor}50`
                            }}
                            className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-60 cursor-pointer hover:brightness-110"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Verificando acceso...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ingresar al Sistema</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-gray-400">
                            ¿Necesitas ayuda con tu cuenta?{' '}
                            <a
                                href="https://wa.me/59170000000"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold hover:underline transition-colors"
                                style={{ color: primaryColor }}
                            >
                                Contactar a Soporte
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
