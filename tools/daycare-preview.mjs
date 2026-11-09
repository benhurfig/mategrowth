import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const endpoint='https://hdvjtezjhalzharqdyfv.supabase.co/functions/v1/submit-mategrowth-daycare';
export function createPreviewServer(root,options={}) {
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.woff2':'font/woff2','.json':'application/json'};
 return createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  try{
   if(url.pathname==='/api/daycare-lead'){
    if(req.method!=='POST'){res.writeHead(405);res.end();return}
    if(!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(req.headers.origin||'')){res.writeHead(403);res.end();return}
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return}chunks.push(chunk)}
    const request=new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://mategrowth.com'},body:Buffer.concat(chunks)});
    const response=await (options.sendRequest?options.sendRequest(request):fetch(request));
    res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());return;
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
   const pathname=decodeURIComponent(url.pathname);
   if(pathname.split('/').some(x=>x.startsWith('.')||['backend','tests','tools'].includes(x))){res.writeHead(404);res.end();return}
   if(pathname==='/daycare/config.js'){
    const source=await readFile(path.join(root,'daycare/config.js'),'utf8');const id=Object.hasOwn(options,'ga4MeasurementId')?options.ga4MeasurementId:(source.match(/ga4MeasurementId:\s*['"]([^'"]*)/)?.[1]||'');
    res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});res.end('window.MG_DAYCARE_CONFIG=Object.freeze('+JSON.stringify({endpoint:'/api/daycare-lead',ga4MeasurementId:id})+');');return;
   }
   let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
   const info=await stat(file);if(info.isDirectory())file=path.join(file,'index.html');
   const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(url.pathname==='/api/daycare-lead'?503:404,{'Content-Type':url.pathname==='/api/daycare-lead'?'application/json':'text/plain'});res.end(url.pathname==='/api/daycare-lead'?JSON.stringify({ok:false,error:'not_confirmed'}):'Not found')}
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 createPreviewServer(root).listen(Number(process.env.PORT||8124),'127.0.0.1',()=>console.log('MateGrowth preview: http://127.0.0.1:'+(process.env.PORT||8124)+'/daycare/ (real endpoint; submit authorized TESTE data only)'));
}
