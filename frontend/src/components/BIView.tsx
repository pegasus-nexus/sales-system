import { useState } from 'react';
import { LayoutDashboard, TrendingUp } from 'lucide-react';
import { BIPanelGeneralView } from './bi/BIPanelGeneralView';
import { BIComparativasView } from './bi/BIComparativasView';

export default function BIView() {
    const [subTab, setSubTab] = useState<'panel' | 'comparativas'>('panel');

    return (
        <div className="w-full space-y-4">
            {/* SUB-NAVEGACIÓN INTERNA EN PASTEL PARA EL CENTRO DE INTELIGENCIA DE NEGOCIOS */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/70 flex items-center gap-2 max-w-xl mx-auto sm:mx-0">
                <button
                    onClick={() => setSubTab('panel')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        subTab === 'panel'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <LayoutDashboard size={14} />
                    <span>Panel General — Día a Día</span>
                </button>

                <button
                    onClick={() => setSubTab('comparativas')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        subTab === 'comparativas'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <TrendingUp size={14} />
                    <span>Comparativas Históricas</span>
                </button>
            </div>

            {/* CONTENIDO SEGÚN SUBTAB SELECCIONADA */}
            {subTab === 'panel' ? (
                <BIPanelGeneralView />
            ) : (
                <BIComparativasView />
            )}
        </div>
    );
}
