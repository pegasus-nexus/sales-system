import codecs

with codecs.open("frontend/src/pages/PremiosWebPage.tsx", "r", "utf-8") as f:
    content = f.read()

import re

# Find the handleEditClick block and replace it
content = re.sub(
    r"const handleEditClick = \(reward: WebReward\) => \{[\s\S]*?setIsEditing",
    "const handleEditClick = (reward: WebReward) => {\n        const usos = usage?.[reward.id] || 0;\n        if (usos > 0) {\n            const ok = confirm(`¡ATENCIÓN! Este premio ya ha sido canjeado por ${usos} cliente(s).\\n\\nSi cambias el título, descripción o condiciones, estarás modificando el premio para quienes ya lo tienen, lo que podría perjudicar la experiencia del cliente.\\n\\nSe recomienda OCULTAR este premio y crear uno nuevo en lugar de editarlo.\\n\\n¿Estás absolutamente seguro de que quieres editarlo?`);\n            if (!ok) return;\n        }\n        setIsEditing",
    content
)

# Find the handleDelete block and replace the confirm
content = re.sub(
    r"const usos = usage\?\.\[id\] \|\| 0;[\s\S]*?\} else \{[\s\S]*?\}",
    "const usos = usage?.[id] || 0;\n        if (usos > 0) {\n            const ok = confirm(`¡CUIDADO! Este premio ya ha sido canjeado por ${usos} cliente(s).\\n\\nSi lo eliminas, podría desaparecer de sus perfiles o causar errores.\\nLo recomendable es simplemente cambiar su estado a 'Oculto'.\\n\\n¿Estás seguro de ELIMINARLO permanentemente?`);\n            if (!ok) return;\n        } else {\n            if (!confirm('¿Estás seguro de eliminar este premio?')) return;\n        }",
    content
)


with codecs.open("frontend/src/pages/PremiosWebPage.tsx", "w", "utf-8") as f:
    f.write(content)
