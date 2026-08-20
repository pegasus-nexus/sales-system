import re

with open('frontend/src/pages/ComunidadPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { useQuery } from '@tanstack/react-query';",
    "import { useState } from 'react';\nimport { useQuery, useMutation } from '@tanstack/react-query';\nimport { ClientCombobox } from '../components/ClientCombobox';\nimport { toast } from 'sonner';"
)

# Add state and mutation inside the component
mutation_code = """
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const afiliarMutation = useMutation({
        mutationFn: async (clienteId: string) => client(`/comunidad/afiliar/${clienteId}`, { method: 'POST' }),
        onSuccess: () => {
            toast.success("Cliente afiliado exitosamente");
            setSelectedClient(null);
            refetchMiembros();
            refetchStats();
        },
        onError: () => toast.error("Error al afiliar cliente")
    });

    const handleAfiliar = () => {
        if (!selectedClient) return;
        afiliarMutation.mutate(selectedClient._id);
    };
"""

content = content.replace(
    "const handleRefresh = () => {",
    mutation_code + "\n    const handleRefresh = () => {"
)

# Add the UI box before the stats grid
ui_box = """
            {/* Afiliar Cliente Box */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-end gap-4">
                <div className="flex-1 max-w-md">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Afiliar Cliente Existente</label>
                    <ClientCombobox 
                        selectedClient={selectedClient}
                        onSelect={setSelectedClient}
                        onClear={() => setSelectedClient(null)}
                    />
                </div>
                <button 
                    onClick={handleAfiliar}
                    disabled={!selectedClient || afiliarMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-colors h-[42px]"
                >
                    {afiliarMutation.isPending ? 'Afiliando...' : '+ Afiliar a Comunidad'}
                </button>
            </div>
"""

content = content.replace(
    "{/* Stats Grid */}",
    ui_box + "\n            {/* Stats Grid */}"
)

with open('frontend/src/pages/ComunidadPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
