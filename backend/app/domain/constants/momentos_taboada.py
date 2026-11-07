from datetime import UTC, datetime

# Fecha oficial de inicio de la promoción Momentos Taboada
FECHA_INICIO_CAMPANA = datetime(2026, 11, 1, 0, 0, 0, tzinfo=UTC)

# 4 Premios oficiales iniciales según cartilla oficial
PREMIOS_DEFAULT = [
    {
        "codigo": "TAZA_NEGRA",
        "nombre": "Elegante taza negra",
        "descripcion": "1 taza negra con logo dorado",
        "sellos_requeridos": 5,
        "copago_bs": 19.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/taza_negra_taboada.jpg",
    },
    {
        "codigo": "TAZA_CORCHO",
        "nombre": "Tu taza de corcho",
        "descripcion": "1 taza con base de corcho y tapa",
        "sellos_requeridos": 10,
        "copago_bs": 39.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/taza_corcho_taboada.jpg",
    },
    {
        "codigo": "CORAZONES_DOS",
        "nombre": "Corazones para dos",
        "descripcion": "2 tazas con asa de corazón",
        "sellos_requeridos": 20,
        "copago_bs": 69.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/corazones_dos_taboada.jpg",
    },
    {
        "codigo": "CHOCO_ESPUMA",
        "nombre": "Chocolate con espuma",
        "descripcion": "1 batidora pequeña + 1 taza de corcho",
        "sellos_requeridos": 30,
        "copago_bs": 99.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/choco_espuma_taboada.jpg",
    },
]
