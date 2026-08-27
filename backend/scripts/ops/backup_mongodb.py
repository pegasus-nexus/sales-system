import asyncio
import os
import json
import hashlib
from datetime import datetime
from bson import json_util
from app.db import get_raw_db
from app.infrastructure.core.config import settings


async def run_mongodb_backup():
    print("=" * 90)
    print("EJECUTANDO SCRIPT OPERATIVO DE RESPALDO DE BASE DE DATOS MONGODB")
    print("PEGASUS SALES SYSTEM — BASELINE CONGELADO (COMMIT afc8029)")
    print("=" * 90)

    db = await get_raw_db()
    db_name = db.name
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")

    backup_base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backups")
    target_backup_dir = os.path.join(backup_base_dir, f"backup_{timestamp_str}")
    os.makedirs(target_backup_dir, exist_ok=True)

    collections_to_backup = [
        "sales", "products", "inventario", "clientes",
        "sucursales", "descuentos", "audit_logs", "users", "tenants"
    ]

    manifest = {
        "db_name": db_name,
        "timestamp": timestamp_str,
        "backup_directory": target_backup_dir,
        "collections": {}
    }

    total_docs_backed_up = 0

    print(f"\nBase de Datos Origen: {db_name}")
    print(f"Directorio de Salida: {target_backup_dir}\n")

    for col_name in collections_to_backup:
        cursor = db[col_name].find({})
        docs = await cursor.to_list(length=None)
        doc_count = len(docs)

        col_file_path = os.path.join(target_backup_dir, f"{col_name}.jsonl")
        with open(col_file_path, "w", encoding="utf-8") as f:
            for doc in docs:
                f.write(json_util.dumps(doc) + "\n")

        manifest["collections"][col_name] = {
            "document_count": doc_count,
            "file_size_bytes": os.path.getsize(col_file_path)
        }
        total_docs_backed_up += doc_count
        print(f"  [RESPALDO] Colección '{col_name:<15}': {doc_count:>6} docs | {os.path.getsize(col_file_path):>8} bytes -> ✓ HECHO")

    manifest["total_documents"] = total_docs_backed_up
    manifest_path = os.path.join(target_backup_dir, "inventory_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Generación de CHECKSUM SHA-256
    sha256_hash = hashlib.sha256()
    for root, _, files in os.walk(target_backup_dir):
        for names in sorted(files):
            if names != "checksum_sha256.txt":
                filepath = os.path.join(root, names)
                with open(filepath, 'rb') as f:
                    for byte_block in iter(lambda: f.read(65536), b""):
                        sha256_hash.update(byte_block)

    checksum_hex = sha256_hash.hexdigest()
    checksum_path = os.path.join(target_backup_dir, "checksum_sha256.txt")
    with open(checksum_path, "w", encoding="utf-8") as f:
        f.write(checksum_hex)

    print("\n" + "=" * 90)
    print("INVENTARIO Y RESUMEN DEL DUMP ENCRIPTADO CON SHA-256")
    print("=" * 90)
    print(f"  Documentos Resguardados: {total_docs_backed_up} docs")
    print(f"  Checksum SHA-256:        {checksum_hex}")
    print(f"  Manifest JSON:           {manifest_path}")
    print("✓ RESPALDO COMPLETADO CON CÓDIGO 0")

if __name__ == "__main__":
    asyncio.run(run_mongodb_backup())
