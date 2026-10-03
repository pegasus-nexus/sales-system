import React, { useState } from 'react';
import { 
    Heart, Coffee, Sun, Users, Building2, Smile, Star, Gift, 
    Cake, Wine, Gem, Flame, ShoppingBag, Sparkles, Tag, Package, 
    Award, Compass, Upload, Loader2, Check, Image as ImageIcon 
} from 'lucide-react';
import { uploadImage } from '../../api/api';
import { toast } from 'sonner';

export interface PredefinedIcon {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    url: string;
    category: string;
}

export const PREDEFINED_COLLECTION_ICONS: PredefinedIcon[] = [
    {
        id: 'heart',
        name: 'Sorprender a alguien',
        icon: Heart,
        url: 'https://api.iconify.design/lucide:heart.svg?color=%23dcb041',
        category: 'Ocasiones'
    },
    {
        id: 'coffee',
        name: 'Disfrutar con un café',
        icon: Coffee,
        url: 'https://api.iconify.design/lucide:coffee.svg?color=%23dcb041',
        category: 'Ocasiones'
    },
    {
        id: 'sun',
        name: 'Celebraciones y eventos',
        icon: Sun,
        url: 'https://api.iconify.design/lucide:sun.svg?color=%23dcb041',
        category: 'Ocasiones'
    },
    {
        id: 'users',
        name: 'Compartir en familia',
        icon: Users,
        url: 'https://api.iconify.design/lucide:users.svg?color=%23dcb041',
        category: 'Ocasiones'
    },
    {
        id: 'building-2',
        name: 'Regalos corporativos',
        icon: Building2,
        url: 'https://api.iconify.design/lucide:building-2.svg?color=%23dcb041',
        category: 'Ocasiones'
    },
    {
        id: 'smile',
        name: 'Para Niños',
        icon: Smile,
        url: 'https://api.iconify.design/lucide:smile.svg?color=%23dcb041',
        category: 'Ocasiones'
    },
    {
        id: 'star',
        name: 'Ver Catálogo / Especiales',
        icon: Star,
        url: 'https://api.iconify.design/lucide:star.svg?color=%23dcb041',
        category: 'Destacados'
    },
    {
        id: 'gift',
        name: 'Regalo & Sorpresa',
        icon: Gift,
        url: 'https://api.iconify.design/lucide:gift.svg?color=%23dcb041',
        category: 'Regalos'
    },
    {
        id: 'cake',
        name: 'Cumpleaños & Fiestas',
        icon: Cake,
        url: 'https://api.iconify.design/lucide:cake.svg?color=%23dcb041',
        category: 'Celebración'
    },
    {
        id: 'wine',
        name: 'Brindis & Maridaje',
        icon: Wine,
        url: 'https://api.iconify.design/lucide:wine.svg?color=%23dcb041',
        category: 'Gourmet'
    },
    {
        id: 'gem',
        name: 'Línea Exclusiva / Premium',
        icon: Gem,
        url: 'https://api.iconify.design/lucide:gem.svg?color=%23dcb041',
        category: 'Premium'
    },
    {
        id: 'flame',
        name: 'Novedades & Tendencias',
        icon: Flame,
        url: 'https://api.iconify.design/lucide:flame.svg?color=%23dcb041',
        category: 'Tendencias'
    },
    {
        id: 'shopping-bag',
        name: 'Edición Especial',
        icon: ShoppingBag,
        url: 'https://api.iconify.design/lucide:shopping-bag.svg?color=%23dcb041',
        category: 'Temporada'
    },
    {
        id: 'sparkles',
        name: 'Momentos Mágicos',
        icon: Sparkles,
        url: 'https://api.iconify.design/lucide:sparkles.svg?color=%23dcb041',
        category: 'Especiales'
    },
    {
        id: 'tag',
        name: 'Promociones & Ofertas',
        icon: Tag,
        url: 'https://api.iconify.design/lucide:tag.svg?color=%23dcb041',
        category: 'Ofertas'
    },
    {
        id: 'package',
        name: 'Cajas & Packs Especiales',
        icon: Package,
        url: 'https://api.iconify.design/lucide:package.svg?color=%23dcb041',
        category: 'Packs'
    },
    {
        id: 'award',
        name: 'Colección de Temporada',
        icon: Award,
        url: 'https://api.iconify.design/lucide:award.svg?color=%23dcb041',
        category: 'Destacados'
    },
    {
        id: 'compass',
        name: 'Tradición & Origen',
        icon: Compass,
        url: 'https://api.iconify.design/lucide:compass.svg?color=%23dcb041',
        category: 'Tradición'
    }
];

interface CollectionIconPickerProps {
    value: string;
    onChange: (url: string, suggestedName?: string) => void;
    currentName?: string;
}

export const CollectionIconPicker: React.FC<CollectionIconPickerProps> = ({
    value,
    onChange,
    currentName = ''
}) => {
    const [mode, setMode] = useState<'icons' | 'custom'>('icons');
    const [isUploading, setIsUploading] = useState(false);

    const handleSelectIcon = (iconItem: PredefinedIcon) => {
        onChange(iconItem.url, iconItem.name);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const res = await uploadImage(file);
            if (res.url) {
                onChange(res.url);
                toast.success("Imagen subida correctamente");
            }
        } catch (err: any) {
            toast.error(err.message || "Error al subir imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const selectedPredefined = PREDEFINED_COLLECTION_ICONS.find(item => item.url === value);

    return (
        <div className="space-y-4">
            {/* Pestañas de Selección */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('icons')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            mode === 'icons' 
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <span>✨ Íconos de Ocasión</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('custom')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            mode === 'custom' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <ImageIcon size={14} />
                        <span>Subir Imagen / URL</span>
                    </button>
                </div>
            </div>

            {/* MODO 1: GALERÍA DE ÍCONOS OFICIALES */}
            {mode === 'icons' && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-medium">
                        Selecciona un ícono para tu colección. Al hacer clic se configurará el diseño circular oficial de la web:
                    </p>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1 scrollbar-thin">
                        {PREDEFINED_COLLECTION_ICONS.map((item) => {
                            const IconComp = item.icon;
                            const isSelected = value === item.url;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelectIcon(item)}
                                    className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all text-center relative cursor-pointer ${
                                        isSelected 
                                            ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/40 shadow-sm scale-105' 
                                            : 'bg-stone-900/95 border-stone-800 hover:border-amber-400/60 hover:scale-102'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center shadow">
                                            <Check size={11} strokeWidth={3} />
                                        </div>
                                    )}
                                    {/* Círculo idéntico a la web oficial */}
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                        isSelected 
                                            ? 'bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(220,176,65,0.6)]' 
                                            : 'bg-stone-800/90 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-stone-950'
                                    }`}>
                                        <IconComp size={20} />
                                    </div>
                                    <span className={`text-[11px] font-bold leading-tight line-clamp-2 ${
                                        isSelected ? 'text-amber-900' : 'text-stone-200 group-hover:text-amber-300'
                                    }`}>
                                        {item.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODO 2: SUBIR IMAGEN O PEGAR URL PERSONALIZADA */}
            {mode === 'custom' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-gray-700">Enlace o Archivo de Imagen</label>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-lg cursor-pointer transition-colors border border-gray-300 shadow-sm">
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                            <span>Subir Archivo</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isUploading}
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                    <input 
                        type="text"
                        placeholder="https://... o sube una imagen personalizada"
                        className="w-full bg-white text-gray-900 font-medium text-xs placeholder-gray-400 border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-indigo-400 shadow-sm"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            )}

            {/* PREVISUALIZACIÓN DE LA COLECCIÓN EN VIVO */}
            {value && (
                <div className="flex items-center gap-3 p-3 bg-stone-950 text-white rounded-2xl border border-stone-800 shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-stone-900 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 overflow-hidden shadow">
                        {selectedPredefined ? (
                            <selectedPredefined.icon size={22} />
                        ) : (
                            <img src={value} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 block">Vista Previa en Tienda Web</span>
                        <p className="text-sm font-bold text-stone-100 truncate">{currentName || (selectedPredefined ? selectedPredefined.name : 'Colección sin título')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
