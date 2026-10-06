import os
import re

path1 = 'frontend/src/components/ExpensesReportView.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    data1 = f.read()

# fix unused warnings by using them in the filter
data1 = re.sub(
    r"const handleApplyFilters = \(\) => \{\s+setAppliedFilters\(\{",
    "const handleApplyFilters = () => {\n        setAppliedFilters({",
    data1
)

data1 = data1.replace("category: draftCategory\n        });", "category: draftCategory,\n            subcategory: draftSubcategory\n        });")

with open(path1, 'w', encoding='utf-8') as f:
    f.write(data1)


path2 = 'frontend/src/pages/CajaPage.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    data2 = f.read()

# I patched CajaPage but maybe the handleGasto logic missed it
data2 = data2.replace(
    "subcategoria_id: undefined,",
    "subcategoria_id: gastoSubCategId || undefined,"
)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(data2)

print("Warnings fixed")
