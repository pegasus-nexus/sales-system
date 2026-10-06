# -*- coding: utf-8 -*-
with open('frontend/src/components/RegionalAndProductMix.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_month_logic = '''        } else {
            // Modo Mes (Julio 2026 vs Junio 2026)
            const yA = parseInt(currYear);
            startA = new Date(yA, currMonthIdx, 1, 0, 0, 0);
            endA = new Date(yA, currMonthIdx + 1, 0, 23, 59, 59, 999);

            const yB = parseInt(prevYear);
            startB = new Date(yB, prevMonthIdx, 1, 0, 0, 0);
            endB = new Date(yB, prevMonthIdx + 1, 0, 23, 59, 59, 999);
        }'''

new_month_logic = '''        } else {
            // Modo Mes con MTD (Month-To-Date)
            const yA = parseInt(currYear);
            startA = new Date(yA, currMonthIdx, 1, 0, 0, 0);
            
            const isCurrentMonth = now.getFullYear() === yA && now.getMonth() === currMonthIdx;
            
            if (isCurrentMonth) {
                // MTD para el mes actual
                endA = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else {
                // Mes completo
                endA = new Date(yA, currMonthIdx + 1, 0, 23, 59, 59, 999);
            }

            const yB = parseInt(prevYear);
            startB = new Date(yB, prevMonthIdx, 1, 0, 0, 0);
            
            if (isCurrentMonth) {
                // Comparar exactamente los mismos dias
                endB = new Date(yB, prevMonthIdx, now.getDate(), 23, 59, 59, 999);
            } else {
                endB = new Date(yB, prevMonthIdx + 1, 0, 23, 59, 59, 999);
            }
        }'''

if old_month_logic in content:
    content = content.replace(old_month_logic, new_month_logic)
    print("Logic patched.")
else:
    print("Could not find logic block.")

# Patching colors
content = content.replace("colorLight: '#cbd5e1'", "colorLight: '#94a3b8'")

with open('frontend/src/components/RegionalAndProductMix.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched RegionalAndProductMix.tsx")
