import urllib.request
import json

urls = [
    'https://dlmm.datapi.meteora.ag/pools?page=1&page_size=2',
    'https://damm-v2.datapi.meteora.ag/pools?page=1&page_size=2',
]

for url in urls:
    print('URL:', url)
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            data = json.load(r)
        print(json.dumps(data, indent=2)[:8000])
    except Exception as e:
        print('ERROR:', e)
    print('---')
