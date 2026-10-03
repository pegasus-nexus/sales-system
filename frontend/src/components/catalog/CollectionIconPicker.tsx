import React, { useState, useEffect } from 'react';
import { 
    Heart, Coffee, Sun, Users, Building2, Smile, Star, Gift, 
    Cake, Wine, Gem, Flame, ShoppingBag, Sparkles, Tag, Package, 
    Award, Compass, Utensils, Moon, Clock, PartyPopper, Crown, 
    ShieldCheck, Percent, Truck, Zap, Upload, Loader2, Check, 
    Image as ImageIcon, Palette
} from 'lucide-react';
import { uploadImage } from '../../api/api';
import { toast } from 'sonner';

export interface PredefinedIcon {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    category: 'Ocasiones' | 'Regalos' | 'Gourmet' | 'Tienda';
}

export const PREDEFINED_ICONS: PredefinedIcon[] = [
    // Ocasiones & Momentos
    { id: 'heart', name: 'Sorprender a alguien / Amor', icon: Heart, category: 'Ocasiones' },
    { id: 'coffee', name: 'Disfrutar con un café', icon: Coffee, category: 'Ocasiones' },
    { id: 'sun', name: 'Celebraciones & Días especiales', icon: Sun, category: 'Ocasiones' },
    { id: 'users', name: 'Compartir en familia & amigos', icon: Users, category: 'Ocasiones' },
    { id: 'building-2', name: 'Regalos corporativos & Empresas', icon: Building2, category: 'Ocasiones' },
    { id: 'smile', name: 'Para niños & Momentos alegres', icon: Smile, category: 'Ocasiones' },
    { id: 'utensils', name: 'Desayunos, meriendas & antojos', icon: Utensils, category: 'Ocasiones' },
    { id: 'moon', name: 'Noches dulces & Veladas', icon: Moon, category: 'Ocasiones' },
    { id: 'clock', name: 'Antojos del momento / Express', icon: Clock, category: 'Ocasiones' },

    // Fiestas & Regalos
    { id: 'gift', name: 'Regalos & Sorpresas', icon: Gift, category: 'Regalos' },
    { id: 'cake', name: 'Cumpleaños & Aniversarios', icon: Cake, category: 'Regalos' },
    { id: 'party-popper', name: 'Fiestas, bodas & eventos', icon: PartyPopper, category: 'Regalos' },
    { id: 'wine', name: 'Brindis & Maridaje fino', icon: Wine, category: 'Regalos' },
    { id: 'sparkles', name: 'Momentos mágicos', icon: Sparkles, category: 'Regalos' },
    { id: 'flame', name: 'Novedades & Tendencias calientes', icon: Flame, category: 'Regalos' },

    // Gourmet & Premium
    { id: 'gem', name: 'Línea Exclusiva / Diamante', icon: Gem, category: 'Gourmet' },
    { id: 'crown', name: 'Edición Real / Colección Dorada', icon: Crown, category: 'Gourmet' },
    { id: 'star', name: 'Favoritos de la casa / Especiales', icon: Star, category: 'Gourmet' },
    { id: 'award', name: 'Colección de temporada premiada', icon: Award, category: 'Gourmet' },
    { id: 'compass', name: 'Tradición, origen & herencia', icon: Compass, category: 'Gourmet' },
    { id: 'shield-check', name: 'Artesanal & Calidad Taboada', icon: ShieldCheck, category: 'Gourmet' },

    // Tienda & Packs
    { id: 'package', name: 'Cajas & Packs combinados', icon: Package, category: 'Tienda' },
    { id: 'shopping-bag', name: 'Edición especial de compras', icon: ShoppingBag, category: 'Tienda' },
    { id: 'tag', name: 'Promociones & Descuentos', icon: Tag, category: 'Tienda' },
    { id: 'percent', name: 'Super ofertas del mes', icon: Percent, category: 'Tienda' },
    { id: 'truck', name: 'Envíos a todo el país', icon: Truck, category: 'Tienda' },
    { id: 'zap', name: 'Edición limitada / Flash', icon: Zap, category: 'Tienda' }
];

export const COLOR_PALETTES = [
    { id: 'gold', name: 'Dorado Taboada', hex: '#DCB041', bgClass: 'bg-[#DCB041]', textClass: 'text-[#2A1612]', glow: 'rgba(220,176,65,0.45)' },
    { id: 'chocolate', name: 'Chocolate Fino', hex: '#5D4037', bgClass: 'bg-[#5D4037]', textClass: 'text-amber-200', glow: 'rgba(93,64,55,0.45)' },
    { id: 'cacao', name: 'Cacao Suave', hex: '#8F6C49', bgClass: 'bg-[#8F6C49]', textClass: 'text-white', glow: 'rgba(143,108,73,0.45)' },
    { id: 'red', name: 'Rubí / Pasión', hex: '#DC2626', bgClass: 'bg-red-600', textClass: 'text-white', glow: 'rgba(220,38,38,0.45)' },
    { id: 'pink', name: 'Rosa Fiesta', hex: '#DB2777', bgClass: 'bg-pink-600', textClass: 'text-white', glow: 'rgba(219,39,119,0.45)' },
    { id: 'amber', name: 'Ámbar Cálido', hex: '#D97706', bgClass: 'bg-amber-600', textClass: 'text-white', glow: 'rgba(217,119,6,0.45)' },
    { id: 'emerald', name: 'Esmeralda', hex: '#059669', bgClass: 'bg-emerald-600', textClass: 'text-white', glow: 'rgba(5,150,105,0.45)' },
    { id: 'blue', name: 'Azul Zafiro', hex: '#2563EB', bgClass: 'bg-blue-600', textClass: 'text-white', glow: 'rgba(37,99,235,0.45)' },
    { id: 'purple', name: 'Púrpura Imperial', hex: '#7C3AED', bgClass: 'bg-purple-600', textClass: 'text-white', glow: 'rgba(124,58,237,0.45)' }
];

const buildIconUrl = (iconId: string, hexColor: string) => {
    const cleanHex = hexColor.replace('#', '');
    return `https://api.iconify.design/lucide:${iconId}.svg?color=%23${cleanHex}`;
};

const parseIconUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/api\.iconify\.design\/lucide:([a-z0-9-]+)\.svg\?color=(?:%23|#)?([a-fA-F0-9]{6})/i);
    if (match) {
        return { iconId: match[1], hex: `#${match[2].toUpperCase()}` };
    }
    return null;
};

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
    const [activeCategory, setActiveCategory] = useState<string>('Todas');
    const [selectedColor, setSelectedColor] = useState<string>('#DCB041');
    const [selectedIconId, setSelectedIconId] = useState<string>('heart');
    const [hoveredIcon, setHoveredIcon] = useState<PredefinedIcon | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Synchronize parsed state on value change
    useEffect(() => {
        if (value) {
            const parsed = parseIconUrl(value);
            if (parsed) {
                setSelectedIconId(parsed.iconId);
                const matchedColor = COLOR_PALETTES.find(c => c.hex.toLowerCase() === parsed.hex.toLowerCase());
                if (matchedColor) {
                    setSelectedColor(matchedColor.hex);
                } else {
                    setSelectedColor(parsed.hex);
                }
                setMode('icons');
            } else if (value.startsWith('http') || value.startsWith('/')) {
                setMode('custom');
            }
        }
    }, [value]);

    const handleSelectIcon = (iconItem: PredefinedIcon) => {
        setSelectedIconId(iconItem.id);
        const newUrl = buildIconUrl(iconItem.id, selectedColor);
        onChange(newUrl, iconItem.name);
    };

    const handleSelectColor = (colorHex: string) => {
        setSelectedColor(colorHex);
        if (selectedIconId) {
            const newUrl = buildIconUrl(selectedIconId, colorHex);
            const currentIcon = PREDEFINED_ICONS.find(i => i.id === selectedIconId);
            onChange(newUrl, currentIcon?.name);
        }
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

    const filteredIcons = activeCategory === 'Todas' 
        ? PREDEFINED_ICONS 
        : PREDEFINED_ICONS.filter(item => item.category === activeCategory);

    const activeIconObj = PREDEFINED_ICONS.find(i => i.id === selectedIconId);
    const activeColorObj = COLOR_PALETTES.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) || COLOR_PALETTES[0];

    const isCustomUrl = mode === 'custom' || (!parseIconUrl(value) && value.length > 0);

    return (
        <div className="space-y-4">
            {/* Cabecera / Pestañas de Selección */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('icons')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            mode === 'icons' 
                                ? 'bg-[#dcb041] text-[#2A1612] shadow-sm ring-1 ring-[#dcb041]' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <span>✨ Galería de Íconos</span>
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

            {/* MODO 1: GALERÍA DE ÍCONOS CIRCULARES */}
            {mode === 'icons' && (
                <div className="space-y-3.5 bg-stone-900/95 p-4 rounded-2xl border border-stone-800 text-stone-100 shadow-sm">
                    {/* Selector de Categorías (Chips) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                        {['Todas', 'Ocasiones', 'Regalos', 'Gourmet', 'Tienda'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                                    activeCategory === cat
                                        ? 'bg-[#dcb041] text-[#2A1612] shadow-sm'
                                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Selector de Paleta de Colores para la Sección */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800">
                        <div className="flex items-center gap-1.5 text-xs text-stone-300 font-bold">
                            <Palette size={14} className="text-[#dcb041]" />
                            <span>Color del Ícono:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {COLOR_PALETTES.map((palette) => {
                                const isColorSelected = selectedColor.toLowerCase() === palette.hex.toLowerCase();
                                return (
                                    <button
                                        key={palette.id}
                                        type="button"
                                        title={palette.name}
                                        onClick={() => handleSelectColor(palette.hex)}
                                        className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                                            isColorSelected 
                                                ? 'scale-125 ring-2 ring-white shadow-md' 
                                                : 'opacity-70 hover:opacity-100 hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: palette.hex }}
                                    >
                                        {isColorSelected && <Check size={12} className={palette.textClass} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grid de Íconos Circulares Limpios (Sin texto abajo) */}
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 max-h-52 overflow-y-auto p-1 scrollbar-thin">
                        {filteredIcons.map((item) => {
                            const IconComp = item.icon;
                            const isSelected = selectedIconId === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    title={item.name}
                                    onMouseEnter={() => setHoveredIcon(item)}
                                    onMouseLeave={() => setHoveredIcon(null)}
                                    onClick={() => handleSelectIcon(item)}
                                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                        isSelected 
                                            ? 'scale-110 ring-2 ring-white shadow-lg' 
                                            : 'bg-[#FAF5F0] border border-[#e8dccb] text-[#5D4037] hover:bg-[#dcb041] hover:text-[#2A1612] hover:scale-105'
                                    }`}
                                    style={
                                        isSelected 
                                            ? { 
                                                backgroundColor: activeColorObj.hex, 
                                                color: activeColorObj.id === 'gold' ? '#2A1612' : '#FFFFFF',
                                                boxShadow: `0 0 16px ${activeColorObj.glow}`
                                              }
                                            : {}
                                    }
                                >
                                    <IconComp size={22} />
                                    {isSelected && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-stone-900 rounded-full flex items-center justify-center shadow text-[9px] font-black">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Nombre del ícono al hacer hover o selección activa */}
                    <div className="pt-2 border-t border-stone-800 text-center">
                        <span className="text-xs font-semibold text-stone-300">
                            {hoveredIcon 
                                ? `✨ ${hoveredIcon.name}` 
                                : activeIconObj 
                                    ? `Seleccionado: ${activeIconObj.name}` 
                                    : 'Haz clic en un ícono circular para seleccionarlo'}
                        </span>
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
                <div className="flex items-center gap-3.5 p-3.5 bg-stone-950 text-white rounded-2xl border border-stone-800 shadow-inner">
                    <div 
                        className="w-13 h-13 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md transition-all"
                        style={{
                            backgroundColor: !isCustomUrl ? activeColorObj.hex : '#2A1612',
                            color: !isCustomUrl && activeColorObj.id === 'gold' ? '#2A1612' : '#FFFFFF',
                            boxShadow: !isCustomUrl ? `0 0 16px ${activeColorObj.glow}` : undefined,
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        {!isCustomUrl && activeIconObj ? (
                            <activeIconObj.icon size={24} />
                        ) : (
                            <img 
                                src={value} 
                                alt="Preview" 
                                className="w-full h-full object-cover" 
                                onError={(e) => (e.currentTarget.style.display = 'none')} 
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#dcb041] block">
                            Vista Previa en Tienda Oficial
                        </span>
                        <p className="text-sm font-bold text-stone-100 truncate">
                            {currentName || (activeIconObj ? activeIconObj.name : 'Colección sin título')}
                        </p>
                        <p className="text-[11px] text-stone-400 font-medium">
                            {isCustomUrl ? 'Imagen personalizada' : `Ícono circular • Color: ${activeColorObj.name}`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
