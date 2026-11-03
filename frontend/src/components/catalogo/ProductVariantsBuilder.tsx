import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Sparkles, Layers, Trash2 } from 'lucide-react';
import type { ProductAttributeDef, ProductVariantItem } from '../../api/types';

interface ProductVariantsBuilderProps {
    baseName: string;
    basePrice: number;
    baseCost: number;
    baseSku?: string;
    hasVariants: boolean;
    onToggleVariants: (active: boolean) => void;
    onChangeVariants: (variants: ProductVariantItem[]) => void;
}

const PRESETS = [
    {
        id: 'chocolates',
        icon: '🍫',
        label: 'Chocolatería / Alimentos',
        attributes: [
            { name: 'Presentación', values: ['50g', '100g', '250g'] },
            { name: 'Tipo', values: ['Amargo 70%', 'Con Leche', 'Blanco'] }
        ]
    },
    {
        id: 'zapatillas',
        icon: '👟',
        label: 'Zapatillas / Calzado',
        attributes: [
            { name: 'Talla', values: ['38', '39', '40', '41'] },
            { name: 'Color', values: ['Negro', 'Blanco'] }
        ]
    },
    {
        id: 'ropa',
        icon: '👕',
        label: 'Ropa / Textil',
        attributes: [
            { name: 'Talla', values: ['S', 'M', 'L', 'XL'] },
            { name: 'Color', values: ['Negro', 'Blanco', 'Rojo'] }
        ]
    },
    {
        id: 'cafeteria',
        icon: '☕',
        label: 'Cafetería / Bebidas',
        attributes: [
            { name: 'Tamaño', values: ['Normal', 'Grande'] },
            { name: 'Leche', values: ['Entera', 'Deslactosada', 'Almendras'] }
        ]
    }
];

export default function ProductVariantsBuilder({
    baseName,
    basePrice,
    baseCost,
    baseSku = '',
    hasVariants,
    onToggleVariants,
    onChangeVariants,
}: ProductVariantsBuilderProps) {
    const [attributes, setAttributes] = useState<ProductAttributeDef[]>([]);
    const [newAttrName, setNewAttrName] = useState('');
    const [newValInputs, setNewValInputs] = useState<Record<number, string>>({});
    const [variantsList, setVariantsList] = useState<ProductVariantItem[]>([]);

    // Aplicar preset según el rubro de la tienda
    const handleApplyPreset = (preset: typeof PRESETS[0]) => {
        setAttributes(preset.attributes);
    };

    // Agregar un nuevo atributo personalizado (ej: "Relleno", "Voltaje")
    const handleAddAttribute = () => {
        const trimmed = newAttrName.trim();
        if (!trimmed) return;
        if (attributes.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
            setNewAttrName('');
            return;
        }
        setAttributes(prev => [...prev, { name: trimmed, values: [] }]);
        setNewAttrName('');
    };

    // Eliminar un atributo completo
    const handleRemoveAttribute = (idx: number) => {
        setAttributes(prev => prev.filter((_, i) => i !== idx));
    };

    // Agregar un valor a un atributo (ej: "50g", "Amargo")
    const handleAddValue = (attrIdx: number) => {
        const val = (newValInputs[attrIdx] || '').trim();
        if (!val) return;
        setAttributes(prev => {
            const next = [...prev];
            const currentAttr = next[attrIdx];
            if (!currentAttr.values.includes(val)) {
                currentAttr.values = [...currentAttr.values, val];
            }
            return next;
        });
        setNewValInputs(prev => ({ ...prev, [attrIdx]: '' }));
    };

    // Eliminar un valor individual
    const handleRemoveValue = (attrIdx: number, valIdx: number) => {
        setAttributes(prev => {
            const next = [...prev];
            next[attrIdx].values = next[attrIdx].values.filter((_, i) => i !== valIdx);
            return next;
        });
    };

    // Producto cartesiano de atributos para generar la matriz de combinaciones
    const cartesianCombinations = useMemo(() => {
        const validAttrs = attributes.filter(a => a.values.length > 0);
        if (validAttrs.length === 0) return [];

        return validAttrs.reduce<Record<string, string>[]>((acc, attr) => {
            if (acc.length === 0) {
                return attr.values.map(val => ({ [attr.name]: val }));
            }
            const res: Record<string, string>[] = [];
            for (const existing of acc) {
                for (const val of attr.values) {
                    res.push({ ...existing, [attr.name]: val });
                }
            }
            return res;
        }, []);
    }, [attributes]);

    // Sincronizar combinaciones generadas con la lista de variantes editable
    useEffect(() => {
        if (!hasVariants) {
            setVariantsList([]);
            onChangeVariants([]);
            return;
        }

        setVariantsList(prev => {
            const nextList: ProductVariantItem[] = cartesianCombinations.map((comb, idx) => {
                const combKey = Object.entries(comb)
                    .map(([k, v]) => `${k}:${v}`)
                    .sort()
                    .join('|');

                const existing = prev.find(p => {
                    const existingKey = Object.entries(p.atributos)
                        .map(([k, v]) => `${k}:${v}`)
                        .sort()
                        .join('|');
                    return existingKey === combKey;
                });

                const combDesc = Object.values(comb).join(' / ');
                const generatedSku = baseSku ? `${baseSku}-${idx + 1}` : `VAR-${idx + 1}`;

                return (
                    existing || {
                        descripcion: `${baseName || 'Producto'} (${combDesc})`,
                        codigo_corto: generatedSku,
                        codigo_largo: '',
                        precio_venta: basePrice || 0,
                        costo_producto: baseCost || 0,
                        atributos: comb,
                    }
                );
            });

            onChangeVariants(nextList);
            return nextList;
        });
    }, [cartesianCombinations, hasVariants, baseName, basePrice, baseCost, baseSku]);

    const handleUpdateVariantField = (
        idx: number,
        field: keyof ProductVariantItem,
        val: string | number
    ) => {
        setVariantsList(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            onChangeVariants(next);
            return next;
        });
    };

    const handleRemoveVariantRow = (idx: number) => {
        setVariantsList(prev => {
            const next = prev.filter((_, i) => i !== idx);
            onChangeVariants(next);
            return next;
        });
    };

    return (
        <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-4 sm:p-5 transition-all">
            {/* Header con Switch de Activación */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Layers size={16} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span>¿Este producto tiene Variantes?</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                Odoo Matrix
                            </span>
                        </h4>
                        <p className="text-xs text-gray-500">
                            Actívalo si manejas tallas, sabores, gramajes o presentaciones. Si es un producto único, déjalo apagado.
                        </p>
                    </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => onToggleVariants(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {/* Panel de Configuración de Variantes (Solo visible si el switch está activado) */}
            {hasVariants && (
                <div className="mt-5 pt-4 border-t border-indigo-100/80 space-y-4">
                    {/* Botones de Presets por Rubro */}
                    <div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                            Sugerencias Rápidas según tu Rubro:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset)}
                                    className="px-3 py-1.5 rounded-xl bg-white text-gray-900 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>{preset.icon}</span>
                                    <span>{preset.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor de Atributos */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                Atributos Definidos ({attributes.length})
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newAttrName}
                                    onChange={(e) => setNewAttrName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttribute())}
                                    placeholder="Ej: Sabor, Gramaje, Talla..."
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddAttribute}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <Plus size={13} />
                                    <span>Agregar</span>
                                </button>
                            </div>
                        </div>

                        {attributes.length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 text-center">
                                Selecciona una sugerencia arriba o escribe un atributo para comenzar a generar variantes.
                            </p>
                        ) : (
                            <div className="space-y-3 pt-2">
                                {attributes.map((attr, aIdx) => (
                                    <div key={attr.name} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-900">
                                                {attr.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttribute(aIdx)}
                                                className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {/* Valores y Chips */}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {attr.values.map((val, vIdx) => (
                                                <span
                                                    key={val}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-800 border border-gray-200 shadow-2xs"
                                                >
                                                    <span>{val}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveValue(aIdx, vIdx)}
                                                        className="text-gray-400 hover:text-rose-600 ml-1"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}

                                            <div className="inline-flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={newValInputs[aIdx] || ''}
                                                    onChange={(e) => setNewValInputs({ ...newValInputs, [aIdx]: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue(aIdx))}
                                                    placeholder="Nuevo valor + Enter"
                                                    className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-900 bg-white focus:outline-hidden w-28"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddValue(aIdx)}
                                                    className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tabla de Variantes Generadas */}
                    {variantsList.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={13} className="text-indigo-600" />
                                    <span>Variantes Generadas ({variantsList.length})</span>
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                    Define el código de barras y precio de cada variante
                                </span>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0">
                                        <tr>
                                            <th className="p-2.5">Variante</th>
                                            <th className="p-2.5">SKU / Ref</th>
                                            <th className="p-2.5">Código de Barras</th>
                                            <th className="p-2.5 w-24">Precio (Bs)</th>
                                            <th className="p-2.5 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {variantsList.map((v, idx) => (
                                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="p-2 font-bold text-gray-900">
                                                    {Object.entries(v.atributos).map(([k, val]) => (
                                                        <span key={k} className="inline-block px-1.5 py-0.5 mr-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
                                                            {k}: <b>{val}</b>
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={v.codigo_corto || ''}
                                                        onChange={(e) => handleUpdateVariantField(idx, 'codigo_corto', e.target.value)}
                                                        className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white font-mono text-xs"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={v.codigo_largo || ''}
                                                        onChange={(e) => handleUpdateVariantField(idx, 'codigo_largo', e.target.value)}
                                                        placeholder="Escanea o escribe..."
                                                        className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white font-mono text-xs"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={v.precio_venta}
                                                        onChange={(e) => handleUpdateVariantField(idx, 'precio_venta', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white font-bold text-xs"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVariantRow(idx)}
                                                        title="Eliminar esta combinación"
                                                        className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
