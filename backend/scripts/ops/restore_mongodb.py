import asyncio
import os
import json
import hashlib
from bson import json_util
from app.db import get_raw_db


async def run_mongodb_restore(target_db_name: str = "sales_system_restore_test"):
    print("=" * 90)
    print("EJECUTANDO SCRIPT OPERATIVO DE RESTAURACIÓN DE MONGODB EN ENTORNO AISLADO")
    print(f"BASE DE DATOS OBJETIVO: {target_db_name}")
    print("PEGASUS SALES SYSTEM — BASELINE CONGELADO (COMMIT afc8029)")
    print("=" * 90)

    raw_db = await get_raw_db()
    client = raw_db.client
    target_db = client[target_db_name]

    backup_base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backups")
    if not os.path.exists(backup_base_dir):
        raise FileNotFoundError(f"No existe el directorio de backups: {backup_base_dir}")

    subdirs = [os.path.join(backup_base_dir, d) for d in os.listdir(backup_base_dir) if os.path.isdir(os.path.join(backup_base_dir, d))]
    if not subdirs:
        raise FileNotFoundError("No se encontraron carpetas de backup.")

    latest_backup_dir = max(subdirs, key=os.path.getmtime)
    print(f"Directorio de Respaldo Detectado: {latest_backup_dir}")

    # 1. Validación de CHECKSUM SHA-256
    checksum_file = os.path.join(latest_backup_dir, "checksum_sha256.txt")
    if not os.path.exists(checksum_file):
        raise FileNotFoundError("El backup no contiene checksum_sha256.txt")

    with open(checksum_file, "r", encoding="utf-8") as f:
        expected_checksum = f.read().strip()

    sha256_hash = hashlib.sha256()
    for root, _, files in os.walk(latest_backup_dir):
        for names in sorted(files):
            if names != "checksum_sha256.txt":
                filepath = os.path.join(root, names)
                with open(filepath, 'rb') as f:
                    for byte_block in iter(lambda: f.read(65536), b""):
                        sha256_hash.update(byte_block)

    actual_checksum = sha256_hash.hexdigest()
    if actual_checksum != expected_checksum:
        raise ValueError(f"CRÍTICO: El Checksum SHA-256 no coincide. Esperado: {expected_checksum}, Actual: {actual_checksum}")

    print(f"✓ CHECKSUM SHA-256 VERIFICADO INTRACTABLE: {actual_checksum}\n")

    # 2. Carga de Manifest
    manifest_path = os.path.join(latest_backup_dir, "inventory_manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    restored_summary = {}
    total_docs_restored = 0

    # 3. Restauración Colección por Colección en la BD Aislada
    for col_name, info in manifest["collections"].items():
        col_file_path = os.path.join(latest_backup_dir, f"{col_name}.jsonl")
        if not os.path.exists(col_file_path):
            continue

        # Limpiar colección de prueba en la BD restaurada
        await target_db[col_name].drop()

        docs_to_insert = []
        with open(col_file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    docs_to_insert.append(json_util.loads(line))

        if docs_to_insert:
            await target_db[col_name].insert_many(docs_to_insert)

        restored_cnt = await target_db[col_name].count_documents({})
        restored_summary[col_name] = restored_cnt
        total_docs_restored += restored_cnt
        print(f"  [RESTAURACIÓN] Colección '{col_name:<15}': {restored_cnt:>6} docs en {target_db_name} -> ✓ RESTAURADO")

    print("\n" + "=" * 90)
    print("EVALUACIÓN DE EQUIVALENCIA DE DOCUMENTOS (ORIGEN vs. RESTAURADO)")
    print("=" * 90)

    mismatch = False
    for col_name, info in manifest["collections"].items():
        orig_cnt = info["document_count"]
        rest_cnt = restored_summary.get(col_name, 0)
        diff = abs(orig_cnt - rest_cnt)
        if diff != 0:
            mismatch = True
            print(f"  ❌ Discrepancia en '{col_name}': Origen={orig_cnt}, Restaurado={rest_cnt}, Dif={diff}")
        else:
            print(f"  ✓ Equivalencia 1:1 en '{col_name:<15}': {orig_cnt} docs == {rest_cnt} docs (Diferencia = 0)")

    if not mismatch:
        print("\n🏆 RESULTADO RESTAURACIÓN: ✓ PASS — CERO PÉRDIDA DE DATOS Y CONTEOS 1:1 EQUIVALENTES")
    else:
        print("\n❌ RESULTADO RESTAURACIÓN: FAIL — DISCREPANCIA EN DOCUMENTOS RESTAURADOS")

if __name__ == "__main__":
    asyncio.run(run_mongodb_restore())
