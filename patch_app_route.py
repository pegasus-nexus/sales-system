with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Modify ProtectedRoute interface
old_guard = '''const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredFeature,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredFeature?: string;
}) => {
  const { isAuthenticated, role, hasFeature } = useAuthStore();

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {'''

new_guard = '''const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredFeature,
  customCondition,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredFeature?: string;
  customCondition?: boolean;
}) => {
  const { isAuthenticated, role, hasFeature } = useAuthStore();

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  
  if (customCondition === false) return <Navigate to="/" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {'''

content = content.replace(old_guard, new_guard)

# Modify the route
old_route = '''<Route path="/compras/historico" element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL']}>'''

new_route = '''<Route path="/compras/historico" element={
                        <ProtectedRoute 
                          allowedRoles={['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'VENDEDOR', 'FACTURADOR', 'SUPERVISOR']}
                          customCondition={['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(useAuthStore().role || '') || !!useAuthStore().user?.permisos_especiales?.includes('INGRESO_HISTORICO_INVENTARIO')}
                        >'''

content = content.replace(old_route, new_route)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched App.tsx")
