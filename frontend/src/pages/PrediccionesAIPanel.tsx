import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getPredictiveCenterData } from '../api/api';
import type { PredictiveCenterResponse } from '../api/types';

import { ModelConfidenceHeader } from '../components/predictive/ModelConfidenceHeader';
import { ExecutiveSummaryCard } from '../components/predictive/ExecutiveSummaryCard';
import { SalesForecastChart } from '../components/predictive/SalesForecastChart';
import { BranchForecastCards } from '../components/predictive/BranchForecastCards';
import { ProductGrowthRankings } from '../components/predictive/ProductGrowthRankings';
import { AIRecommendationsSection } from '../components/predictive/AIRecommendationsSection';
import { ScenarioSimulator } from '../components/predictive/ScenarioSimulator';
import { PredictiveCalendar } from '../components/predictive/PredictiveCalendar';
import { UpcomingEventsSection } from '../components/predictive/UpcomingEventsSection';
import { RisksAndOpportunities } from '../components/predictive/RisksAndOpportunities';
import { ModelExplanationSection } from '../components/predictive/ModelExplanationSection';

export default function PrediccionesAIPanel() {
  const [data, setData] = useState<PredictiveCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getPredictiveCenterData(14);
      if (res) {
        setData(res);
      }
    } catch (err: any) {
      console.error("Error cargando el Centro de Inteligencia Predictiva:", err);
      setErrorMsg("No se pudo obtener las predicciones de la BD. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100 animate-bounce">
          <Bot size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Cargando Centro de Inteligencia Predictiva...
        </h3>
        <p className="text-sm text-slate-500 font-medium max-w-md text-center">
          Procesando transacciones históricas y ejecutando regresión cuantílica por Gradient Boosting Regressor...
        </p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100">
          <AlertTriangle size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Error al Cargar Predicciones
        </h3>
        <p className="text-sm text-slate-500 font-medium">{errorMsg}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-extrabold shadow-sm transition-all"
        >
          <RefreshCw size={14} /> Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* ── Sub-header Banner Minimalista Executive ── */}
      <div className="border-b border-slate-200/80 bg-white sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Centro de Inteligencia Predictiva
                </span>
                <span className="text-xs font-bold text-slate-400">v2.0 Live</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Predicciones & Simulación IA
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck size={15} className="text-blue-600" />
              <span>Modelo Cuantílico Activo</span>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-full transition-all shadow-xs"
            >
              <RefreshCw size={13} />
              <span>Actualizar IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido de las 13 Secciones Requeridas ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        
        {/* Sección 13: Nivel de Confianza y Métricas Dataset */}
        <ModelConfidenceHeader meta={data.model_meta} />

        {/* Sección 1: Resumen Ejecutivo IA (Gemini Generativo) */}
        <ExecutiveSummaryCard summary={data.executive_summary} />

        {/* Sección 2: Pronóstico General de Ventas (P10, P50, P90 estilo Amazon Forecast) */}
        <SalesForecastChart forecast={data.sales_forecast} />

        {/* Sección 3: Pronóstico por Sucursal Oficial (Heroínas, Recoleta, Calacoto) */}
        <BranchForecastCards forecasts={data.branch_forecasts} />

        {/* Sección 4 & 5: Rankings de Crecimiento & Productos en Riesgo */}
        <ProductGrowthRankings topGrowth={data.top_growth_products} atRisk={data.products_at_risk} />

        {/* Sección 6: Recomendaciones Estratégicas IA (Generativo Gemini) */}
        <AIRecommendationsSection recommendations={data.ai_recommendations} />

        {/* Sección 7: Simulador Inteligente de Escenarios */}
        <ScenarioSimulator />

        {/* Sección 8: Calendario Predictivo */}
        <PredictiveCalendar days={data.predictive_calendar} />

        {/* Sección 9: Eventos que Impactarán las Ventas */}
        <UpcomingEventsSection events={data.upcoming_events} />

        {/* Sección 10 & 11: Riesgos u Oportunidades Detectados */}
        <RisksAndOpportunities risks={data.detected_risks} opportunities={data.detected_opportunities} />

        {/* Sección 12: Explicación Técnica del Modelo IA */}
        <ModelExplanationSection explanation={data.model_explanation} />

      </div>
    </div>
  );
}
