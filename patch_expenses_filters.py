import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target_filters_state = '''    const [draftCategory, setDraftCategory] = useState('all');

    // Applied Filters
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: today,
        endDate: today,
        sucursal: defaultSucursal,
        category: 'all'
    });

    const isFilterDirty = draftStartDate !== appliedFilters.startDate ||
                          draftEndDate !== appliedFilters.endDate ||
                          draftSucursal !== appliedFilters.sucursal ||
                          draftCategory !== appliedFilters.category;

    const handleApplyFilters = () => {
        setAppliedFilters({
            startDate: draftStartDate,
            endDate: draftEndDate,
            sucursal: draftSucursal,
            category: draftCategory
        });
    };'''

replacement_filters_state = '''    const [draftCategory, setDraftCategory] = useState('all');
    const [draftSubcategory, setDraftSubcategory] = useState('all');

    // Applied Filters
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: today,
        endDate: today,
        sucursal: defaultSucursal,
        category: 'all',
        subcategory: 'all'
    });

    const isFilterDirty = draftStartDate !== appliedFilters.startDate ||
                          draftEndDate !== appliedFilters.endDate ||
                          draftSucursal !== appliedFilters.sucursal ||
                          draftCategory !== appliedFilters.category ||
                          draftSubcategory !== appliedFilters.subcategory;

    const handleApplyFilters = () => {
        setAppliedFilters({
            startDate: draftStartDate,
            endDate: draftEndDate,
            sucursal: draftSucursal,
            category: draftCategory,
            subcategory: draftSubcategory
        });
    };'''

data = data.replace(target_filters_state, replacement_filters_state)

target_query = '''    const { data: reportData, isLoading } = useQuery({
        queryKey: ['expenses-report', appliedFilters.startDate, appliedFilters.endDate, appliedFilters.sucursal, appliedFilters.category],
        queryFn: () => getExpensesReport(appliedFilters.startDate, appliedFilters.endDate, appliedFilters.sucursal, appliedFilters.category)
    });'''

replacement_query = '''    const { data: reportData, isLoading } = useQuery({
        queryKey: ['expenses-report', appliedFilters.startDate, appliedFilters.endDate, appliedFilters.sucursal, appliedFilters.category, appliedFilters.subcategory],
        queryFn: () => getExpensesReport(appliedFilters.startDate, appliedFilters.endDate, appliedFilters.sucursal, appliedFilters.category, appliedFilters.subcategory)
    });'''

data = data.replace(target_query, replacement_query)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Filters state patched.")
