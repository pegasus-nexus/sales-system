import React, { useState } from 'react';
import { BookOpen, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type GuiaRol = 'cajero' | 'sucursal' | 'matriz';

interface Paso {
    titulo: string;
    detalle: string;
}

interface Problema {
    mensaje: string;
    solucion: string;
}

interface GuiaSeccion {
    rol: GuiaRol;
    titulo: string;
    resumen: string;
    puede: string[];
    pasos: Paso[];
}

const REGLAS: string[] = [
    '1 sello por cada Bs 30 completos de cada ticket. Ejemplo: un ticket de Bs 65 da 2 sellos; los Bs 5 que sobran no se acumulan con otra compra.',
    'Solo cuentan las ventas no anuladas desde el 1 de noviembre de 2026.',
    'Para que la compra sume sellos, la venta del POS debe registrarse con el cliente (o su teléfono). Una venta sin cliente no suma sellos.',
    'Los sellos valen en cualquier sucursal: el cliente puede comprar en una tienda y canjear en otra.',
    'Cada premio pide una cantidad de sellos más un copago en Bs. El copago va a la Caja Chica de la promoción, no a la caja del POS.',
    'El premio se entrega del stock de la sucursal donde se hace el canje.',
];

const GUIAS: GuiaSeccion[] = [
    {
        rol: 'cajero',
        titulo: 'Cajero',
        resumen: 'Atiendes al cliente, consultas sus sellos y entregas el premio en tu sucursal.',
        puede: [
            'Consultar sellos de cualquier cliente.',
            'Canjear premios solo en tu sucursal (no puedes elegir otra).',
            'Ver participantes e historial de canjes de tu sucursal.',
            'Activar la Tarjeta Taboada y compartir el pase de Google Wallet.',
        ],
        pasos: [
            { titulo: 'En cada venta, registra al cliente', detalle: 'En el POS asocia la venta al cliente o a su celular. Así la compra suma sellos.' },
            { titulo: 'Abre «Canje de Premios»', detalle: 'Busca al cliente por nombre, celular o tarjeta (ej: TAB-829471) y pulsa «Buscar Cliente».' },
            { titulo: 'Revisa la cartilla', detalle: 'Verás sellos ganados, canjeados y disponibles. Si no tiene tarjeta, pulsa «Activar Tarjeta Taboada».' },
            { titulo: 'Elige el premio', detalle: 'Solo se habilitan los premios para los que alcanzan los sellos y que tienen stock en tu sucursal.' },
            { titulo: 'Cobra el copago', detalle: 'Elige Efectivo o QR, cobra el monto exacto que indica el botón y agrega una nota si hace falta.' },
            { titulo: 'Confirma y entrega', detalle: 'Pulsa «Confirmar Canje». Se descuentan los sellos y 1 unidad del stock; entrega el premio al cliente.' },
        ],
    },
    {
        rol: 'sucursal',
        titulo: 'Admin de sucursal',
        resumen: 'Haces todo lo del cajero y vigilas el stock y la caja chica de tu sucursal.',
        puede: [
            'Todo lo que hace el cajero, en tu sucursal.',
            'Ver el stock de premios de tu sucursal y sus movimientos (surtidos y traslados).',
            'Ver la Caja Chica de la promoción de tu sucursal (solo lectura).',
            'No puedes surtir, trasladar ni editar premios: eso lo hace la matriz.',
        ],
        pasos: [
            { titulo: 'Revisa «Stock de mi sucursal» al abrir', detalle: 'Los premios en amarillo están bajos y en rojo agotados.' },
            { titulo: 'Pide surtido a tiempo', detalle: 'Si un premio está bajo, avisa a la administración matriz para que lo surta o traslade.' },
            { titulo: 'Verifica lo que llega', detalle: 'Cuando la matriz surte o traslada, aparece en «Movimientos». Cuenta lo físico y avisa si no coincide.' },
            { titulo: 'Cuadra la caja chica', detalle: 'En «Caja Chica» compara los copagos registrados con el efectivo y los QR recibidos por la promoción.' },
        ],
    },
    {
        rol: 'matriz',
        titulo: 'Admin matriz',
        resumen: 'Preparas y controlas la campaña: premios, stock de cada sucursal, activación y caja chica.',
        puede: [
            'Crear, editar y desactivar premios.',
            'Surtir stock a cualquier sucursal y trasladar entre sucursales.',
            'Activar o pausar la campaña para cajeros.',
            'Ver métricas, caja chica de todas las sucursales y registrar egresos.',
            'Canjear en cualquier sucursal (debes elegirla).',
        ],
        pasos: [
            { titulo: 'Prepara los premios', detalle: 'En «Premios & Stock Sucursales» revisa los premios o usa «Crear Premio».' },
            { titulo: 'Surte cada sucursal', detalle: 'Usa «+ Surtir» por premio y sucursal. Si una sucursal tiene de más, usa «⇄ Trasladar». Todo queda en el historial.' },
            { titulo: 'Asigna sucursal a cada cajero', detalle: 'Un cajero sin sucursal asignada no puede canjear. Revísalo en Usuarios.' },
            { titulo: 'Activa la campaña', detalle: 'Mientras esté en preparación, los cajeros ven un aviso. Al activarla ya pueden canjear.' },
            { titulo: 'Controla a diario', detalle: 'Revisa métricas, stock bajo y la Caja Chica. Registra los egresos del fondo (ej: compra de tazas).' },
        ],
    },
];

const PROBLEMAS: Problema[] = [
    { mensaje: '«Sellos insuficientes»', solucion: 'El cliente no tiene los sellos que pide el premio. Ofrece un premio menor o que siga acumulando.' },
    { mensaje: '«Stock agotado» o premio deshabilitado', solucion: 'Tu sucursal no tiene ese premio. Avisa a la matriz para el surtido; no se puede canjear de otra sucursal.' },
    { mensaje: '«Tu usuario no tiene una sucursal asignada»', solucion: 'La matriz debe asignarte una sucursal en Usuarios.' },
    { mensaje: 'Pantalla «Campaña en preparación»', solucion: 'La matriz aún no activó la campaña. Las compras siguen sumando sellos.' },
    { mensaje: 'El cliente dice que compró y no tiene sellos', solucion: 'Probablemente la venta se hizo sin registrar al cliente, fue anulada, o el ticket fue menor a Bs 30.' },
];

interface Props {
    rol: GuiaRol;
}

/** Guía del módulo según el rol. La matriz puede ver las tres para capacitar a su equipo. */
export const GuiaMomentosTaboada: React.FC<Props> = ({ rol }) => {
    const visibles = rol === 'matriz' ? GUIAS : GUIAS.filter(g => g.rol === rol);
    const [activa, setActiva] = useState<GuiaRol>(rol);
    const guia = visibles.find(g => g.rol === activa) || visibles[0];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    Guía de Momentos Taboada
                </h3>
                <p className="text-sm text-gray-500 mt-1">Cómo funciona la promoción y qué te toca hacer según tu rol.</p>

                {visibles.length > 1 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {visibles.map(g => (
                            <button
                                key={g.rol}
                                type="button"
                                onClick={() => setActiva(g.rol)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    g.rol === guia.rol
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                                }`}
                            >
                                {g.titulo}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200/70">
                <h4 className="text-sm font-black text-amber-900 flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" /> Reglas de la promoción
                </h4>
                <ul className="space-y-2 text-sm text-amber-950">
                    {REGLAS.map(r => (
                        <li key={r} className="flex gap-2">
                            <span className="text-amber-600">•</span>
                            <span>{r}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-base font-black text-gray-900">{guia.titulo}: paso a paso</h4>
                    <p className="text-sm text-gray-500 mb-4">{guia.resumen}</p>
                    <ol className="space-y-4">
                        {guia.pasos.map((p, i) => (
                            <li key={p.titulo} className="flex gap-3">
                                <span className="w-7 h-7 shrink-0 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{p.titulo}</p>
                                    <p className="text-sm text-gray-600">{p.detalle}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-sm font-black text-gray-900 mb-3">Qué puedes hacer</h4>
                    <ul className="space-y-2">
                        {guia.puede.map(item => (
                            <li key={item} className="flex gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Problemas frecuentes
                </h4>
                <div className="divide-y divide-gray-100">
                    {PROBLEMAS.map(p => (
                        <div key={p.mensaje} className="py-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <p className="text-sm font-bold text-gray-900">{p.mensaje}</p>
                            <p className="md:col-span-2 text-sm text-gray-600">{p.solucion}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
