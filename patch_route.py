import os
path = "frontend/src/App.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = '''                      <Route path="/contabilidad" element={
                        <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                          <ContabilidadPage />
                        </ProtectedRoute>
                      } />'''

replacement = '''                      <Route path="/contabilidad" element={
                        <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                          <ContabilidadPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/calculadora-margenes" element={
                        <ProtectedRoute allowedRoles={MATRIZ_ROLES}>
                          <CalculadoraMargenesPage />
                        </ProtectedRoute>
                      } />'''

data = data.replace(target, replacement)
with open(path, "w", encoding="utf-8") as f:
    f.write(data)
