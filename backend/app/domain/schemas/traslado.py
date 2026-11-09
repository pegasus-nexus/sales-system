from typing import Literal

from pydantic import BaseModel, Field


class TrasladoItemCreate(BaseModel):
    producto_id: str
    cantidad: int = Field(gt=0)

class TrasladoCreate(BaseModel):
    destino_tipo: Literal['SUCURSAL', 'CLIENTE'] = 'SUCURSAL'
    sucursal_origen_id: str | None = None
    sucursal_destino_id: str | None = None
    cliente_destino_id: str | None = None
    cliente_destino_nombre: str | None = None
    notas: str | None = None
    items: list[TrasladoItemCreate] = Field(..., min_length=1)
    almacen_id: str = "default"          # Almacén ORIGEN del que sale el stock
    almacen_destino_id: str = "default"  # Almacén DESTINO donde recibirán el stock


class TrasladoItemReceive(BaseModel):
    producto_id: str
    cantidad_recibida: int = Field(ge=0)

class TrasladoReceive(BaseModel):
    notas: str | None = None
    items: list[TrasladoItemReceive]
