
import os

layout_path = "frontend/src/components/Layout.tsx"
with open(layout_path, "r", encoding="utf-8") as f:
    layout_data = f.read()

banner_code = """function TrialWarningBanner() {
    const { planExpiresAt, role } = useAuthStore();
    if (role === "SUPERADMIN" || role === "SUPERADMIN_STAFF" || !planExpiresAt) return null;
    const today = new Date();
    const expiry = new Date(planExpiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && diffDays > 0) {
        return (
            <div className="mb-2 bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold flex justify-center items-center text-center shadow-md z-50 animate-pulse">
                ⚠️ Tu periodo de prueba vence en {diffDays} {diffDays === 1 ? "día" : "días"}. Contacta a soporte para renovar tu suscripción.
            </div>
        );
    }
    return null;
}
"""

if "TrialWarningBanner" not in layout_data:
    # Insert function before `export default function Layout`
    layout_data = layout_data.replace("export default function Layout", banner_code + "\nexport default function Layout")
    
    # Insert component inside main
    target_loc = "                  {/* Desktop Exit Impersonation Banner */}"
    insert_loc = "                  <TrialWarningBanner />\n" + target_loc
    
    layout_data = layout_data.replace(target_loc, insert_loc)
    
    with open(layout_path, "w", encoding="utf-8") as f:
        f.write(layout_data)
print("Option D patched.")

