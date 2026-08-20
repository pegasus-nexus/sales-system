import React from 'react';
import { Gift } from 'lucide-react';

export default function PremiosWebPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="text-indigo-600" />
                        Premios Web
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configura los regalos y beneficios disponibles en la comunidad web.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Gift className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-lg font-bold text-gray-700">Módulo en Construcción</h2>
                <p className="text-gray-500 max-w-md mx-auto mt-2">
                    Próximamente podrás gestionar de forma dinámica todos los premios y descuentos de la página web desde aquí.
                </p>
            </div>
        </div>
    );
}
