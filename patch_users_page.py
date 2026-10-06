with open('frontend/src/pages/UsersPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add permisos_especiales to the form state
old_form_state = '''const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'CAJERO' as any });'''
new_form_state = '''const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'CAJERO' as any, permisos_especiales: [] as string[] });'''
content = content.replace(old_form_state, new_form_state)

# 2. Add permisos_especiales to editing setForm
old_set_form_edit = '''setForm({ username: emp.username, email: (emp as any).email || '', full_name: emp.full_name || '', role: emp.role as any, password: '' });'''
new_set_form_edit = '''setForm({ username: emp.username, email: (emp as any).email || '', full_name: emp.full_name || '', role: emp.role as any, password: '', permisos_especiales: (emp as any).permisos_especiales || [] });'''
content = content.replace(old_set_form_edit, new_set_form_edit)

# 3. Add to create payload
old_create_payload = '''createMutation.mutate(form);'''
new_create_payload = '''createMutation.mutate(form);''' # Actually form is passed directly, so it will include permisos_especiales!
# Wait, let's verify where form is passed.
# In create form: onSubmit={e => { e.preventDefault(); if(canSubmit) createMutation.mutate(form); }}
# This is fine.

# 4. Add to update payload
old_update_payload = '''const payload: any = { full_name: form.full_name, role: form.role, username: form.username, email: form.email };'''
new_update_payload = '''const payload: any = { full_name: form.full_name, role: form.role, username: form.username, email: form.email, permisos_especiales: form.permisos_especiales };'''
content = content.replace(old_update_payload, new_update_payload)

# 5. Add UI for permissions in Create Modal
old_create_role = '''</select>
                            </div>

                            <div className="pt-2">'''

new_create_role = '''</select>
                            </div>

                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <label className="block text-xs font-bold text-indigo-900 mb-3">Permisos Especiales (Opcional)</label>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer sr-only"
                                                checked={form.permisos_especiales.includes('EDITAR_FECHA_VENTA')}
                                                onChange={e => {
                                                    const perms = new Set(form.permisos_especiales);
                                                    if (e.target.checked) perms.add('EDITAR_FECHA_VENTA');
                                                    else perms.delete('EDITAR_FECHA_VENTA');
                                                    setForm({...form, permisos_especiales: Array.from(perms)});
                                                }}
                                            />
                                            <div className="w-5 h-5 border-2 border-indigo-200 roundedbg-white peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Permitir editar fecha de venta</span>
                                            <span className="text-xs text-gray-500">Autoriza al cajero a cambiar la fecha de una venta al momento de registrarla o de manera retroactiva.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer sr-only"
                                                checked={form.permisos_especiales.includes('INGRESO_HISTORICO_INVENTARIO')}
                                                onChange={e => {
                                                    const perms = new Set(form.permisos_especiales);
                                                    if (e.target.checked) perms.add('INGRESO_HISTORICO_INVENTARIO');
                                                    else perms.delete('INGRESO_HISTORICO_INVENTARIO');
                                                    setForm({...form, permisos_especiales: Array.from(perms)});
                                                }}
                                            />
                                            <div className="w-5 h-5 border-2 border-indigo-200 roundedbg-white peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Permitir registrar ingresos histricos</span>
                                            <span className="text-xs text-gray-500">Da acceso a la pantalla de Ingreso Histrico para registrar stock en fechas pasadas.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2">'''

content = content.replace(old_create_role, new_create_role, 1) # Only first match (create)

# 6. Add UI for permissions in Edit Modal
old_edit_role = '''</select>
                            </div>

                            <div className="pt-2">'''

new_edit_role = '''</select>
                            </div>

                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <label className="block text-xs font-bold text-indigo-900 mb-3">Permisos Especiales (Opcional)</label>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer sr-only"
                                                checked={form.permisos_especiales.includes('EDITAR_FECHA_VENTA')}
                                                onChange={e => {
                                                    const perms = new Set(form.permisos_especiales);
                                                    if (e.target.checked) perms.add('EDITAR_FECHA_VENTA');
                                                    else perms.delete('EDITAR_FECHA_VENTA');
                                                    setForm({...form, permisos_especiales: Array.from(perms)});
                                                }}
                                            />
                                            <div className="w-5 h-5 border-2 border-indigo-200 roundedbg-white peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Permitir editar fecha de venta</span>
                                            <span className="text-xs text-gray-500">Autoriza al cajero a cambiar la fecha de una venta al momento de registrarla o de manera retroactiva.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer sr-only"
                                                checked={form.permisos_especiales.includes('INGRESO_HISTORICO_INVENTARIO')}
                                                onChange={e => {
                                                    const perms = new Set(form.permisos_especiales);
                                                    if (e.target.checked) perms.add('INGRESO_HISTORICO_INVENTARIO');
                                                    else perms.delete('INGRESO_HISTORICO_INVENTARIO');
                                                    setForm({...form, permisos_especiales: Array.from(perms)});
                                                }}
                                            />
                                            <div className="w-5 h-5 border-2 border-indigo-200 roundedbg-white peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Permitir registrar ingresos histricos</span>
                                            <span className="text-xs text-gray-500">Da acceso a la pantalla de Ingreso Histrico para registrar stock en fechas pasadas.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2">'''

content = content.replace(old_edit_role, new_edit_role) # Second match (edit)

with open('frontend/src/pages/UsersPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched UsersPage.tsx")
