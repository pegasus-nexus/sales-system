import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add usage query
usage_query = """
    const { data: usage } = useQuery({
        queryKey: ['premios-uso'],
        queryFn: async () => {
            const res = await client<Record<string, number>>('/comunidad/premios-uso');
            return res;
        }
    });
"""
content = content.replace("const { data: config, isLoading } = useQuery({", usage_query + "\n    const { data: config, isLoading } = useQuery({")

# Update edit handler
edit_handler = """
    const handleEditClick = (reward: WebReward) => {
        const usos = usage?.[reward.id] || 0;
        if (usos > 0) {
            const ok = confirm(`¡ATENCIÓN! Este premio ya ha sido canjeado por ${usos} cliente(s).\n\nSi cambias el título, descripción o condiciones, estarás modificando el premio para quienes ya lo tienen, lo que podría perjudicar la experiencia del cliente.\n\nSe recomienda OCULTAR este premio y crear uno nuevo en lugar de editarlo.\n\n¿Estás absolutamente seguro de que quieres editarlo?`);
            if (!ok) return;
        }
        setIsEditing(reward.id);
        setEditForm(reward);
    };
"""
content = content.replace("const handleSave = () => {", edit_handler + "\n    const handleSave = () => {")

# Update edit button
content = content.replace(
    "onClick={() => { setIsEditing(reward.id); setEditForm(reward); }}",
    "onClick={() => handleEditClick(reward)}"
)

# Update delete handler
delete_handler_old = "if (!confirm('¿Estás seguro de eliminar este premio?')) return;"
delete_handler_new = """
        const usos = usage?.[id] || 0;
        if (usos > 0) {
            const ok = confirm(`¡CUIDADO! Este premio ya ha sido canjeado por ${usos} cliente(s).\n\nSi lo eliminas, podría desaparecer de sus perfiles o causar errores.\nLo recomendable es simplemente cambiar su estado a 'Oculto'.\n\n¿Estás seguro de ELIMINARLO permanentemente?`);
            if (!ok) return;
        } else {
            if (!confirm('¿Estás seguro de eliminar este premio?')) return;
        }
"""
content = content.replace(delete_handler_old, delete_handler_new)


with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
