"""Verify the explicit public file allow-list, corpus, model and reviewed rows."""
from pathlib import Path
import gzip
import hashlib
import json
import subprocess

ROOT=Path(__file__).resolve().parents[1]

def digest(payload):
    return hashlib.sha256(payload).hexdigest()

def row_digest(rows):
    return digest(json.dumps(rows,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())

def verify(root=ROOT,check_tracked=True):
    root=Path(root)
    manifest=json.loads((root/'public-release-manifest.json').read_text())
    allowed={item['path'] for item in manifest['files']}|{'public-release-manifest.json'}
    for item in manifest['files']:
        path=root/item['path']
        if not path.is_file():raise ValueError('Missing approved file: '+item['path'])
        if digest(path.read_bytes())!=item['sha256']:raise ValueError('Changed approved file: '+item['path'])
    if check_tracked and (root/'.git').exists():
        tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0'))-{''}
        if tracked!=allowed:raise ValueError('Tracked paths differ from approved public file list: '+str(sorted(tracked^allowed)))
    excluded=('review/','research/','private-reference/','output/','portfolio/release/v1/','portfolio/release/v2/')
    if any(path.startswith(excluded) for path in allowed):raise ValueError('Private or archived path in public manifest')
    if any(path.endswith(('.pkl','.pickle')) and path!='models/v2/model.pkl' for path in allowed):
        raise ValueError('Only the released v2 model may be published')
    data=json.loads((root/'portfolio/src/data.json').read_text())
    if set(data['queries'])!=set(manifest['queries']):raise ValueError('Unreviewed query in report')
    for key,record in manifest['queries'].items():
        rows=data['queries'][key]['rows']
        if row_digest(rows)!=record['rows_sha256'] or len(rows)!=record['rows']:raise ValueError('Reviewed rows changed: '+key)
    annual=data['queries']['annual']['rows']
    if any(row['scoring_method']!='contextual_rationale_v2' or row['threshold']!='supported' for row in annual):
        raise ValueError('Only visible v2 supported-score rows belong in this release')
    corpus=json.loads((root/'data/corpus/manifest.json').read_text())
    for name,record in corpus.items():
        raw=gzip.decompress((root/record['path']).read_bytes())
        if digest(raw)!=record['uncompressed_sha256']:raise ValueError('Corpus input changed: '+name)
        if len(raw.splitlines())!=record['rows']:raise ValueError('Corpus row count changed: '+name)
    model=json.loads((root/'models/v2/manifest.json').read_text())
    if digest((root/'models/v2/model.pkl').read_bytes())!=model['model_sha256']:raise ValueError('Released model changed')
    build=json.loads((root/'portfolio/release/data-app-build.json').read_text())
    for field in ['html','snapshot']:
        record=build[field]
        if digest((root/'portfolio/release'/record['path']).read_bytes())!=record['sha256']:raise ValueError('Compiled release mismatch: '+field)
    snapshot=json.loads((root/'portfolio/release'/build['snapshot']['path']).read_text())
    if snapshot!=data:raise ValueError('Compiled report snapshot differs from source')
    if manifest['repository_url']!='https://github.com/playaditox/sotu-foreign-policy-analysis-v2':raise ValueError('Wrong repository destination')
    return {'files':len(allowed),'queries':len(data['queries']),'documents':corpus['documents']['rows'],'sentences':corpus['sentences']['rows']}

if __name__=='__main__':
    print(json.dumps(verify(),indent=2))
