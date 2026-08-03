import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { uploadImage } from '../api/api';
import { Loader2, Save, Globe, Image as ImageIcon, Type, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface WebConfig {
  hero_subtitle: string;
  hero_title: string;
  hero_description: string;
  hero_bg_cba: string;
  hero_bg_lpz: string;
}

export default function WebConfigPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WebConfig>({
    hero_subtitle: '',
    hero_title: '',
    hero_description: '',
    hero_bg_cba: '',
    hero_bg_lpz: ''
  });

  const [isUploadingCba, setIsUploadingCba] = useState(false);
  const [isUploadingLpz, setIsUploadingLpz] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['web-config'],
    queryFn: async () => {
      const response = await client<WebConfig>('/web-config');
      return response;
    }
  });

  useEffect(() => {
    if (config) {
      setFormData({
        hero_subtitle: config.hero_subtitle || '',
        hero_title: config.hero_title || '',
        hero_description: config.hero_description || '',
        hero_bg_cba: config.hero_bg_cba || '',
        hero_bg_lpz: config.hero_bg_lpz || ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        toast.success(`Imagen para ${city === 'cba' ? 'Cochabamba' : 'La Paz'} subida correctamente`);
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

  if (isLoading) {
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
            Personaliza los textos y portadas que los clientes ven en la tienda online.
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

      </form>
    </div>
  );
}
