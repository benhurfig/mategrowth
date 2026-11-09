// Public contact endpoint. No database writes or CRM integration.
export const RECIPIENT = 'mategrowthus@gmail.com';
export const SENDER = 'SmartMate <support@smartimateapp.com>';
const ORIGINS = new Set(['https://mategrowth.com', 'https://www.mategrowth.com']);
const IDS = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ATTRIBUTION = new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','gclid','fbclid']);
const OPTIONS = {
 program:['home','center','pre'], capacity:['up_to_6','7_10','11_20','21_50','51_100','101_plus'],
 openings:['0','1_2','3_5','6_10','11_plus'], maps:['yes','no','unsure'], siteStatus:['professional','update','none'],
 goal:['spots','google','site','ads','follow','other'], channel:['whatsapp','email','phone']
};
const LABELS = {
 pt: {program:'Tipo de daycare',capacity:'Capacidade',openings:'Vagas a preencher',maps:'Perfil no Google Maps',siteStatus:'Website atual',goal:'Prioridade',business:'Nome da daycare',city:'Cidade',state:'Estado',name:'Nome completo',channel:'Contato preferido',contact:'Contato',group:'Idades / turma ou unidade prioritária',website:'Link do site ou perfil Google',ads:'Programa a divulgar',follow:'Como acompanha pedidos de visita',other:'Outra necessidade'},
 en: {program:'Program type',capacity:'Capacity',openings:'Openings to fill',maps:'Google Maps profile',siteStatus:'Current website',goal:'Priority',business:'Program name',city:'City',state:'State',name:'Full name',channel:'Preferred follow-up',contact:'Contact',group:'Ages / priority classroom or location',website:'Website or Google profile',ads:'Program to promote',follow:'Current tour follow-up process',other:'Other needs'}
};
const VALUES = {
 pt:{home:'Home / Family Child Care',center:'Child Care Center',pre:'Preschool',up_to_6:'Até 6','7_10':'7–10','11_20':'11–20','21_50':'21–50','51_100':'51–100', '101_plus':'101+', '1_2':'1–2','3_5':'3–5','6_10':'6–10', '11_plus':'11+', yes:'Sim',no:'Ainda não',unsure:'Não sei',professional:'Sim, tenho um website profissional',update:'Sim, mas precisa de ajustes',none:'Ainda não',spots:'Preencher vagas',google:'Aparecer no Google e Maps',site:'Criar ou melhorar o website',ads:'Divulgar com anúncios',follow:'Organizar visitas e retornos',other:'Outra necessidade',whatsapp:'WhatsApp',email:'E-mail',phone:'Ligação'},
 en:{home:'Home / Family Child Care',center:'Child Care Center',pre:'Preschool',up_to_6:'Up to 6','7_10':'7–10','11_20':'11–20','21_50':'21–50','51_100':'51–100','101_plus':'101+','1_2':'1–2','3_5':'3–5','6_10':'6–10','11_plus':'11+',yes:'Yes',no:'Not yet',unsure:'Not sure',professional:'Yes, a professional website',update:'Yes, it needs updating',none:'Not yet',spots:'Fill openings',google:'Show up on Google and Maps',site:'Create or update our website',ads:'Run local ads',follow:'Manage tours and follow-ups',other:'Something else',whatsapp:'WhatsApp',email:'Email',phone:'Phone call'}
};
// Keep the legacy single-priority email byte-for-byte stable for idempotent retries.
const fields = Object.keys(LABELS.pt);
const TIME_OPTIONS = ['morning','afternoon','late_afternoon','any','other'];
const TIME_LABELS = {
 pt:{morning:'Manhã',afternoon:'Tarde',late_afternoon:'Fim da tarde',any:'Sem preferência',other:'Outro horário'},
 en:{morning:'Morning',afternoon:'Afternoon',late_afternoon:'Late afternoon',any:'No preference',other:'Another time'}
};
const AD_TOPICS={openings_now:'Vagas abertas agora',future_enrollment:'Matrículas para uma turma ou data futura',local_awareness:'Minha daycare para mais famílias da região',other:'Outro'};
const answerFields = [...fields,'goals','contactTime','contactTimeOther','adTopics','adsOther'];
const conditional = goal => ({spots:'group',google:'website',site:'website',ads:'ads',follow:'follow',other:'other'})[goal];
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
export function validate(payload) {
 const errors = [];
 if (!plain(payload)) return {errors:['payload']};
 const top = new Set(['submissionId','locale','pagePath','answers','attribution','companyWebsite']);
 if (Object.keys(payload).some(k=>!top.has(k))) errors.push('payload');
 if (!IDS.test(payload.submissionId || '')) errors.push('submissionId');
 if (!['pt-BR','en'].includes(payload.locale)) errors.push('locale');
 if (payload.pagePath !== (payload.locale === 'en' ? '/daycare/en/' : '/daycare/')) errors.push('pagePath');
 if (typeof payload.companyWebsite !== 'string' || payload.companyWebsite !== '') errors.push('companyWebsite');
 const a = payload.answers;
 if (!plain(a)) return {errors:[...errors,'answers']};
 if (Object.keys(a).some(k=>!answerFields.includes(k))) errors.push('answers');
 const answers = {};
 for (const key of answerFields.filter(k=>k!=='goals'&&k!=='adTopics')) {
  if (a[key] === undefined) continue;
  if (typeof a[key] !== 'string' || /[\u0000-\u001f\u007f]/.test(a[key]) || a[key].length > (['business','city','name'].includes(key)?100:key==='state'?50:250)) {errors.push(key);continue;}
  answers[key]=a[key].trim();
 }
 const multiple = Object.hasOwn(a,'goals');
 if (multiple) {
  if (Object.hasOwn(a,'goal') || !Array.isArray(a.goals) || !a.goals.length || a.goals.length>OPTIONS.goal.length || new Set(a.goals).size!==a.goals.length || a.goals.some(v=>!OPTIONS.goal.includes(v))) errors.push('goals');
  else answers.goals=OPTIONS.goal.filter(v=>a.goals.includes(v));
 }
 for (const [key,values] of Object.entries(OPTIONS)) if (!(multiple&&key==='goal')&&!values.includes(answers[key])) errors.push(key);
 if (answers.contactTime && !TIME_OPTIONS.includes(answers.contactTime)) errors.push('contactTime');
 if (answers.contactTime==='other' && !answers.contactTimeOther) errors.push('contactTimeOther');
 if (answers.contactTimeOther && (answers.contactTime!=='other'||answers.contactTimeOther.length>100)) errors.push('contactTimeOther');
 for (const key of ['business','city','state','name','contact']) if (!answers[key] || (key!=='contact' && answers[key].length<2)) errors.push(key);
 if (answers.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.contact || '')) errors.push('contact');
 if (answers.channel !== 'email' && (!/^[+()\d .-]+$/.test(answers.contact || '') || !/^\d{7,15}$/.test((answers.contact||'').replace(/\D/g,'')))) errors.push('contact');
 const details=new Set((multiple?(answers.goals||[]):[answers.goal]).map(conditional).filter(Boolean));
 const hasAdTopics=Object.hasOwn(a,'adTopics');
 if(hasAdTopics){
  if(payload.locale!=='pt-BR'||!multiple||!details.has('ads')||Object.hasOwn(a,'ads')||!Array.isArray(a.adTopics)||!a.adTopics.length||a.adTopics.length>4||new Set(a.adTopics).size!==a.adTopics.length||a.adTopics.some(v=>!Object.hasOwn(AD_TOPICS,v)))errors.push('adTopics');
  else answers.adTopics=Object.keys(AD_TOPICS).filter(v=>a.adTopics.includes(v));
  if(answers.adTopics?.includes('other')&&!answers.adsOther)errors.push('adsOther');
  details.delete('ads');
 }
 if(answers.adsOther&&(!hasAdTopics||!answers.adTopics?.includes('other')))errors.push('adsOther');
 for(const detail of details)if(detail!=='website'&&!answers[detail])errors.push(detail);
 if (details.has('website') && answers.website) {try {const u=new URL(answers.website);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)errors.push('website');}catch{errors.push('website');}}
 for (const key of ['group','website','ads','follow','other']) if (!details.has(key) && answers[key]) errors.push(key);
 const attribution={};
 if (!plain(payload.attribution)) errors.push('attribution');
 else for (const [key,value] of Object.entries(payload.attribution)) {
  if (!ATTRIBUTION.has(key)||typeof value!=='string'||value.length>200||/[\u0000-\u001f\u007f]/.test(value)) errors.push('attribution');
  else if(value.trim())attribution[key]=value.trim();
 }
 return {errors:[...new Set(errors)],data:{submissionId:payload.submissionId,locale:payload.locale,pagePath:payload.pagePath,answers,attribution,companyWebsite:''}};
}
export function buildEmail(data) {
 const l=data.locale==='en'?'en':'pt',a=data.answers,labels=LABELS[l],values=VALUES[l];
 const subject=(/^TESTE(?:\b|\s|[-:])/i.test(a.business)?'[TESTE] ':'')+(l==='pt'?'Nova lead':'New lead')+' | '+(a.goals?a.goals.map(k=>values[k]).join(' + '):values[a.goal])+' | '+a.city+', '+a.state;
 const rows=fields.filter(k=>a[k]).map(k=>labels[k]+': '+(OPTIONS[k]?values[a[k]]||a[k]:a[k]));
 if(a.goals){
  const at=fields.indexOf('goal');
  rows.splice(at,0,(l==='pt'?'Prioridades: ':'Priorities: ')+a.goals.map(k=>values[k]).join('; '));
  const time=a.contactTime==='other'?a.contactTimeOther:TIME_LABELS[l][a.contactTime];
  rows.push((l==='pt'?'Horário preferido (horário local da lead): ':'Preferred contact time (lead’s local time): ')+(time||(l==='pt'?'Não informado':'Not provided')));
 }
 if(a.adTopics){
  rows.push('Objetivos dos anúncios: '+a.adTopics.map(k=>AD_TOPICS[k]).join('; '));
  if(a.adsOther)rows.push('Outro objetivo dos anúncios: '+a.adsOther);
  if(a.group)rows.push('Informação de idade/turma para os anúncios: usar a resposta de vagas acima.');
 }
 const text=['MateGrowth — Daycare',...rows,'','Idioma / Language: '+data.locale,'Página / Page: '+data.pagePath,'','Origem / Campaign',...Object.entries(data.attribution).map(([k,v])=>k+': '+v),'','Request ID: '+data.submissionId,'CRM: cadastro manual / manual entry'].join('\n');
 return {from:SENDER,to:[RECIPIENT],subject,text,...(a.channel==='email'?{reply_to:a.contact}:{})};
}
async function limitedJson(request) {
 const reader=request.body?.getReader();if(!reader)throw Error('json');
 let bytes=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();throw Error('size');}chunks.push(value);}
 const body=new Uint8Array(bytes);let at=0;for(const x of chunks){body.set(x,at);at+=x.length;}
 return JSON.parse(new TextDecoder().decode(body));
}
// Warm-isolate abuse guard; provider idempotency is authoritative across isolates.
const attempts=new Map(),inFlight=new Map(),accepted=new Map();
export async function handleRequest(request, env={}, dependencies={}) {
 const origin=request.headers.get('origin')||'';
 const allowed=ORIGINS.has(origin)||(dependencies.allowLocal===true&&/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin));
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin}:{})};
 const respond=(status,value)=>new Response(JSON.stringify(value),{status,headers});
 if(!allowed)return respond(403,{ok:false,error:'origin_not_allowed'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
 if(request.method!=='POST')return respond(405,{ok:false,error:'method_not_allowed'});
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return respond(415,{ok:false,error:'json_required'});
 let payload;try{payload=await limitedJson(request);}catch(error){return respond(error.message==='size'?413:400,{ok:false,error:'invalid_payload'});}
 const checked=validate(payload);if(checked.errors.length)return respond(422,{ok:false,error:'validation',fields:checked.errors});
 if(!env.RESEND_API_KEY)return respond(503,{ok:false,error:'mail_not_configured'});
 const data=checked.data,body=JSON.stringify(buildEmail(data));
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body))),v=>v.toString(16).padStart(2,'0')).join('');
 const key=data.submissionId,now=Date.now();
 for(const [k,v]of accepted)if(now-v.time>23*60*60*1000)accepted.delete(k);
 if(accepted.has(key)){const result=accepted.get(key);return result.digest===digest?respond(200,result.value):respond(409,{ok:false,error:'request_changed'});}
 if(inFlight.has(key)){const result=inFlight.get(key);if(result.digest!==digest)return respond(409,{ok:false,error:'request_changed'});return respond(...await result.promise);}
 const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
 for(const [k,v]of attempts)if(now-v.time>600000)attempts.delete(k);
 const counter=attempts.get(ip)||{time:now,count:0};
 if(counter.count>=20)return respond(429,{ok:false,error:'rate_limited'});
 if(attempts.size>2000)attempts.delete(attempts.keys().next().value);
 counter.count++;attempts.set(ip,counter);
 const send=async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const result=await (dependencies.fetch||fetch)('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'mategrowth-daycare/'+key},body,signal:controller.signal});
   const value=await result.json().catch(()=>null);
   if(result.status===409&&value?.name==='invalid_idempotent_request')return [409,{ok:false,error:'request_changed'}];
   if(!result.ok||!value||typeof value.id!=='string'||!value.id)return [503,{ok:false,error:'mail_not_confirmed'}];
   const receipt={ok:true,status:'accepted',submissionId:key,providerMessageId:value.id};accepted.set(key,{digest,value:receipt,time:now});
   if(accepted.size>2000)accepted.delete(accepted.keys().next().value);
   return [200,receipt];
  }catch{return [503,{ok:false,error:'mail_not_confirmed'}];}finally{clearTimeout(timer);}
 };
 const promise=send();inFlight.set(key,{digest,promise});
 try{return respond(...await promise);}finally{inFlight.delete(key);}
}
