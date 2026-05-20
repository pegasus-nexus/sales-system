import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import SucursalesPage from './pages/SucursalesPage';
import CatalogoPage from './pages/CatalogoPage';
import InventarioPage from './pages/InventarioPage';
import PedidosPage from './pages/PedidosPage';
import POSPage from './pages/POSPage';
import CajaPage from './pages/CajaPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import DescuentosPage from './pages/DescuentosPage';
import DashboardSucursal from './pages/DashboardSucursal';
import VentasPage from './pages/VentasPage';
import ControlQRPage from './pages/ControlQRPage';
import PriceRequestsPage from './pages/PriceRequestsPage';
import ReportsPage from './pages/ReportsPage';
import CreditosPage from './pages/CreditosPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'sonner';
import ChatbotAnalitico from './components/ChatbotAnalitico';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ─── Route Guard ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'SUPERADMIN') return <Navigate to="/admin" replace />;
    if (['ADMIN_MATRIZ', 'ADMIN'].includes(role)) return <Navigate to="/inteligencia" replace />;
    if (role === 'ADMIN_SUCURSAL') return <Navigate to="/dashboard-sucursal" replace />;
    if (['SUPERVISOR', 'VENDEDOR'].includes(role)) return <Navigate to="/inventario" replace />;
    return <Navigate to="/pos" replace />;
  }

  return children;
};

// ─── Role Dispatcher ─────────────────────────────────────────────────────────
const DashboardDispatch = () => {
  const { role } = useAuthStore();
  if (role === 'SUPERADMIN') return <Navigate to="/admin" replace />;
  if (['ADMIN_MATRIZ', 'ADMIN'].includes(role ?? '')) return <Navigate to="/inteligencia" replace />;
  if (role === 'ADMIN_SUCURSAL') return <Navigate to="/dashboard-sucursal" replace />;
  if (['SUPERVISOR', 'VENDEDOR'].includes(role ?? '')) return <Navigate to="/inventario" replace />;
  return <Navigate to="/pos" replace />;
};

const MATRIZ_ROLES = ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'];
const BRANCH_ROLES = ['ADMIN_SUCURSAL', 'ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'];
const MOBILE_MANAGEMENT_ROLES = [...BRANCH_ROLES, 'SUPERVISOR'];
const ALL_STAFF = ['ADMIN_MATRIZ', 'ADMIN_SUCURSAL', 'CAJERO', 'ADMIN', 'USER', 'SUPERADMIN', 'SUPERVISOR', 'VENDEDOR'];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors theme="light" />
      <BrowserRouter>
        <Routes>
          {/* 1. Ruta de Login fuera del Layout */}
          <Route path="/login" element={<LoginPage />} />

          {/* 2. Todas las demás rutas dentro del Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<ProtectedRoute><DashboardDispatch /></ProtectedRoute>} />

                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                    <TenantDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/reportes" element={
                  <ProtectedRoute allowedRoles={BRANCH_ROLES}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />

                <Route path="/inteligencia" element={
                  <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                    <ExecutiveDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/sucursales" element={
                  <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                    <SucursalesPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard-sucursal" element={
                  <ProtectedRoute allowedRoles={['ADMIN_SUCURSAL']}>
                    <DashboardSucursal />
                  </ProtectedRoute>
                } />

                <Route path="/catalogo" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <CatalogoPage />
                  </ProtectedRoute>
                } />

                <Route path="/inventario" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <InventarioPage />
                  </ProtectedRoute>
                } />

                <Route path="/pedidos" element={
                  <ProtectedRoute allowedRoles={MOBILE_MANAGEMENT_ROLES}>
                    <PedidosPage />
                  </ProtectedRoute>
                } />

                <Route path="/ventas" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <VentasPage />
                  </ProtectedRoute>
                } />

                <Route path="/qr-control" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <ControlQRPage />
                  </ProtectedRoute>
                } />

                <Route path="/creditos" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <CreditosPage />
                  </ProtectedRoute>
                } />

                <Route path="/descuentos" element={
                  <ProtectedRoute allowedRoles={BRANCH_ROLES}>
                    <DescuentosPage />
                  </ProtectedRoute>
                } />

                <Route path="/solicitudes-precio" element={
                  <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                    <PriceRequestsPage />
                  </ProtectedRoute>
                } />

                <Route path="/categories" element={
                  <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                    <CategoriesPage />
                  </ProtectedRoute>
                } />

                <Route path="/usuarios" element={
                  <ProtectedRoute allowedRoles={MOBILE_MANAGEMENT_ROLES}>
                    <UsersPage />
                  </ProtectedRoute>
                } />

                <Route path="/caja" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <CajaPage />
                  </ProtectedRoute>
                } />

                <Route path="/pos" element={
                  <ProtectedRoute allowedRoles={ALL_STAFF}>
                    <POSPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          } />
        </Routes>
        {/* Chatbot siempre visible pero fuera del sistema de rutas */}
        <ChatbotAnalitico />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;