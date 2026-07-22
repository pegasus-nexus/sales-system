import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertTriangle } from 'lucide-react';
import DailyReportView from '../components/DailyReportView';
import FinancialDetailView from '../components/FinancialDetailView';
import ValuedInventoryView from '../components/ValuedInventoryView';
import HourlySalesView from '../components/HourlySalesView';
import StaffPerformanceView from '../components/StaffPerformanceView';
import SalesMatrixView from '../components/SalesMatrixView';
import InventoryReconciliationView from '../components/InventoryReconciliationView';
import ExpensesReportView from '../components/ExpensesReportView';
import CashSalesSummaryView from '../components/CashSalesSummaryView';
import AnulacionesReportView from '../components/AnulacionesReportView';
import ProductTrendsView from '../components/ProductTrendsView';
import ProductStatsView from '../components/ProductStatsView';
import PurchasesByClientView from '../components/PurchasesByClientView';
import MonthlyEvolutionView from '../components/MonthlyEvolutionView';
import BcgMatrix from '../components/BcgMatrix';

type TabType = 'general' | 'sucursales' | 'finanzas' | 'canales' | 'fuerza_ventas' | 'daily' | 'hourly' | 'staff' | 'inventario_valorado' | 'matrix' | 'tendencias' | 'product_stats' | 'conciliacion' | 'gastos' | 'caja_ventas' | 'anulaciones' | 'compras_cliente' | 'evolucion_mensual' | 'matriz_bcg';

export default function ReportsPage() {
    const { role } = useAuthStore();
    const [searchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabType) || 'evolucion_mensual';

    const esMatriz = ['SUPERADMIN', 'ADMIN', 'ADMIN_MATRIZ'].includes(role || '');
    const esSucursal = role === 'ADMIN_SUCURSAL';

    if (!esMatriz && !esSucursal) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <AlertTriangle className="text-amber-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
                <p className="text-gray-500 max-w-md">No tienes permisos para acceder al módulo de reportes.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20 md:pb-8">
            {(activeTab === 'evolucion_mensual' || activeTab === 'general' || activeTab === 'sucursales') ? (
                <MonthlyEvolutionView />
            ) : activeTab === 'matriz_bcg' ? (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <BcgMatrix />
                </div>
            ) : activeTab === 'daily' ? (
                <DailyReportView />
            ) : activeTab === 'finanzas' ? (
                <FinancialDetailView />
            ) : activeTab === 'inventario_valorado' ? (
                <ValuedInventoryView />
            ) : activeTab === 'hourly' ? (
                <HourlySalesView />
            ) : activeTab === 'staff' ? (
                <StaffPerformanceView />
            ) : activeTab === 'matrix' ? (
                <SalesMatrixView />
            ) : activeTab === 'tendencias' ? (
                <ProductTrendsView />
            ) : activeTab === 'product_stats' ? (
                <ProductStatsView />
            ) : activeTab === 'conciliacion' ? (
                <InventoryReconciliationView />
            ) : activeTab === 'gastos' ? (
                <ExpensesReportView />
            ) : activeTab === 'caja_ventas' ? (
                <CashSalesSummaryView />
            ) : activeTab === 'anulaciones' ? (
                <AnulacionesReportView />
            ) : activeTab === 'compras_cliente' ? (
                <PurchasesByClientView />
            ) : (
                <MonthlyEvolutionView />
            )}
        </div>
    );
}
