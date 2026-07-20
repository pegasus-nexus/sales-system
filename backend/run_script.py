# ------------------------------------------------------------------------------
# PEGASUS SALES SYSTEM - EJECUTOR CENTRALIZADO DE SCRIPTS
# ------------------------------------------------------------------------------
# Este runner agrega el directorio 'backend' a sys.path para evitar problemas de
# ModuleNotFoundError al importar módulos de la app en scripts auxiliares.
#
# Uso: 
#   python run_script.py check_db
#   python run_script.py scripts/check_db.py
# ------------------------------------------------------------------------------

import sys
import os
import importlib.util

# Configurar salida utf-8 para compatibilidad con Windows cp1252 y emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

if len(sys.argv) < 2:
    print("Uso: python run_script.py [ruta_o_nombre_del_script] [argumentos...]")
    print("Ejemplo: python run_script.py check_db")
    sys.exit(1)

script_name = sys.argv[1]
script_path = None

# Buscar el archivo en diferentes ubicaciones posibles
candidates = [
    script_name,
    script_name + ".py",
    os.path.join(os.path.dirname(__file__), "scripts", script_name),
    os.path.join(os.path.dirname(__file__), "scripts", script_name + ".py"),
]

for candidate in candidates:
    if os.path.isfile(candidate):
        script_path = os.path.abspath(candidate)
        break

if not script_path:
    print(f"Error: No se pudo encontrar el script '{script_name}'")
    print("Candidatos evaluados:")
    for c in candidates:
        print(f"  - {c}")
    sys.exit(1)

# Asegurar que el directorio raíz de backend esté en sys.path para la resolución de 'app'
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ajustar sys.argv para que el script secundario reciba sus argumentos correspondientes
sys.argv = sys.argv[1:]

# Ejecutar el script dinámicamente en el contexto de __main__
try:
    print(f"==== Ejecutando: {os.path.basename(script_path)} ====")
    spec = importlib.util.spec_from_file_location("__main__", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["__main__"] = module
    spec.loader.exec_module(module)
except Exception as e:
    import traceback
    print(f"\n[Error en ejecución de script]: {e}", file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
