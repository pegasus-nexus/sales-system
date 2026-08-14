import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { uploadImage } from '../api/api';
import { Loader2, Save, Globe, Image as ImageIcon, Type, Upload, Star, Gift } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../api/types';

interface WebConfig {
  hero_subtitle: string;
  hero_title: string;
  hero_description: string;
  hero_bg_cba: string;
  hero_bg_lpz: string;
  featured_products: string[];
  club_benefit_product_id: string | null;
  club_benefit_description: string;
  club_benefit_branch: string;
  club_benefit_valid_until: string;
}

export default function WebConfigPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WebConfig>({
    hero_subtitle: '',
    hero_title: '',
    hero_description: '',
    hero_bg_cba: '',
    hero_bg_lpz: '',
    featured_products: [],
    club_benefit_product_id: null,
    club_benefit_description: '',
    club_benefit_branch: '',
    club_benefit_valid_until: ''
  });

  const [isUploadingCba, setIsUploadingCba] = useState(false);
  const [isUploadingLpz, setIsUploadingLpz] = useState(false);

  // Fetch web config
  const { data: config, isLoading } = useQuery({
    queryKey: ['web-config'],
    queryFn: async () => {
      const response = await client<WebConfig>('/web-config');
      return response;
    }
  });

  // Fetch catalog (only web visible)
  const { data: catalogProducts = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['fidelizacion-catalog-raw'],
    queryFn: async () => {
      // Usar endpoint de admin products con filtro
      const response = await client<{items: Product[]}>('/products?limit=500');
      return response.items.filter(p => p.show_on_web);
    }
  });

  useEffect(() => {
    if (config) {
      setFormData({
        hero_subtitle: config.hero_subtitle || '',
        hero_title: config.hero_title || '',
        hero_description: config.hero_description || '',
        hero_bg_cba: config.hero_bg_cba || '',
        hero_bg_lpz: config.hero_bg_lpz || '',
        featured_products: config.featured_products || [],
        club_benefit_product_id: config.club_benefit_product_id || null,
        club_benefit_description: config.club_benefit_description || '',
        club_benefit_branch: config.club_benefit_branch || '',
        club_benefit_valid_until: config.club_benefit_valid_until || ''
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: WebConfig) => {
      const response = await client<WebConfig>('/web-config', { body: data, method: 'PUT' });
      return response;
    },
    onSuccess: (updatedData) => {
      toast.success('Configuración web guardada exitosamente');
      queryClient.setQueryData(['web-config'], updatedData);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la configuración');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeaturedChange = (index: number, productId: string) => {
    setFormData(prev => {
      const newFeatured = [...prev.featured_products];
      if (productId) {
        newFeatured[index] = productId;
      } else {
        newFeatured.splice(index, 1);
      }
      return { ...prev, featured_products: newFeatured };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, city: 'cba' | 'lpz') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (city === 'cba') setIsUploadingCba(true);
    else setIsUploadingLpz(true);

    try {
      const res = await uploadImage(file);
      if (res.url) {
        setFormData(prev => ({
          ...prev,
          [city === 'cba' ? 'hero_bg_cba' : 'hero_bg_lpz']: res.url
        }));
        toast.success(`Imagen subida correctamente`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la imagen');
    } finally {
      if (city === 'cba') setIsUploadingCba(false);
      else setIsUploadingLpz(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading || isLoadingCatalog) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-pegasus-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-pegasus-500" />
            Configuración Web
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Personaliza los textos, portadas, destacados y beneficios del club en la tienda online.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending || isUploadingCba || isUploadingLpz}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-pegasus-600 text-white font-bold rounded-xl hover:bg-pegasus-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Cambios
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TEXTOS PRINCIPALES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Type className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Textos de Portada (Hero)</h2>
          </div>
          
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Subtítulo Superior (Pequeño)
              </label>
              <input
                type="text"
                name="hero_subtitle"
                value={formData.hero_subtitle}
                onChange={handleChange}
                placeholder="Ej. DESDE 1948 CREANDO MOMENTOS ESPECIALES"
                className="w-full rounded-xl border-gray-300 border px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Título Principal (Grande)
              </label>
              <input
                type="text"
                name="hero_title"
                value={formData.hero_title}
                onChange={handleChange}
                placeholder="Ej. Hay momentos que merecen un buen chocolate."
                className="w-full rounded-xl border-gray-300 border px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 font-semibold text-lg focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Descripción / Bajada
              </label>
              <textarea
                name="hero_description"
                value={formData.hero_description}
                onChange={handleChange}
                rows={3}
                placeholder="Ej. Cada ocasión merece un detalle especial..."
                className="w-full rounded-xl border-gray-300 border px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none resize-y"
              />
            </div>
          </div>
        </div>

        {/* IMÁGENES DE FONDO POR CIUDAD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Fondos por Ciudad</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* COCHABAMBA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-900">
                  Portada Cochabamba
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pegasus-50 hover:bg-pegasus-100 text-pegasus-700 font-bold text-xs rounded-lg cursor-pointer transition-colors border border-pegasus-200">
                  {isUploadingCba ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Subir Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'cba')}
                    disabled={isUploadingCba}
                  />
                </label>
              </div>

              <input
                type="text"
                name="hero_bg_cba"
                value={formData.hero_bg_cba}
                onChange={handleChange}
                placeholder="URL o sube una imagen"
                className="w-full rounded-xl border-gray-300 border px-4 py-2 bg-white text-gray-900 text-xs placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
              />

              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center relative shadow-inner">
                {formData.hero_bg_cba ? (
                  <img
                    src={formData.hero_bg_cba.startsWith('/') ? `https://chocolatestaboada.com${formData.hero_bg_cba}` : formData.hero_bg_cba}
                    alt="Portada Cochabamba"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-xs">Sin imagen seleccionada</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  <span className="text-white text-[11px] font-bold uppercase tracking-wider">Cochabamba</span>
                </div>
              </div>
            </div>

            {/* LA PAZ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-900">
                  Portada La Paz
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pegasus-50 hover:bg-pegasus-100 text-pegasus-700 font-bold text-xs rounded-lg cursor-pointer transition-colors border border-pegasus-200">
                  {isUploadingLpz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Subir Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'lpz')}
                    disabled={isUploadingLpz}
                  />
                </label>
              </div>

              <input
                type="text"
                name="hero_bg_lpz"
                value={formData.hero_bg_lpz}
                onChange={handleChange}
                placeholder="URL o sube una imagen"
                className="w-full rounded-xl border-gray-300 border px-4 py-2 bg-white text-gray-900 text-xs placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
              />

              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center relative shadow-inner">
                {formData.hero_bg_lpz ? (
                  <img
                    src={formData.hero_bg_lpz.startsWith('/') ? `https://chocolatestaboada.com${formData.hero_bg_lpz}` : formData.hero_bg_lpz}
                    alt="Portada La Paz"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-xs">Sin imagen seleccionada</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  <span className="text-white text-[11px] font-bold uppercase tracking-wider">La Paz</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESTACADOS DE TEMPORADA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Destacados de Temporada</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Producto Destacado {index + 1}
                </label>
                <select
                  value={formData.featured_products[index] || ''}
                  onChange={(e) => handleFeaturedChange(index, e.target.value)}
                  className="w-full rounded-xl border-gray-300 border px-4 py-2.5 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
                >
                  <option value="">-- Ninguno (Oculto) --</option>
                  {catalogProducts.map(p => (
                    <option key={p._id} value={p._id}>{p.descripcion}</option>
                  ))}
                </select>
                {formData.featured_products[index] && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {catalogProducts.find(p => p._id === formData.featured_products[index])?.image_url ? (
                      <img 
                        src={catalogProducts.find(p => p._id === formData.featured_products[index])?.image_url} 
                        className="w-12 h-12 rounded object-cover border border-gray-200 bg-white" 
                        alt=""
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-700 line-clamp-2">
                      {catalogProducts.find(p => p._id === formData.featured_products[index])?.descripcion}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BENEFICIO COMUNIDAD TABOADA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Gift className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Beneficio Club Taboada</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Producto del Beneficio (Regalo o Descuento Especial)
              </label>
              <select
                name="club_benefit_product_id"
                value={formData.club_benefit_product_id || ''}
                onChange={handleChange}
                className="w-full rounded-xl border-gray-300 border px-4 py-2.5 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
              >
                <option value="">-- Sin Beneficio Activo --</option>
                {catalogProducts.map(p => (
                  <option key={p._id} value={p._id}>{p.descripcion}</option>
                ))}
              </select>
            </div>

            {formData.club_benefit_product_id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-pegasus-50/50 p-5 rounded-xl border border-pegasus-100">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Descripción Corta / Atributo
                  </label>
                  <input
                    type="text"
                    name="club_benefit_description"
                    value={formData.club_benefit_description}
                    onChange={handleChange}
                    placeholder="Ej. 70% cacao amazónico"
                    className="w-full rounded-xl border-gray-300 border px-4 py-2 bg-white text-gray-900 placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Sucursal Válida
                  </label>
                  <input
                    type="text"
                    name="club_benefit_branch"
                    value={formData.club_benefit_branch}
                    onChange={handleChange}
                    placeholder="Ej. Solo válido para la sucursal Recoleta"
                    className="w-full rounded-xl border-gray-300 border px-4 py-2 bg-white text-gray-900 placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Fecha Límite / Validez
                  </label>
                  <input
                    type="text"
                    name="club_benefit_valid_until"
                    value={formData.club_benefit_valid_until}
                    onChange={handleChange}
                    placeholder="Ej. Válido para recoger hasta: Jueves, 6 de agosto de 2026"
                    className="w-full rounded-xl border-gray-300 border px-4 py-2 bg-white text-gray-900 placeholder-gray-400 font-medium focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
