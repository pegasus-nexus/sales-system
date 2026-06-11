from beanie import Document

# Compatibilidad entre distintas versiones de Beanie (get_pymongo_collection vs get_motor_collection)
if not hasattr(Document, "get_pymongo_collection") and hasattr(Document, "get_motor_collection"):
    Document.get_pymongo_collection = Document.get_motor_collection
elif not hasattr(Document, "get_motor_collection") and hasattr(Document, "get_pymongo_collection"):
    Document.get_motor_collection = Document.get_pymongo_collection
