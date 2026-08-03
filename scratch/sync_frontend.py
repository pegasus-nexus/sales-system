import os
import shutil

src_dir = r"C:\Users\rodri\Desktop\SalesSystemSahian\SalesSystem\frontend"
dest_dir = r"C:\Users\rodri\Desktop\sales-system\frontend"

# We only copy frontend files that differ, to bring over all the UI polishing.
# We will skip SalesMatrixView.tsx because we want to manually merge it to preserve the filters in main.

def copy_file(rel_path):
    src = os.path.join(src_dir, rel_path)
    dest = os.path.join(dest_dir, rel_path)
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(src, dest)
        print(f"Copied {rel_path}")

def copy_dir(rel_path):
    src = os.path.join(src_dir, rel_path)
    dest = os.path.join(dest_dir, rel_path)
    if os.path.exists(src):
        if os.path.exists(dest):
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
        print(f"Copied directory {rel_path}")

# Pages
pages_to_sync = [
    "src/pages/AnaliticaAvanzada.tsx",
    "src/pages/PrediccionesAIPanel.tsx",
    "src/pages/CatalogoPage.tsx",
    "src/pages/CatalogoWebPage.tsx",
    "src/pages/CreditosPage.tsx",
    "src/pages/IngresoMercaderiaPage.tsx",
    "src/pages/PedidosCompraPage.tsx",
    "src/pages/PlanesAdminPage.tsx",
    "src/pages/POSPage.tsx",
    "src/pages/SaasCollaboratorsPage.tsx",
    "src/pages/SystemHealthPage.tsx",
    "src/pages/TenantDashboard.tsx",
    "src/pages/TenantsAdminPage.tsx"
]

for p in pages_to_sync:
    copy_file(p)

# Components (Directories)
copy_dir(r"src/components/predictive")
copy_dir(r"src/components/rentabilidad")
copy_dir(r"src/components/admin")

# Components (Files)
components_to_sync = [
    "src/components/ChatbotAnalitico.tsx",
    "src/components/ComparativaHorariaMultiAnio.tsx",
    "src/components/DynamicBubbleChart.tsx",
    "src/components/HourlyMultiyearChart.tsx",
    "src/components/Layout.tsx",
    "src/components/MonthlyEvolutionView.tsx",
    "src/components/PortfolioAnalysisView.tsx",
    "src/components/RegionalAndProductMix.tsx",
    "src/components/SalesPercentileTracker.tsx",
    "src/components/SpecialDatesChart.tsx",
    "src/components/TicketPrinter.tsx",
    "src/components/ViewSearchModal.tsx"
]

for c in components_to_sync:
    copy_file(c)

print("Sync completed.")
