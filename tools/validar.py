#!/usr/bin/env python3
"""Basic static QA with the Python standard library. No network calls."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,sys
ROOT=Path(__file__).resolve().parent.parent
class PageParser(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.links=[];self.ids=[];self.h1=0;self.titles=0;self.jsons=[];self.current_json=None;self.lang=''
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang','')
  if tag=='h1':self.h1+=1
  if tag=='title':self.titles+=1
  if a.get('id'):self.ids.append(a['id'])
  for k in ['src','href','poster']:
   if a.get(k):self.links.append(a[k])
  if tag=='script' and a.get('type') in ('application/json','application/ld+json'):self.current_json=''
 def handle_data(self,data):
  if self.current_json is not None:self.current_json+=data
 def handle_endtag(self,tag):
  if tag=='script' and self.current_json is not None:self.jsons.append(self.current_json);self.current_json=None
pages={};errors=[]
for p in ROOT.rglob('*.html'):
 parser=PageParser();parser.feed(p.read_text(encoding='utf-8'));pages[p.resolve()]=parser
for p,s in pages.items():
 rel=str(p.relative_to(ROOT));new='assets/v2/site.css' in p.read_text(encoding='utf-8')
 if new:
  if s.h1!=1:errors.append(f'{rel}: quantidade de H1 = {s.h1}')
  if s.titles!=1:errors.append(f'{rel}: quantidade de title = {s.titles}')
  if not s.lang:errors.append(f'{rel}: lang ausente')
  if len(s.ids)!=len(set(s.ids)):errors.append(f'{rel}: IDs duplicados')
  for text in s.jsons:
   try:json.loads(text)
   except json.JSONDecodeError:errors.append(f'{rel}: JSON inválido')
 for raw in s.links:
  u=urlsplit(raw)
  if u.scheme or u.netloc:continue
  target=(ROOT/unquote(u.path).lstrip('/')) if u.path.startswith('/') else ((p.parent/unquote(u.path)) if u.path else p)
  target=target.resolve()
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{rel}: arquivo ausente {raw}');continue
  if u.fragment and target in pages and u.fragment not in pages[target].ids:errors.append(f'{rel}: âncora ausente {raw}')
print(f'{len(pages)} páginas HTML verificadas.')
if errors:
 print('\n'.join(errors));sys.exit(1)
print('PASS: links e assets locais, âncoras, H1, títulos, IDs e JSON verificados.')
print('Este teste não verifica serviços externos, envio de mensagens nem comportamento em produção.')
