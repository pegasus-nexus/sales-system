const fs = require('fs');
const path = 'frontend/src/pages/CatalogoPage.tsx';
let data = fs.readFileSync(path, 'utf8');

const injection =     const { user } = useAuthStore();
    const isMatrizAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MATRIZ' || user?.role === 'ADMIN';\n;

data = data.replace('    const isEditing = !!product;', injection + '    const isEditing = !!product;');
fs.writeFileSync(path, data);
