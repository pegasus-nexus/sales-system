import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip_copy_to_clipboard = False
for line in lines:
    if "const user = useAuthStore(state => state.user);" in line:
        continue
    if "const [copied, setCopied] = useState(false);" in line:
        continue
    if "const copyToClipboard = async () => {" in line:
        skip_copy_to_clipboard = True
        continue
    if skip_copy_to_clipboard:
        if "};" in line and not line.startswith("        }"):
            skip_copy_to_clipboard = False
        continue
        
    if "import { Plus, Users, Package, DollarSign, Store, ShoppingBag, Loader2, X, Upload, ImageIcon, KeyRound, AlertTriangle, Copy, Check, Eye, EyeOff, XCircle, RefreshCw } from 'lucide-react';" in line:
        line = line.replace(", KeyRound, AlertTriangle, Copy, Check", "")
    
    new_lines.append(line)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Removed unused variables")
