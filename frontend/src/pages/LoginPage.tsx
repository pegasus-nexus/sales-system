import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Zap, BarChart3, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../api/client';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

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
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07090e] flex flex-col lg:flex-row relative overflow-hidden font-sans">
            {/* ── PANEL IZQUIERDO: Branding & Presentación (Desktop) ── */}
            <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 xl:p-16 border-r border-white/10 overflow-hidden bg-gradient-to-br from-[#090d16] via-[#07090e] to-[#04060a]">
                {/* Luces de ambiente sutiles */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />

                {/* Encabezado Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black text-white tracking-tight">PEGASUS <span className="text-indigo-400">NEXUS</span></span>
                        <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Retail & Enterprise ERP</span>
                    </div>
                </div>

                {/* Cuerpo del Mensaje Central */}
                <div className="relative z-10 max-w-lg my-auto py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" /> Plataforma Segura Multi-Sucursal
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] mb-6">
                        Potencia tus operaciones retail con <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">velocidad y precisión</span>.
                    </h1>

                    <p className="text-gray-400 text-base leading-relaxed mb-8">
                        Control total en tiempo real: Punto de venta ágil, trazabilidad exacta de inventarios, reportes inteligentes y cotizaciones B2B unificadas.
                    </p>

                    {/* Características clave */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                                <Store className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">POS Ultra Rápido</h4>
                                <p className="text-[11px] text-gray-400">Cobros fluidos con tickets y QR.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
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
                    <span>© 2026 Pegasus SalesSystem</span>
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
                    {/* Header para Mobile con Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-black text-white">PEGASUS <span className="text-indigo-400">NEXUS</span></span>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Retail ERP</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión</h2>
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
                            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 text-sm disabled:opacity-60 cursor-pointer"
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
                                className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
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
