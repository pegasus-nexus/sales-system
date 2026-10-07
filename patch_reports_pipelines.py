import os

path = "backend/app/api/v1/endpoints/reports.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

import re

# Fix top_products_pipeline
target_top = """top_products_pipeline = [
        {"$match": {"sale_parent": {"$ne": []}}},"""
replacement_top = """top_products_pipeline = [
        {"$match": {"tenant_id": {"$exists": True}, "anulada": False}},
        {"$unwind": "$items"},
        {"$addFields": {
            "costo_unitario": "$items.costo_unitario",
            "cantidad": "$items.cantidad",
            "subtotal": "$items.subtotal",
            "descripcion": "$items.descripcion"
        }},"""
data = data.replace(target_top, replacement_top)

# Fix diaria_pipeline
target_diaria = """diaria_pipeline = [
        {"$match": {"sale_parent": {"$ne": []}}},"""
replacement_diaria = """diaria_pipeline = [
        {"$match": {"tenant_id": {"$exists": True}, "anulada": False}},
        {"$unwind": "$items"},
        {"$addFields": {
            "sale_date": "$created_at",
            "costo_unitario": "$items.costo_unitario",
            "cantidad": "$items.cantidad",
            "subtotal": "$items.subtotal",
            "descripcion": "$items.descripcion"
        }},"""
data = data.replace(target_diaria, replacement_diaria)

# Fix items_vendidos_pipeline
target_items = """items_vendidos_pipeline = [
        {"$match": {"sale_parent": {"$ne": []}}},"""
replacement_items = """items_vendidos_pipeline = [
        {"$match": {"tenant_id": {"$exists": True}, "anulada": False}},
        {"$unwind": "$items"},
        {"$addFields": {
            "costo_unitario": "$items.costo_unitario",
            "cantidad": "$items.cantidad",
            "subtotal": "$items.subtotal",
            "descripcion": "$items.descripcion"
        }},"""
data = data.replace(target_items, replacement_items)

# Fix the last pipeline around line 1655
target_last = """pipeline = [
        {"$match": match_stage},
        {"$lookup": {"from": "sales", "localField": "sale_id", "foreignField": "_id", "as": "sale_parent"}},
        {"$match": {"sale_parent": {"$ne": []}}},"""
replacement_last = """pipeline = [
        {"$match": {"tenant_id": {"$exists": True}, "anulada": False}},
        {"$unwind": "$items"},
        {"$addFields": {
            "sale_date": "$created_at",
            "costo_unitario": "$items.costo_unitario",
            "cantidad": "$items.cantidad",
            "subtotal": "$items.subtotal",
            "descripcion": "$items.descripcion",
            "producto_id": "$items.producto_id"
        }},
        {"$match": match_stage},"""
data = data.replace(target_last, replacement_last)

# Replace all SaleItem.get_pymongo_collection() with Sale.get_pymongo_collection()
data = data.replace("SaleItem.get_pymongo_collection()", "Sale.get_pymongo_collection()")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("reports.py patched")
