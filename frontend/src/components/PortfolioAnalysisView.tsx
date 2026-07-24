import { useState } from 'react';
import { Package } from 'lucide-react';
import DynamicBubbleChart from './DynamicBubbleChart';

export default function PortfolioAnalysisView() {
    const [portfolioMonths, setPortfolioMonths] = useState<string[]>(['2026-06']);

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Package size={20} /></div>
                        Análisis de Cartera (Dynamic Bubble Chart)
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Analiza el rendimiento de tus productos según su volumen y rentabilidad. 
                        Selecciona múltiples meses para ver trayectorias.
                    </p>
                </div>
                
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Meses a Analizar</label>
                    <div className="flex flex-wrap gap-2">
                        {['2026-04', '2026-05', '2026-06', '2026-07'].map(m => (
                            <label key={m} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                    checked={portfolioMonths.includes(m)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setPortfolioMonths([...portfolioMonths, m]);
                                        } else {
                                            setPortfolioMonths(portfolioMonths.filter(x => x !== m));
                                        }
                                    }}
                                />
                                <span className="text-sm font-medium text-gray-700">{m}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full">
                <DynamicBubbleChart 
                    startDates={portfolioMonths.map(m => new Date(`${m}-01T00:00:00.000Z`))}
                    endDates={portfolioMonths.map(m => {
                        const [y, mm] = m.split('-');
                        const d = new Date(Number(y), Number(mm), 0);
                        d.setHours(23, 59, 59, 999);
                        return d;
                    })}
                />
            </div>
        </div>
    );
}
