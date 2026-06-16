
from pathlib import Path
import json,re
pages=[]
for f in Path('../pages').glob('*.html'):
    txt=f.read_text(encoding='utf-8',errors='ignore')
    m=re.search(r'<title>(.*?)</title>',txt,re.I|re.S)
    title=m.group(1).strip() if m else f.stem.replace('_',' ').title()
    pages.append({'title':title,'file':f.name})
Path('pages.json').write_text(json.dumps(sorted(pages,key=lambda x:x['title']),indent=2))
print('generated')
