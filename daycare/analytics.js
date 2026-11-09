(() => {
 'use strict';
 const config=window.MG_DAYCARE_CONFIG||{},id=config.ga4MeasurementId||'',valid=/^G-[A-Z0-9]+$/.test(id);
 const en=document.documentElement.lang==='en',locale=en?'en':'pt-BR';
 const key='mg-daycare-analytics-choice',seen=new Set();let granted=false,loaded=false,loading=null,pageView=false,started=false;
 const gpc=()=>navigator.globalPrivacyControl===true;
 const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
 const read=()=>{try{return localStorage.getItem(key)}catch{return null}};
 const save=v=>{try{localStorage.setItem(key,v)}catch{}};
 const pageLocation=()=>{const u=new URL(location.origin+location.pathname);for(const[k,v]of new URLSearchParams(location.search))if(/^utm_(source|medium|campaign|content|term|id)$|^(gclid|fbclid)$/.test(k)&&/^[a-z0-9._~-]{1,200}$/i.test(v))u.searchParams.set(k,v);return u.href};
 function send(name,params={}) {
  if(!valid||!granted||!loaded||gpc()||typeof window.gtag!=='function')return false;
  if(!['cta_click','daycare_form_start','generate_lead','page_view'].includes(name))return false;
  const clean={locale,form_id:'daycare_intake'};
  if(name==='cta_click'&&['header','hero','content'].includes(params.cta_location))clean.cta_location=params.cta_location;
  window.gtag('event',name,clean);return true;
 }
 function ui() {
  const banner=document.querySelector('[data-mg-consent]');if(banner)banner.hidden=!valid||read()!==null||gpc();
  const prefs=document.querySelector('[data-mg-preferences]');if(prefs)prefs.hidden=!valid;
 }
 async function allow() {
  if(!valid||gpc())return false;
  granted=true;save('granted');ui();
  if((loaded||loading)&&window.gtag)window.gtag('consent','update',{...denied,analytics_storage:'granted'});
  if(loaded)return true;
  if(loading)return loading;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag('consent','default',denied);window.gtag('consent','update',{...denied,analytics_storage:'granted'});
  window.gtag('js',new Date());window.gtag('config',id,{send_page_view:false,page_location:pageLocation(),page_referrer:(()=>{try{return new URL(document.referrer).origin+'/'}catch{return ''}})(),allow_google_signals:false,allow_ad_personalization_signals:false});
  const script=document.createElement('script');script.async=true;script.id='mg-daycare-ga';script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
  loading=new Promise(resolve=>{
   script.addEventListener('load',()=>{loaded=true;loading=null;if(granted&&!gpc()&&!pageView)pageView=send('page_view');resolve(true)},{once:true});
   script.addEventListener('error',()=>{loading=null;script.remove();resolve(false)},{once:true});
  });document.head.append(script);return loading;
 }
 function reject(){granted=false;save('denied');if(window.gtag)window.gtag('consent','update',denied);ui()}
 document.querySelector('[data-mg-accept]')?.addEventListener('click',allow);
 document.querySelector('[data-mg-reject]')?.addEventListener('click',reject);
 document.querySelector('[data-mg-preferences]')?.addEventListener('click',()=>{const banner=document.querySelector('[data-mg-consent]');if(banner)banner.hidden=false;document.querySelector('[data-mg-reject]')?.focus()});
 document.querySelectorAll('a[href="#intake"]').forEach(a=>a.addEventListener('click',()=>send('cta_click',{cta_location:a.closest('header')?'header':a.closest('.hero')?'hero':'content'})));
 const form=document.getElementById('form');
 function start(){if(!started&&send('daycare_form_start'))started=true}
 form?.addEventListener('input',start);form?.addEventListener('change',start);
 window.MGDaycareAnalytics=Object.freeze({
  lead(submissionId){
   if(!valid||!granted||!loaded||gpc()||seen.has(submissionId))return false;
   try{if(sessionStorage.getItem('mg-daycare-lead:'+submissionId)==='sent')return false}catch{}
   if(!send('generate_lead'))return false;
   seen.add(submissionId);try{sessionStorage.setItem('mg-daycare-lead:'+submissionId,'sent')}catch{}return true;
  },
  status(){return {configured:valid,consent:granted,loaded,receiptVerified:false}}
 });
 ui();if(valid&&read()==='granted'&&!gpc())allow();else if(gpc())reject();
})();
