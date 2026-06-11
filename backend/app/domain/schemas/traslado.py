from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class TrasladoItemCreate(BaseModel):
    producto_id: str
    cantidad: int = Field(gt=0)

class TrasladoCreate(BaseModel):
    destino_tipo: Literal['SUCURSAL', 'CLIENTE'] = 'SUCURSAL'
    sucursal_destino_id: Optional[str] = None
    cliente_destino_id: Optional[str] = None
    cliente_destino_nombre: Optional[str] = None
    notas: Optional[str] = None
    items: List[TrasladoItemCreate] = Field(..., min_length=1)
    almacen_id: str = "default"          # Almacén ORIGEN del que sale el stock
    almacen_destino_id: str = "default"  # Almacén DESTINO donde recibirán el stock


class TrasladoItemReceive(BaseModel):
    producto_id: str
    cantidad_recibida: int = Field(ge=0)

class TrasladoReceive(BaseModel):
    notas: Optional[str] = None
    items: List[TrasladoItemReceive]
