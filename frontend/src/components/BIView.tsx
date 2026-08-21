import { BarChart3 } from 'lucide-react';

export default function BIView() {
    return (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[60vh]">
            <div className="p-4 bg-indigo-50 rounded-2xl mb-4">
                <BarChart3 className="text-indigo-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Intelligence (BI)</h2>
            <p className="text-gray-500 max-w-md">Módulo en desarrollo. Muy pronto podrás visualizar analíticas avanzadas e inteligencia de negocios aquí.</p>
        </div>
    );
}
