import React, { useState, useEffect } from 'react';
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
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../api/client';
import { registerCatalogo, googleAuthCatalogo } from '../api/catalogoApi';
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

export default function CatalogoAuthPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [isRegister, setIsRegister] = useState<boolean>(searchParams.get('mode') !== 'login');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = isRegister 
            ? 'Crear mi Catálogo Digital | Pegasus' 
            : 'Iniciar Sesión | Catálogo Digital Pegasus';
    }, [isRegister]);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [password, setPassword] = useState('');

    const DEFAULT_GOOGLE_CLIENT_ID = '32112312994-ddleo20g3kjtbrjo6s12uetv5iibujfn.apps.googleusercontent.com';
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

    // Initialize Google Identity Services if client ID is set
    useEffect(() => {
        if (!googleClientId) return;

        const loadGoogleScript = () => {
            if (document.getElementById('google-gsi-script')) return;
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google?.accounts?.id) {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleGoogleSuccess,
                    });
                }
            };
            document.body.appendChild(script);
        };

        loadGoogleScript();
    }, [googleClientId]);

    const handleGoogleSuccess = async (res: { credential: string }) => {
        setIsLoading(true);
        try {
            const data = await googleAuthCatalogo({
                credential: res.credential,
                company_name: companyName.trim() || undefined,
            });

            // Fetch user info for auth store
            const userRes = await fetch(`${BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                login(data.access_token, userData);
            }

            toast.success(`¡Bienvenido, ${data.full_name}! Tu catálogo está listo.`);
            navigate('/catalogo/admin');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al autenticar con Google';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleClick = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        } else {
            toast.error('Inicio con Google no disponible en este momento. Por favor ingresa con tu correo y contraseña.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isRegister) {
                if (!firstName.trim() || !lastName.trim() || !companyName.trim() || !email.trim() || !password.trim()) {
                    toast.error('Por favor completa todos los campos requeridos.');
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

                // Fetch user data
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
                // Login standard
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
                        {isRegister ? 'Crea tu Catálogo Digital' : 'Ingresa a tu Catálogo'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                        Expón tus productos en internet con fotos, precios y pedidos directos a tu WhatsApp en segundos.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8">
                    {/* Toggle Switch */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                        <button
                            type="button"
                            onClick={() => setIsRegister(false)}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                                !isRegister
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Ya tengo cuenta (Ingresar)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRegister(true)}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                                isRegister
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Crear Catálogo Gratis
                        </button>
                    </div>

                    {/* Google Auth Button */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleClick}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                            <span>
                                {isRegister ? 'Registrarse con Google' : 'Continuar con Google'}
                            </span>
                        </button>

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-600 font-semibold">
                                    O ingresa tus datos
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Standard Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                                    required
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
                                                    required
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
                                            WhatsApp para Recibir Pedidos (Opcional)
                                        </label>
                                        <PhoneCountryInput
                                            value={whatsapp}
                                            onChange={setWhatsapp}
                                            placeholder="67998576"
                                        />
                                        <p className="text-[11px] text-slate-600 mt-1">
                                            Tus clientes tocarán un botón y te enviarán el pedido directamente a este número con su código de país.
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
