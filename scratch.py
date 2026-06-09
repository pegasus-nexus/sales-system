import pandas as pd

rows = [
    {"SUCURSAL": "CENTRAL", "PRODUCTO": "A", "CANTIDAD": 10, "P. COSTO": 5, "P. PÚBLICO": 10},
    {"SUCURSAL": "ALTO", "PRODUCTO": "A", "CANTIDAD": 5, "P. COSTO": 5, "P. PÚBLICO": 10},
    {"SUCURSAL": "CENTRAL", "PRODUCTO": "B", "CANTIDAD": 2, "P. COSTO": 20, "P. PÚBLICO": 30},
]
df = pd.DataFrame(rows)

pivot_df = df.pivot_table(
    index=['PRODUCTO', 'P. COSTO', 'P. PÚBLICO'],
    columns='SUCURSAL',
    values='CANTIDAD',
    aggfunc='sum',
    fill_value=0
).reset_index()

# Sumar cantidades de las sucursales
sucursales = df['SUCURSAL'].unique().tolist()
pivot_df['TOTAL CANTIDAD'] = pivot_df[sucursales].sum(axis=1)
pivot_df['VALOR COSTO TOTAL'] = pivot_df['TOTAL CANTIDAD'] * pivot_df['P. COSTO']
pivot_df['VALOR PÚBLICO TOTAL'] = pivot_df['TOTAL CANTIDAD'] * pivot_df['P. PÚBLICO']

print(pivot_df)
