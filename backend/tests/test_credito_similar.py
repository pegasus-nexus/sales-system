import pytest
import difflib

def test_similarity_algorithm_sequence_matcher():
    # Coincidencia con abreviaciones o segundo nombre
    score1 = difflib.SequenceMatcher(None, "JUAN CARLOS PEREZ", "JUAN C PEREZ").ratio()
    assert score1 > 0.75

    # Coincidencia idéntica
    score2 = difflib.SequenceMatcher(None, "MARIA LOPEZ", "MARIA LOPEZ").ratio()
    assert score2 == 1.0

    # Personas claramente distintas
    score3 = difflib.SequenceMatcher(None, "JUAN PEREZ", "RODRIGO MARTINEZ").ratio()
    assert score3 < 0.40

def test_contained_name_heuristic():
    # Nombre corto dentro de nombre largo
    buscado = "JUAN PEREZ"
    existente = "JUAN PEREZ FLORES"
    es_contenido = buscado in existente or existente in buscado
    assert es_contenido is True
