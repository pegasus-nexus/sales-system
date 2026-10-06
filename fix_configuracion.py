
import os

page_path = "frontend/src/pages/ConfiguracionPage.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_data = f.read()

currency_ui = """
                    {/* REGIONALIZACION */}
                    <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Globe className="text-indigo-500" /> Regionalización y Moneda
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Código de Moneda (ISO)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold"
                                    placeholder="Ej. BOB, USD, MXN"
                                    maxLength={3}
                                    value={settings.currency_code || "BOB"}
                                    onChange={e => setSettings(s => ({ ...s, currency_code: e.target.value.toUpperCase() }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Símbolo de Moneda</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold"
                                    placeholder="Ej. Bs., $, €"
                                    value={settings.currency_symbol || "Bs."}
                                    onChange={e => setSettings(s => ({ ...s, currency_symbol: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
"""

if "Regionalización y Moneda" not in page_data:
    # We need to import Globe icon if not imported
    if "Globe" not in page_data:
        page_data = page_data.replace("import { ", "import { Globe, ")
        
    # Insert before WhatsApp Integration
    target = "{/* WHATSAPP INTEGRATION */}"
    page_data = page_data.replace(target, currency_ui + "\n                    " + target)
    
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(page_data)
print("ConfiguracionPage.tsx patched with Currency settings.")

