import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, ArrowRight, Loader2, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../api/client';
import { getLoginBranding } from '../api/api';
import type { LoginBrandingResponse } from '../api/types';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Branding State
    const [branding, setBranding] = useState<LoginBrandingResponse | null>(null);
    const [systemOnline, setSystemOnline] = useState(true);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // 1. Cargar usuario recordado (si existe) y detectar tenant
    useEffect(() => {
        // Cargar usuario guardado con amor para agilizar el trabajo diario de cajeros
        const savedUser = localStorage.getItem('pegasus_remembered_username');
        if (savedUser) {
            setUsername(savedUser);
            setRememberMe(true);
        }

        const detectAndFetchBranding = async () => {
            try {
                let detectedSlug: string | null = null;

                // Prioridad 1: Query param en URL (?tenant=taboada o ?slug=taboada)
                const params = new URLSearchParams(window.location.search);
                const querySlug = params.get('tenant') || params.get('slug');
                if (querySlug && querySlug.trim()) {
                    detectedSlug = querySlug.trim();
                }

                // Prioridad 2: Subdominio (ej. taboada.pegasus-nexus.com)
                if (!detectedSlug) {
                    const hostnameParts = window.location.hostname.split('.');
                    if (hostnameParts.length > 2) {
                        const sub = hostnameParts[0].toLowerCase();
                        if (!['app', 'www', 'api', 'admin', 'localhost', 'portal'].includes(sub)) {
                            detectedSlug = sub;
                        }
                    }
                }

                // Prioridad 3: Último tenant recordado en este navegador
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
                        if (data.tenant_slug) {
                            localStorage.setItem('pegasus_last_tenant_slug', data.tenant_slug);
                        }
                    }
                }
                setSystemOnline(true);
            } catch {
                // Si la llamada falla, el sistema sigue funcionando con branding de Pegasus Nexus
                setSystemOnline(true);
            }
        };

        detectAndFetchBranding();
    }, []);

    // 2. Detección en tiempo real de Bloq Mayús (Caps Lock)
    const handleKeyModifierCheck = (e: React.KeyboardEvent) => {
        if (typeof e.getModifierState === 'function') {
            setCapsLockActive(e.getModifierState('CapsLock'));
        }
    };

    const handleClearTenant = () => {
        localStorage.removeItem('pegasus_last_tenant_slug');
        setBranding(null);
        if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    };

    const handleClearRememberedUser = () => {
        localStorage.removeItem('pegasus_remembered_username');
        setUsername('');
        setRememberMe(false);
    };

    // 3. Envío de credenciales con Timeout seguro (10 segundos)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // Guardar o limpiar usuario recordado
            if (rememberMe && username.trim()) {
                localStorage.setItem('pegasus_remembered_username', username.trim());
            } else {
                localStorage.removeItem('pegasus_remembered_username');
            }

            // A. Obtener Token
            const formData = new URLSearchParams();
            formData.append('username', username.trim());
            formData.append('password', password);

            const response = await fetch(`${BASE_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
                signal: controller.signal,
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 400) {
                    throw new Error('Usuario o contraseña incorrectos. Revisa tus datos e intenta de nuevo.');
                }
                throw new Error(`Error en el servidor de autenticación (Código ${response.status}).`);
            }

            const data = await response.json();
            const token = data.access_token;

            // B. Obtener Perfil del Usuario
            const userResponse = await fetch(`${BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal,
            });

            if (!userResponse.ok) {
                throw new Error('Sesión iniciada, pero no se pudo cargar el perfil del usuario.');
            }

            const userData = await userResponse.json();

            // C. Iniciar sesión y enrutar
            login(token, userData);
            if (userData.role === 'SUPERADMIN' || userData.role === 'SUPERADMIN_STAFF') {
                navigate('/admin');
            } else if (userData.role === 'CATALOGO_MERCHANT') {
                navigate('/catalogo/admin');
            } else {
                navigate('/');
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                setError('Tiempo de espera agotado. Verifica tu conexión a internet e intenta nuevamente.');
            } else {
                const message = err instanceof Error ? err.message : 'Error inesperado al iniciar sesión.';
                setError(message);
            }
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    };

    // Paleta cósmica adaptativa: Si el tenant tiene color propio (ej. Chocolates Taboada),
    // se armoniza con el diseño sin perder la elegancia astronómica.
    const accentColor = branding?.primary_color || '#38bdf8'; // Starlight Sky
    const secondaryColor = branding?.secondary_color || '#f1e5c6'; // Pale Starlight Gold

    return (
        <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">
            {/* ── MAPA CELESTE DE FONDO (SVG ligero < 3KB, sin consumo de GPU ni animaciones pesadas) ── */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <defs>
                        <radialGradient id="celestialGlow" cx="25%" cy="35%" r="65%">
                            <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
                            <stop offset="60%" stopColor="#0B132B" stopOpacity="0.04" />
                            <stop offset="100%" stopColor="#06080F" stopOpacity="0" />
                        </radialGradient>
                        <pattern id="celestialGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                            <circle cx="40" cy="40" r="0.65" fill="#94A3B8" opacity="0.3" />
                            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#334155" strokeWidth="0.35" opacity="0.25" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#celestialGlow)" />
                    <rect width="100%" height="100%" fill="url(#celestialGrid)" />
                </svg>
            </div>

            {/* Si el tenant tiene su propia imagen de fondo de marca, se integra como textura elegante */}
            {branding?.login_bg_image && (
                <div
                    className="absolute inset-0 bg-cover bg-center z-0 opacity-15 mix-blend-luminosity pointer-events-none"
                    style={{ backgroundImage: `url(${branding.login_bg_image})` }}
                />
            )}

            {/* ── PANEL IZQUIERDO: Observatorio & Identidad Pegasus Nexus (Desktop) ── */}
            <div className="hidden lg:flex lg:w-7/12 relative z-10 flex-col justify-between p-10 xl:p-14 border-r border-slate-800/80 bg-gradient-to-b from-[#080C16]/95 to-[#06080F]/95">
                {/* Cabecera de Marca */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        {branding?.logo_url ? (
                            <img
                                src={branding.logo_url}
                                alt={branding.tenant_name}
                                className="h-11 w-auto max-w-[190px] object-contain rounded-xl p-1.5 bg-[#0C1220] border border-slate-700/70 shadow-sm"
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#0D1629] border border-sky-500/30 flex items-center justify-center shadow-inner relative group">
                                {/* Emblema artesanal de la Constelación Pegaso */}
                                <svg className="w-6 h-6 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="5" cy="6" r="1.5" fill="currentColor" />
                                    <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                                    <circle cx="19" cy="8" r="1.5" fill="currentColor" />
                                    <circle cx="15" cy="17" r="1.5" fill="currentColor" />
                                    <circle cx="8" cy="18" r="1.5" fill="currentColor" />
                                    <path d="M5 6 L12 4 L19 8 L15 17 L8 18 Z" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2" />
                                    <path d="M12 4 L15 17" strokeWidth="0.8" opacity="0.5" />
                                    <path d="M5 6 L8 18" strokeWidth="0.8" opacity="0.5" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black tracking-wider text-slate-100 font-serif">
                                    {branding?.tenant_name || 'PEGASUS NEXUS'}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-slate-700 bg-slate-800/80 text-slate-300">
                                    2.5
                                </span>
                            </div>
                            <span className="block text-[11px] text-slate-400 font-medium tracking-wide">
                                {branding?.custom_branding ? 'Portal Corporativo Autorizado' : 'Constelación de Comercio & Punto de Venta'}
                            </span>
                        </div>
                    </div>

                    {branding?.custom_branding && (
                        <button
                            type="button"
                            onClick={handleClearTenant}
                            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
                            title="Cambiar a Pegasus genérico u otra empresa"
                        >
                            <RefreshCw size={12} />
                            <span>Cambiar empresa</span>
                        </button>
                    )}
                </div>

                {/* Contenido Central: Mensaje Poético y Estructurado */}
                <div className="max-w-xl my-auto py-8 space-y-6">
                    {/* Insignia Astronómica */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700/80 bg-slate-900/80 text-xs text-slate-300">
                        <span className="text-amber-400">✦</span>
                        <span className="font-mono text-[11px] text-slate-400">PEGASUS · RA 21h 44m · DEC +15° 18'</span>
                        <span className="text-slate-600">|</span>
                        <span className="font-semibold text-slate-200">{branding?.badge_text || 'Red de Operaciones Activa'}</span>
                    </div>

                    <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight font-serif">
                        {branding?.headline ? (
                            branding.headline
                        ) : (
                            <>
                                El nexo donde convergen tus <br />
                                <span className="text-sky-300 underline decoration-sky-500/30 underline-offset-4">
                                    sucursales, ventas y personas
                                </span>.
                            </>
                        )}
                    </h1>

                    <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                        {branding?.description ||
                            'Diseñado con precisión y cariño para brindar agilidad en mostrador, control de inventario transparente y fidelización real en cada transacción.'}
                    </p>

                    {/* Fichas de Identidad Artesanal (Sin gradientes chillones) */}
                    <div className="grid grid-cols-2 gap-3.5 pt-2 max-w-lg">
                        <div className="p-3.5 rounded-xl bg-[#0C1220] border border-slate-800/90 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-2 text-sky-400 mb-1">
                                <span className="text-sm">✦</span>
                                <span className="text-xs font-bold text-slate-200">Terminal POS Precisa</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                                Cobros ágiles, soporte multidivisa y sincronización de caja en tiempo real.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0C1220] border border-slate-800/90 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-2 text-amber-300 mb-1">
                                <span className="text-sm">✦</span>
                                <span className="text-xs font-bold text-slate-200">Kárdex & Fidelización</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                                Control de stock por lote, sellos de cliente y tarjetas inteligentes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pie del Panel Izquierdo */}
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/70 pt-4">
                    <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="font-mono text-[11px]">
                            {systemOnline ? '✦ Núcleo Operativo Estable' : 'Conectando con el servidor...'}
                        </span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                        © 2026 {branding?.tenant_name || 'Pegasus SalesSystem'} · Alta Disponibilidad
                    </span>
                </div>
            </div>

            {/* ── PANEL DERECHO: Formulario de Acceso Humano & Accesible ── */}
            <div className="w-full lg:w-5/12 flex items-center justify-center p-4 sm:p-8 relative z-10 my-auto min-h-screen overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm sm:max-w-md bg-[#0C111E] border border-slate-700/80 p-6 sm:p-8 rounded-2xl shadow-xl space-y-5"
                >
                    {/* Header para Mobile con Logo o Nombre */}
                    <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                            {branding?.logo_url ? (
                                <img
                                    src={branding.logo_url}
                                    alt={branding.tenant_name}
                                    className="h-8 w-auto max-w-[130px] object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#0F182C] border border-sky-500/40 flex items-center justify-center">
                                    <span className="text-sky-400 text-xs">✦</span>
                                </div>
                            )}
                            <div>
                                <span className="text-base font-black text-slate-100 tracking-wide font-serif">
                                    {branding?.tenant_name || 'PEGASUS'}
                                </span>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                                    {branding?.custom_branding ? 'Portal Corporativo' : 'SalesSystem'}
                                </span>
                            </div>
                        </div>

                        {branding?.custom_branding && (
                            <button
                                type="button"
                                onClick={handleClearTenant}
                                className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800 border border-slate-700"
                                title="Cambiar empresa"
                            >
                                <RefreshCw size={12} />
                            </button>
                        )}
                    </div>

                    {/* Título del Formulario */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-serif">
                                Iniciar Sesión
                            </h2>
                            {branding?.custom_branding && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                                    {branding.tenant_name}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Ingresa con tus credenciales de tienda o administración.
                        </p>
                    </div>

                    {/* Alerta de Error Clara y Sobria */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-start gap-2"
                            >
                                <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                                <span className="flex-1 leading-snug">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campo Usuario */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-200 tracking-wide block">
                                    Usuario o Correo
                                </label>
                                {rememberMe && username && (
                                    <button
                                        type="button"
                                        onClick={handleClearRememberedUser}
                                        className="text-[10px] text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                                        title="Olvidar usuario recordado en este equipo"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <UserIcon
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors pointer-events-none"
                                />
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ej. cajero1 o usuario@empresa.com"
                                    className="w-full bg-[#131A2B] border border-slate-600/80 rounded-xl py-2.5 pl-10 pr-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all text-xs sm:text-sm font-medium hover:border-slate-500"
                                />
                            </div>
                        </div>

                        {/* Campo Contraseña con detección de Bloq Mayús sin CLS */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-200 tracking-wide block">
                                    Contraseña
                                </label>
                                {/* Alerta de CapsLock discreta reservando espacio */}
                                <span className={`text-[10px] font-bold text-amber-300 flex items-center gap-1 transition-opacity ${capsLockActive ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}>
                                    <span>✦</span> Bloq Mayús activo
                                </span>
                            </div>
                            <div className="relative group">
                                <Lock
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors pointer-events-none"
                                />
                                <input
                                    ref={passwordInputRef}
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyModifierCheck}
                                    onKeyUp={handleKeyModifierCheck}
                                    placeholder="••••••••••••"
                                    className={`w-full bg-[#131A2B] border rounded-xl py-2.5 pl-10 pr-10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all text-xs sm:text-sm font-medium hover:border-slate-500 ${
                                        capsLockActive ? 'border-amber-400/70' : 'border-slate-600/80'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Checkbox "Recordarme" para cajeros y personal de mostrador */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-[#131A2B] text-sky-500 focus:ring-sky-400/40 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors">
                                    Recordar mi usuario
                                </span>
                            </label>
                            <span className="text-[10px] text-slate-500">
                                Solo en este equipo
                            </span>
                        </div>

                        {/* Botón de Ingreso Profesional */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: branding?.primary_color 
                                    ? `linear-gradient(135deg, ${branding.primary_color}, ${secondaryColor})` 
                                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                            }}
                            className="w-full text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm disabled:opacity-60 cursor-pointer hover:brightness-110 shadow-md shadow-sky-950/40"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Validando credenciales...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ingresar al Sistema</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Enlace de Soporte y Pie Técnico Sobrio */}
                    <div className="pt-4 border-t border-slate-800 text-center space-y-2">
                        <p className="text-xs text-slate-400">
                            ¿Problemas con tu cuenta o turno?{' '}
                            <a
                                href="https://wa.me/59170000000"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                            >
                                Contactar soporte
                            </a>
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
                            <span>PEGASUS NEXUS v2.5</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">✦ Sucursal Conectada</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
