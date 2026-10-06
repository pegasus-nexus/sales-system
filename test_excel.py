import pandas as pd
df1 = pd.read_excel("exports/2026 Heroinas.xlsx")
print("2026 Heroinas columns:", df1.columns.tolist())
print(df1.head(2))
