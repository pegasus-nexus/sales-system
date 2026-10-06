import sys

file_path = "frontend/src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add to lazy imports
lazy_anchor = "const InventarioTrasladosPage = lazy(() => import('./pages/InventarioTrasladosPage'));"
if "ControlInventarioPage" not in content:
    content = content.replace(lazy_anchor, lazy_anchor + "\nconst ControlInventarioPage = lazy(() => import('./pages/ControlInventarioPage'));")

# Add to routes
route_anchor = "<Route path=\"inventario\" element={<InventarioPage />} />"
if "path=\"auditoria-inventario\"" not in content:
    content = content.replace(route_anchor, route_anchor + "\n              <Route path=\"auditoria-inventario\" element={<ControlInventarioPage />} />")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added ControlInventarioPage to App.tsx")
