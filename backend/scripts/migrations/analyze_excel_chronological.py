import os
import pandas as pd

def analyze_xlsx(path):
    print(f"\n=======================================================")
    print(f"ANALYZING: {path}")
    print(f"=======================================================")
    if not os.path.exists(path):
        print("File does not exist")
        return
    
    # Read the excel file
    df = pd.read_excel(path)
    
    # Let's inspect the columns
    print("Columns:", df.columns.tolist())
    
    # Convert FECHA to datetime for proper sorting
    df['FECHA'] = pd.to_datetime(df['FECHA'])
    
    # Sort by FECHA ascending (oldest first)
    df_sorted = df.sort_values(by='FECHA').reset_index(drop=True)
    
    # Let's calculate a "calculated stock" starting from the first movement
    calc_stock = []
    current = 0
    for idx, row in df_sorted.iterrows():
        qty = row['CANTIDAD']
        # If it's an AJUSTE FISICO, sometimes it sets the stock, or does it add?
        # Let's see what the tipo movimiento is.
        tipo = row['TIPO MOVIMIENTO']
        
        # Let's see how the system updates current.
        # In typical inventory systems:
        # If AJUSTE FISICO: does it override the stock or add/subtract?
        # Let's calculate both or look at the database.
        # Let's just print each row with its index, fecha, tipo, cantidad, stock_resultante, and other columns.
        pass
        
    # Print the sorted dataframe
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    print(df_sorted[['FECHA', 'TIPO MOVIMIENTO', 'CANTIDAD', 'STOCK RESULTANTE', 'Unnamed: 5', 'USUARIO', 'NOTAS']])

path1 = r"c:\Users\rodri\Desktop\Taboada System\SalesSystem\otros\error de conteo inventario 1.xlsx"
path2 = r"c:\Users\rodri\Desktop\Taboada System\SalesSystem\otros\error de conteo inventario 2.xlsx"

analyze_xlsx(path1)
analyze_xlsx(path2)
