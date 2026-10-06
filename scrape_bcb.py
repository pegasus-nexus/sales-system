import urllib.request
from bs4 import BeautifulSoup
import re

try:
    req = urllib.request.Request('https://www.bcb.gob.bo/', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # find any div or span with '12,22' or 'dólar'
    for el in soup.find_all(string=re.compile(r'12,22|d.lar', re.IGNORECASE)):
        print("Found matching string:", el.strip())
        parent = el.parent
        print("Parent classes:", parent.get('class'))
        print("Parent text:", parent.get_text(strip=True))
        print("---")
        
except Exception as e:
    print('Error:', e)
