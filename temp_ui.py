f = open('frontend/src/pages/VentasPage.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

idx = c.find('Anular Venta\n                                                        </button>\n                                                    )}')
if idx != -1:
    btn = '''Anular Venta\n                                                        </button>\n                                                    )}\n                                                    {!isAnulado && role !== "CAJERO" && activeBranch?.nombre.toLowerCase().includes("supermercado") && (\n                                                        <button\n                                                            onClick={(e) => { e.stopPropagation(); setUpdateDateVenta(venta); setNuevaFecha(venta.created_at.slice(0, 16)); }}\n                                                            className="flex items-center gap-1.5 bg-white border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"\n                                                        >\n                                                            <CalendarDays size={16} />\n                                                            Cambiar Fecha\n                                                        </button>\n                                                    )}'''
    c = c[:idx] + btn + c[idx+len('Anular Venta\n                                                        </button>\n                                                    )}'):]
    with open('frontend/src/pages/VentasPage.tsx', 'w', encoding='utf-8') as fw:
        fw.write(c)
