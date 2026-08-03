import pandas as pd
df = pd.read_excel("plan_implementations/2026_Heroinas.xlsx")
# The time could be in HORA or FECHA.1
if "HORA" in df.columns:
    print(df["HORA"].unique())
elif "FECHA.1" in df.columns:
    print(pd.to_datetime(df["FECHA.1"]).dt.hour.unique())
