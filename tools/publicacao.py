#!/usr/bin/env python3
"""Toggle local review/indexing state. Does not deploy, push, or modify campaign offers."""
from pathlib import Path
import argparse,json,re
ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description=__doc__)
g=parser.add_mutually_exclusive_group(required=True)
g.add_argument('--liberar-indexacao',action='store_true')
g.add_argument('--proteger-indexacao',action='store_true')
a=parser.parse_args()
value='index, follow' if a.liberar_indexacao else 'noindex, follow'
paths=json.loads((ROOT/'tools/routes.json').read_text(encoding='utf-8'))
changed=0
for rel in paths:
 p=(ROOT/rel).resolve()
 if not p.is_relative_to(ROOT) or p.suffix!='.html':raise RuntimeError('Caminho inválido: '+rel)
 raw=p.read_text(encoding='utf-8')
 new,n=re.subn(r'<meta name="robots" content="[^"]+">','<meta name="robots" content="'+value+'">',raw,count=1)
 if n!=1:raise RuntimeError('Meta robots ausente: '+rel)
 if a.liberar_indexacao:new=new.replace('<!-- REVIEW BUILD: release indexing only after approval. See LEIA-ME.md. -->','<!-- Indexing approved locally. -->')
 else:new=new.replace('<!-- Indexing approved locally. -->','<!-- REVIEW BUILD: release indexing only after approval. See LEIA-ME.md. -->')
 if new!=raw:
  tmp=p.with_suffix('.tmp');tmp.write_text(new,encoding='utf-8');tmp.replace(p);changed+=1
print(f'{changed} arquivo(s) atualizado(s): robots = {value}')
print('Somente arquivos locais foram alterados. Nenhum deploy, commit ou push foi realizado.')
print('Ofertas preservadas e páginas 404 não foram alteradas. Revise-as separadamente.')
