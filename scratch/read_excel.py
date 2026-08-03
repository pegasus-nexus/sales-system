import pandas as pd
import sys

def main():
    files = [
        "plan_implementations/2024_Heroinas.xlsx",
        "plan_implementations/2025_Heroinas.xlsx",
        "plan_implementations/2026_Heroinas.xlsx"
    ]
    
    for f in files:
        print(f"--- {f} ---")
        try:
            df = pd.read_excel(f)
            print(df.head())
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
