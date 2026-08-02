import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Thermometer, CloudRain, Percent, Package, Calendar, Building2, ShieldAlert, Sparkles } from 'lucide-react';
import { simulateScenario } from '../../api/api';
import type { ScenarioSimulationRequest, ScenarioSimulationResponse } from '../../api/types';

export const ScenarioSimulator: React.FC = () => {
  const [sucursal, setSucursal] = useState('todas');
  const [temperatura, setTemperatura] = useState(22);
  const [lluvia, setLluvia] = useState(0);
  const [descuento, setDescuento] = useState(10);
  const [inventarioPct, setInventarioPct] = useState(100);
  const [festivo, setFestivo] = useState(false);

  const [simResult, setSimResult] = useState<ScenarioSimulationResponse>({
    expected_sales: 185000,
    expected_margin: 51800,
    expected_transactions: 1420,
    expected_customers: 1630,
    risk_level: 'Bajo',
    confidence: 96.8
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const runSimulation = async () => {
      setLoading(true);
      try {
        const req: ScenarioSimulationRequest = {
          sucursal,
          temperatura,
          lluvia,
          descuento,
          inventario_pct: inventarioPct,
          festivo
        };
        const res = await simulateScenario(req);
        if (isSubscribed && res) {
          setSimResult(res);
        }
      } catch (err) {
        console.error("Simulation error:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    const timer = setTimeout(runSimulation, 250);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [sucursal, temperatura, lluvia, descuento, inventarioPct, festivo]);

  const formatBs = (val: number) => `Bs. ${val.toLocaleString('es-BO')}`;

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'crítico': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'alto': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'medio': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200/60">
            <Sliders size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              Simulador Predictivo
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Simulación Inteligente de Escenarios
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <RefreshCw size={16} className="text-blue-600 animate-spin" />}
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
            <Sparkles size={13} /> Recálculo en Tiempo Real
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Sliders & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/70">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Parámetros del Entorno
          </h4>

          {/* Sucursal Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" /> Sucursal Evaluada
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['todas', 'Heroínas', 'Recoleta', 'Calacoto'].map((suc) => (
                <button
                  key={suc}
                  onClick={() => setSucursal(suc)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    sucursal === suc
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {suc === 'todas' ? 'Todas' : suc}
                </button>
              ))}
            </div>
          </div>

          {/* Temperatura Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><Thermometer size={14} className="text-amber-500" /> Temperatura (°C)</span>
              <span className="text-blue-600 font-extrabold">{temperatura}°C</span>
            </div>
            <input 
              type="range" min="10" max="35" value={temperatura} 
              onChange={(e) => setTemperatura(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Lluvia Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><CloudRain size={14} className="text-blue-500" /> Precipitación Lluvia (mm)</span>
              <span className="text-blue-600 font-extrabold">{lluvia} mm</span>
            </div>
            <input 
              type="range" min="0" max="50" value={lluvia} 
              onChange={(e) => setLluvia(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Descuento Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><Percent size={14} className="text-purple-500" /> Descuento Promocional (%)</span>
              <span className="text-blue-600 font-extrabold">{descuento}%</span>
            </div>
            <input 
              type="range" min="0" max="50" value={descuento} 
              onChange={(e) => setDescuento(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Inventario Available Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><Package size={14} className="text-emerald-500" /> Nivel de Abastecimiento Stock (%)</span>
              <span className="text-blue-600 font-extrabold">{inventarioPct}%</span>
            </div>
            <input 
              type="range" min="40" max="150" value={inventarioPct} 
              onChange={(e) => setInventarioPct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Festividad Toggle */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-purple-600" /> Coincide con Día Festivo / Feriado
            </span>
            <button
              onClick={() => setFestivo(!festivo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                festivo ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {festivo ? 'Sí (Festivo)' : 'No (Día Normal)'}
            </button>
          </div>

        </div>

        {/* Right Side: Real-time Calculated Impact (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-extrabold uppercase text-slate-400">Impacto Recalculado</span>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getRiskColor(simResult.risk_level)} flex items-center gap-1`}>
              <ShieldAlert size={14} /> Riesgo: {simResult.risk_level}
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-0.5">Ventas Proyectadas</span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {formatBs(simResult.expected_sales)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Margen Estimado</span>
                <span className="text-base font-extrabold text-slate-800">{formatBs(simResult.expected_margin)}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Transacciones</span>
                <span className="text-base font-extrabold text-slate-800">{simResult.expected_transactions.toLocaleString()} tx</span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Clientes Estimados:</span>
              <span className="text-blue-700 text-sm font-black">{simResult.expected_customers.toLocaleString()} personas</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2 font-medium">
            Confianza del motor cuantílico: <strong className="text-slate-700 font-bold">{simResult.confidence}%</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
