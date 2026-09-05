with open('backend/app/application/services/bi_pandas_service.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('HourlyIntelligentAnalysisItem,', '')
c = c.replace('HourlyIntelligentAnalysisItem', 'HourlyDistributionItemBI')

with open('backend/app/application/services/bi_pandas_service.py', 'w', encoding='utf-8') as f:
    f.write(c)

with open('backend/app/schemas/bi.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('HourlyIntelligentAnalysisItem', 'HourlyDistributionItemBI')

with open('backend/app/schemas/bi.py', 'w', encoding='utf-8') as f:
    f.write(c)
