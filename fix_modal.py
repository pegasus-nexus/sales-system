import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure uploadImage, Loader2, Upload are imported
if "uploadImage" not in content:
    content = content.replace("import { client } from '../api/api';", "import { client, uploadImage } from '../api/api';")
if "Loader2" not in content:
    content = content.replace("import { Gift, Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';", "import { Gift, Plus, Trash2, Edit2, Save, X, Eye, EyeOff, Upload, Loader2, Calendar } from 'lucide-react';")

# Add validity_days to WebReward interface
content = content.replace("validity: string;\n    is_active: boolean;", "validity: string;\n    validity_days?: number;\n    is_active: boolean;")

# Modal Logic inside PremiosWebPage
modal_logic = """
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            const res = await uploadImage(file);
            setEditForm({ ...editForm, img: res.url });
            toast.success("Foto del premio subida correctamente");
        } catch (error) {
            toast.error("Error al subir la foto");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveForm = () => {
        if (!editForm.title || !editForm.desc || !editForm.validity_days) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }
        
        let updatedRewards = [...rewards];
        
        if (isEditing) {
            updatedRewards = updatedRewards.map(r => r.id === isEditing ? { ...r, ...editForm, validity: `${editForm.validity_days} días` } as WebReward : r);
        } else {
            const newReward: WebReward = {
                id: `premio_${Date.now()}`,
                title: editForm.title || '',
                tag: editForm.tag || 'Premio',
                desc: editForm.desc || '',
                img: editForm.img || '/img/placeholder.webp',
                validity: `${editForm.validity_days} días`,
                validity_days: editForm.validity_days,
                is_active: editForm.is_active ?? true
            };
            updatedRewards.push(newReward);
        }
        mutation.mutate({ rewards: updatedRewards });
        setIsModalOpen(false);
    };

    const handleOpenAdd = () => {
        setIsEditing(null);
        setEditForm({ validity_days: 14, is_active: true });
        setIsModalOpen(true);
    };
"""
content = re.sub(
    r"const handleAdd = \(\) => \{[\s\S]*?\};",
    modal_logic.strip(),
    content
)

# Replace handleEditClick to open Modal
new_handleEditClick = """
    const handleEditClick = (reward: WebReward) => {
        const usos = usage?.[reward.id] || 0;
        if (usos > 0) {
            const ok = confirm(`¡ATENCIÓN! Este premio ya ha sido canjeado por ${usos} cliente(s).\\n\\nSi cambias el título, descripción o condiciones, estarás modificando el premio para quienes ya lo tienen, lo que podría perjudicar la experiencia del cliente.\\n\\nSe recomienda OCULTAR este premio y crear uno nuevo en lugar de editarlo.\\n\\n¿Estás absolutamente seguro de que quieres editarlo?`);
            if (!ok) return;
        }
        setIsEditing(reward.id);
        
        // Parse validity_days fallback
        let vDays = reward.validity_days;
        if (!vDays) {
            if (reward.validity.toLowerCase().includes('semana')) vDays = 14;
            else if (reward.validity.toLowerCase().includes('mes')) vDays = 30;
            else vDays = 14;
        }
        
        setEditForm({ ...reward, validity_days: vDays });
        setIsModalOpen(true);
    };
"""
content = re.sub(
    r"const handleEditClick = \(reward: WebReward\) => \{[\s\S]*?setIsEditing\(reward\.id\);\n        setEditForm\(reward\);\n    \};",
    new_handleEditClick.strip(),
    content
)

# Update Add Button onClick
content = content.replace("onClick={handleAdd}", "onClick={handleOpenAdd}")

# Render Modal JSX and clean up inline edit logic in table
jsx_modal = """
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar Premio' : 'Nuevo Premio'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex flex-col gap-4">
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Premio <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Ej: Trufas de Chocolate" />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Etiqueta</label>
                                    <input type="text" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={editForm.tag || ''} onChange={e => setEditForm({...editForm, tag: e.target.value})} placeholder="Ej: EXCLUSIVO" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Días de Validez <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="number" min="1" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                            value={editForm.validity_days || ''} onChange={e => setEditForm({...editForm, validity_days: parseInt(e.target.value) || 0})} placeholder="Ej: 14" />
                                        <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editForm.desc || ''} onChange={e => setEditForm({...editForm, desc: e.target.value})} placeholder="Condiciones del premio..." />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen del Premio</label>
                                <div className="flex items-center gap-4">
                                    {editForm.img && (
                                        <img src={editForm.img} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                                    )}
                                    <label className={`flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none border-gray-200' : 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}`}>
                                        {isUploading ? <Loader2 size={24} className="text-indigo-500 animate-spin mb-1" /> : <Upload size={24} className="text-indigo-400 mb-1" />}
                                        <span className="text-xs font-semibold text-gray-600">{isUploading ? 'Subiendo...' : 'Subir a Cloudinary'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <input type="checkbox" checked={editForm.is_active ?? true} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                                <span className="text-sm font-semibold text-gray-800">Premio Activo y Visible</span>
                            </label>

                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button onClick={handleSaveForm} disabled={isUploading || mutation.isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2">
                                <Save size={16} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
"""

# Replace inline edit in table rows
# We will just remove the ternary operator for isEditing in the table and keep the read-only view
content = re.sub(
    r"\{isEditing === reward\.id \? \([\s\S]*?\) : \([\s\S]*?<div className=\"flex items-center gap-3\">\n\s*<img src=\{reward\.img\}",
    "<div className=\"flex items-center gap-3\">\n                                            <img src={reward.img}",
    content
)
content = re.sub(
    r"\s*</div>\n\s*\)\}\n\s*</td>\n\s*<td className=\"py-4 px-6 max-w-xs\">\n\s*\{isEditing === reward\.id \? \([\s\S]*?\) : \([\s\S]*?<p className=\"text-gray-500 line-clamp-2\">",
    "</div>\n                                </td>\n                                <td className=\"py-4 px-6 max-w-xs\">\n                                    <p className=\"text-gray-500 line-clamp-2\">",
    content
)
content = re.sub(
    r"\s*</p>\n\s*\)\}\n\s*</td>\n\s*<td className=\"py-4 px-6\">\n\s*\{isEditing === reward\.id \? \([\s\S]*?\) : \([\s\S]*?<span className=\"bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium text-xs border border-amber-100\">",
    "</p>\n                                </td>\n                                <td className=\"py-4 px-6\">\n                                    <span className=\"bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium text-xs border border-amber-100\">",
    content
)
content = re.sub(
    r"\s*</span>\n\s*\)\}\n\s*</td>",
    "</span>\n                                </td>",
    content
)
# update action buttons to remove the save/x
content = re.sub(
    r"\{isEditing === reward\.id \? \([\s\S]*?\) : \([\s\S]*?<button onClick=\{\(\) => handleEditClick\(reward\)\}",
    "<button onClick={() => handleEditClick(reward)}",
    content
)
content = re.sub(
    r"\}\n\s*</div>\n\s*</td>",
    "</div>\n                                </td>",
    content
)

# Append modal logic before the last </div>
content = content.replace("            </div>\n        </div>", "            </div>\n" + jsx_modal + "\n        </div>")

# Replace literal <td colSpan={5}> with actual code to prevent it breaking if regex missed something
# Looks solid. Let's write the file.
with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
