import asyncio
import os
import json
import hashlib
from datetime import datetime, timezone
from bson import json_util
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

# Colecciones internas de MongoDB que NUNCA deben respaldarse
SYSTEM_COLLECTIONS = frozenset({"system.profile", "system.views", "system.js"})


async def run_mongodb_backup():
    """
    Respaldo dinámico completo de MongoDB.
    Descubre automáticamente TODAS las colecciones en la base de datos
    en lugar de depender de una lista manual (que causó pérdida de datos).
    """
    print("=" * 90)
    print("PEGASUS SALES SYSTEM — RESPALDO DINÁMICO COMPLETO DE MONGODB")
    print("=" * 90)

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    db_name = db.name
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    backup_base_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backups"
    )
    target_backup_dir = os.path.join(backup_base_dir, f"backup_{timestamp_str}")
    os.makedirs(target_backup_dir, exist_ok=True)

    # Descubrimiento dinámico de TODAS las colecciones
    all_collections = await db.list_collection_names()
    collections_to_backup = sorted(
        [c for c in all_collections if c not in SYSTEM_COLLECTIONS]
    )

    if not collections_to_backup:
        print("ADVERTENCIA: No se encontraron colecciones para respaldar.")
        return

    manifest = {
        "db_name": db_name,
        "timestamp": timestamp_str,
        "backup_directory": target_backup_dir,
        "discovery_mode": "dynamic",
        "total_collections_found": len(collections_to_backup),
        "collections": {},
    }

    total_docs_backed_up = 0

    print(f"\nBase de Datos Origen: {db_name}")
    print(f"Directorio de Salida: {target_backup_dir}")
    print(f"Colecciones descubiertas: {len(collections_to_backup)}\n")

    for col_name in collections_to_backup:
        cursor = db[col_name].find({})
        docs = await cursor.to_list(length=None)
        doc_count = len(docs)

        col_file_path = os.path.join(target_backup_dir, f"{col_name}.jsonl")
        with open(col_file_path, "w", encoding="utf-8") as f:
            for doc in docs:
                f.write(json_util.dumps(doc) + "\n")

        file_size = os.path.getsize(col_file_path)
        manifest["collections"][col_name] = {
            "document_count": doc_count,
            "file_size_bytes": file_size,
        }
        total_docs_backed_up += doc_count
        print(
            f"  [RESPALDO] '{col_name:<30}': {doc_count:>6} docs | "
            f"{file_size:>10} bytes -> [PASS]"
        )

    manifest["total_documents"] = total_docs_backed_up
    manifest_path = os.path.join(target_backup_dir, "inventory_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Generacion de CHECKSUM SHA-256
    sha256_hash = hashlib.sha256()
    for root, _, files in os.walk(target_backup_dir):
        for names in sorted(files):
            if names != "checksum_sha256.txt":
                filepath = os.path.join(root, names)
                with open(filepath, "rb") as f:
                    for byte_block in iter(lambda: f.read(65536), b""):
                        sha256_hash.update(byte_block)

    checksum_hex = sha256_hash.hexdigest()
    checksum_path = os.path.join(target_backup_dir, "checksum_sha256.txt")
    with open(checksum_path, "w", encoding="utf-8") as f:
        f.write(checksum_hex)

    print("\n" + "=" * 90)
    print("INVENTARIO Y RESUMEN DEL DUMP CON SHA-256")
    print("=" * 90)
    print(f"  Colecciones Respaldadas: {len(collections_to_backup)}")
    print(f"  Documentos Resguardados: {total_docs_backed_up} docs")
    print(f"  Checksum SHA-256:        {checksum_hex}")
    print(f"  Manifest JSON:           {manifest_path}")
    print("[PASS] RESPALDO COMPLETO DINÁMICO FINALIZADO CON CÓDIGO 0")


if __name__ == "__main__":
    asyncio.run(run_mongodb_backup())
