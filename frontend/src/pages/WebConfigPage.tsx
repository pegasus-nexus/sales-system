import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { Loader2, Save, Globe, Image as ImageIcon, Type } from 'lucide-react';
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
      const response = await client('/web-config', { body: data, method: 'PUT' });
      return response;
    },
    onSuccess: () => {
      toast.success('Configuración web guardada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['web-config'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al guardar la configuración');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-pegasus-500" />
            Configuración Web
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Personaliza los textos y portadas que los clientes ven en la tienda online.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-pegasus-600 text-white rounded-lg hover:bg-pegasus-700 transition-colors disabled:opacity-50"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Type className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Textos de Portada (Hero)</h2>
          </div>
          
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo Superior (Pequeño)
              </label>
              <input
                type="text"
                name="hero_subtitle"
                value={formData.hero_subtitle}
                onChange={handleChange}
                placeholder="Ej. DESDE 1948 CREANDO MOMENTOS ESPECIALES"
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título Principal (Grande)
              </label>
              <input
                type="text"
                name="hero_title"
                value={formData.hero_title}
                onChange={handleChange}
                placeholder="Ej. Hay momentos que merecen un buen chocolate."
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500 font-medium text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción / Bajada
              </label>
              <textarea
                name="hero_description"
                value={formData.hero_description}
                onChange={handleChange}
                rows={3}
                placeholder="Ej. Cada ocasión merece un detalle especial..."
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500"
              />
            </div>
          </div>
        </div>

        {/* IMÁGENES DE FONDO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Fondos por Ciudad</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Imagen Cochabamba (URL)
              </label>
              <input
                type="text"
                name="hero_bg_cba"
                value={formData.hero_bg_cba}
                onChange={handleChange}
                placeholder="/img/portadataboada.png"
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500"
              />
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center relative">
                {formData.hero_bg_cba ? (
                  <img src={formData.hero_bg_cba.startsWith('/') ? `https://chocolatestaboada.com${formData.hero_bg_cba}` : formData.hero_bg_cba} alt="CBBA" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-bold tracking-widest uppercase drop-shadow-md">Cochabamba</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Imagen La Paz (URL)
              </label>
              <input
                type="text"
                name="hero_bg_lpz"
                value={formData.hero_bg_lpz}
                onChange={handleChange}
                placeholder="/img/portadalapaz.png"
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-pegasus-500 focus:border-pegasus-500"
              />
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center relative">
                {formData.hero_bg_lpz ? (
                  <img src={formData.hero_bg_lpz.startsWith('/') ? `https://chocolatestaboada.com${formData.hero_bg_lpz}` : formData.hero_bg_lpz} alt="LPZ" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-bold tracking-widest uppercase drop-shadow-md">La Paz</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
