import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Store, 
    Mail, 
    Lock, 
    Building2, 
    User as UserIcon, 
    ArrowRight, 
    Loader2, 
    Eye, 
    EyeOff, 
    Sparkles,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../api/client';
import { registerCatalogo, googleAuthCatalogo, checkEmailExists } from '../api/catalogoApi';
import type { CatalogoRegisterRequest } from '../api/catalogoApi';
import PhoneCountryInput from '../components/catalogo/PhoneCountryInput';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (options: { client_id: string; callback: (res: { credential: string }) => void }) => void;
                    prompt: () => void;
                    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
                };
            };
        };
    }
}

interface GoogleJwtPayload {
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    picture?: string;
    sub?: string;
}

interface GooglePendingData {
    credential: string;
    email: string;
    name: string;
    picture?: string;
    givenName?: string;
}

function decodeJwtPayload(token: string): GoogleJwtPayload | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export default function CatalogoAuthPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Redirigir de inmediato si ya tiene sesión iniciada
    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/catalogo/admin', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Modo por defecto: LOGIN (a menos que venga ?mode=register en la URL)
    const [isRegister, setIsRegister] = useState<boolean>(searchParams.get('mode') === 'register');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

    // Estado cuando el usuario se autentica con Google pero falta completar datos del negocio
    const [googlePendingData, setGooglePendingData] = useState<GooglePendingData | null>(null);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [password, setPassword] = useState('');

    const googleBtnRef = useRef<HTMLDivElement>(null);

    const DEFAULT_GOOGLE_CLIENT_ID = '32112312994-ddleo20g3kjtbrjo6s12uetv5iibujfn.apps.googleusercontent.com';
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (googlePendingData) {
            document.title = 'Completa tu Negocio | Catálogo Digital Pegasus';
        } else if (isRegister) {
            document.title = 'Crear mi Catálogo Digital Gratis | Pegasus';
        } else {
            document.title = 'Iniciar Sesión | Catálogo Digital Pegasus';
        }
    }, [isRegister, googlePendingData]);

    // Función que procesa la respuesta exitosa de Google
    const handleGoogleSuccess = useCallback(async (res: { credential: string }) => {
        setIsLoading(true);
        try {
            const payload = decodeJwtPayload(res.credential);
            const userEmail = payload?.email || '';
            const userFullName = payload?.name || payload?.given_name || 'Comercio';
            const userPicture = payload?.picture;

            if (!userEmail) {
                throw new Error('Google no proporcionó un correo electrónico válido.');
            }

            // Verificar si el usuario ya está registrado en la base de datos
            const exists = await checkEmailExists(userEmail);

            if (exists) {
                // Caso 1: Usuario ya existe -> Login directo instantáneo
                const data = await googleAuthCatalogo({
                    credential: res.credential,
                });

                const userRes = await fetch(`${BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    login(data.access_token, userData);
                }

                toast.success(`¡Bienvenido de vuelta, ${data.full_name || userFullName}!`);
                navigate('/catalogo/admin');
            } else {
                // Caso 2: Usuario nuevo -> Paso de completación de negocio y WhatsApp
                setGooglePendingData({
                    credential: res.credential,
                    email: userEmail,
                    name: userFullName,
                    picture: userPicture,
                    givenName: payload?.given_name,
                });
                toast.info('¡Cuenta de Google conectada! Completa los datos de tu negocio para activar tu catálogo.');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al autenticar con Google';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [login, navigate]);

    // Renderizador del botón oficial de Google Identity Services
    const renderGoogleBtn = useCallback(() => {
        if (!googleBtnRef.current || !window.google?.accounts?.id || googlePendingData) return;

        try {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: isRegister ? 'signup_with' : 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 320,
            });
        } catch (e) {
            console.error('Error al renderizar botón de Google:', e);
        }
    }, [isRegister, googlePendingData]);

    // Carga e inicialización de Google Identity Services
    useEffect(() => {
        if (!googleClientId) return;

        const initGsi = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleSuccess,
                });
                setIsGoogleScriptLoaded(true);
                renderGoogleBtn();
            }
        };

        const existingScript = document.getElementById('google-gsi-script');
        if (existingScript) {
            initGsi();
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGsi;
        document.body.appendChild(script);
    }, [googleClientId, handleGoogleSuccess, renderGoogleBtn]);

    // Re-renderizar el botón de Google cuando cambie el modo Login/Registro
    useEffect(() => {
        if (isGoogleScriptLoaded && !googlePendingData) {
            renderGoogleBtn();
        }
    }, [isRegister, isGoogleScriptLoaded, googlePendingData, renderGoogleBtn]);

    // Envío del formulario de completación con Google (Nombre Empresa + WhatsApp)
    const handleGoogleCompleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!googlePendingData) return;

        if (!companyName.trim()) {
            toast.error('Por favor escribe el nombre de tu negocio o empresa.');
            return;
        }
        if (!whatsapp.trim()) {
            toast.error('Por favor ingresa tu número de WhatsApp para recibir pedidos.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await googleAuthCatalogo({
                credential: googlePendingData.credential,
                company_name: companyName.trim(),
                whatsapp: whatsapp.trim(),
            });

            const userRes = await fetch(`${BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                login(data.access_token, userData);
            }

            toast.success(`¡Felicidades, ${data.full_name || googlePendingData.name}! Tu catálogo está listo.`);
            navigate('/catalogo/admin');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar catálogo con Google';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Envío del formulario estándar (Correo + Contraseña)
    const handleStandardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isRegister) {
                if (!firstName.trim() || !lastName.trim() || !companyName.trim() || !email.trim() || !password.trim()) {
                    toast.error('Por favor completa todos los campos obligatorios.');
                    setIsLoading(false);
                    return;
                }

                const payload: CatalogoRegisterRequest = {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    company_name: companyName.trim(),
                    email: email.trim().toLowerCase(),
                    whatsapp: whatsapp.trim() || undefined,
                    password: password,
                };

                const res = await registerCatalogo(payload);

                const userRes = await fetch(`${BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${res.access_token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    login(res.access_token, userData);
                }

                toast.success('¡Cuenta y catálogo creados con éxito!');
                navigate('/catalogo/admin');
            } else {
                // Iniciar sesión estándar
                const formData = new URLSearchParams();
                formData.append('username', email.trim().toLowerCase());
                formData.append('password', password);

                const response = await fetch(`${BASE_URL}/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Correo o contraseña incorrectos.');
                }

                const data = await response.json();
                const userRes = await fetch(`${BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    login(data.access_token, userData);
                }

                toast.success('Sesión iniciada correctamente.');
                navigate('/catalogo/admin');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error en la solicitud';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
            <div className="w-full max-w-xl">
                {/* Header Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/20 mb-3">
                        <Store size={28} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {googlePendingData 
                            ? 'Datos de tu Negocio' 
                            : isRegister 
                                ? 'Crea tu Catálogo Digital Gratis' 
                                : 'Ingresa a tu Catálogo Digital'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                        {googlePendingData
                            ? 'Casi listo. Solo necesitamos estos datos para personalizar tu catálogo y tus pedidos de WhatsApp.'
                            : isRegister
                                ? 'Expón tus productos en internet con fotos, precios y pedidos directos a tu WhatsApp en segundos.'
                                : 'Gestiona tus productos, personaliza tu marca y revisa tus pedidos en tiempo real.'}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8">
                    {/* CASO A: COMPLETACIÓN DE GOOGLE (Faltaban datos de empresa y whatsapp) */}
                    {googlePendingData ? (
                        <div className="space-y-5">
                            {/* Card de Cuenta Google Conectada */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                                <div className="flex items-center gap-3 min-w-0">
                                    {googlePendingData.picture ? (
                                        <img 
                                            src={googlePendingData.picture} 
                                            alt={googlePendingData.name} 
                                            className="w-10 h-10 rounded-full border border-emerald-300 object-cover shrink-0" 
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                            {googlePendingData.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                            <span>Conectado con Google</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {googlePendingData.name}
                                        </p>
                                        <p className="text-xs text-slate-600 truncate">
                                            {googlePendingData.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setGooglePendingData(null)}
                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline shrink-0 ml-2"
                                    title="Usar otra cuenta"
                                >
                                    Cambiar
                                </button>
                            </div>

                            <form onSubmit={handleGoogleCompleteSubmit} className="space-y-4">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Nombre del Negocio / Empresa *
                                    </label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                        <input
                                            type="text"
                                            required
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Ej. Pastelería Dulce Corazón"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                                        />
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        WhatsApp para Recibir Pedidos *
                                    </label>
                                    <PhoneCountryInput
                                        value={whatsapp}
                                        onChange={setWhatsapp}
                                        placeholder="67998576"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-600 mt-1">
                                        Tus clientes tocarán un botón y te enviarán sus pedidos directamente a este número de WhatsApp.
                                    </p>
                                </div>

                                {/* Submit CTA */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>¡Crear y Activar mi Catálogo!</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* CASO B: FORMULARIO PRINCIPAL (LOGIN O REGISTRO) */
                        <div className="space-y-6">
                            {/* Botón oficial de Google Identity Services */}
                            <div>
                                <div className="flex flex-col items-center justify-center min-h-[44px]">
                                    <div ref={googleBtnRef} className="w-full flex justify-center" />
                                    {!isGoogleScriptLoaded && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 py-2">
                                            <RefreshCw size={12} className="animate-spin text-indigo-600" />
                                            <span>Cargando acceso con Google...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="relative my-5">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-3 text-slate-600 font-semibold">
                                            {isRegister ? 'O regístrate con tus datos' : 'O ingresa con tu correo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Standard Form */}
                            <form onSubmit={handleStandardSubmit} className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {isRegister && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-4"
                                        >
                                            {/* First & Last Name */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                        Nombre *
                                                    </label>
                                                    <div className="relative">
                                                        <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                                        <input
                                                            type="text"
                                                            required={isRegister}
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            placeholder="Ej. Carlos"
                                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                        Apellido *
                                                    </label>
                                                    <div className="relative">
                                                        <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                                        <input
                                                            type="text"
                                                            required={isRegister}
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            placeholder="Ej. Mamani"
                                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Company Name */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    Nombre del Negocio / Empresa *
                                                </label>
                                                <div className="relative">
                                                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        required={isRegister}
                                                        value={companyName}
                                                        onChange={(e) => setCompanyName(e.target.value)}
                                                        placeholder="Ej. Pastelería Dulce Corazón"
                                                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* WhatsApp */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    WhatsApp para Recibir Pedidos
                                                </label>
                                                <PhoneCountryInput
                                                    value={whatsapp}
                                                    onChange={setWhatsapp}
                                                    placeholder="67998576"
                                                />
                                                <p className="text-[11px] text-slate-600 mt-1">
                                                    Tus clientes te enviarán el pedido directamente a este número con su código de país.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Correo Electrónico *
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu-correo@ejemplo.com"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Contraseña *
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit CTA */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>{isRegister ? 'Crear mi Catálogo Gratis' : 'Iniciar Sesión'}</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Alternar entre Login y Registro con preguntas claras al pie */}
                            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                                {!isRegister ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600">
                                            ¿No tienes una cuenta de catálogo todavía?
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsRegister(true);
                                                setGooglePendingData(null);
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all cursor-pointer border border-indigo-200"
                                        >
                                            <Sparkles size={16} className="text-indigo-600" />
                                            <span>Regístrate y crea tu catálogo gratis</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600">
                                            ¿Ya tienes una cuenta registrada?
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsRegister(false);
                                                setGooglePendingData(null);
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
                                        >
                                            <span>Inicia sesión aquí</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Sparkles size={14} className="text-indigo-600" />
                            Sin comisiones por venta
                        </span>
                        <Link to="/login" className="text-indigo-600 hover:underline font-semibold">
                            ¿Eres usuario de POS / Sucursal? Ingresa aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
