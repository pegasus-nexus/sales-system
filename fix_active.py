import sys
import re

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add useConfirm to imports
if "import { useConfirm }" not in content:
    content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { useConfirm } from '../components/ConfirmModal';")

# Add useConfirm to ActiveConteoView
content = content.replace("const ActiveConteoView = ({ conteoId, onBack }: { conteoId: string, onBack: () => void }) => {", "const ActiveConteoView = ({ conteoId, onBack }: { conteoId: string, onBack: () => void }) => {\n    const confirmModal = useConfirm();")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed ActiveConteoView")
