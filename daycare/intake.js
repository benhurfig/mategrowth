(() => {
 'use strict';
 const byId=id=>document.getElementById(id),english=document.documentElement.lang==='en',localize=(pt,en)=>english?en:pt;
 const config=window.MG_DAYCARE_CONFIG||{},form=byId('form'),fields=byId('inputs'),status=byId('form-status'),button=byId('submit-request');
 const keys=new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','gclid','fbclid']);
 let attribution={};try{const saved=JSON.parse(sessionStorage.getItem('mg-daycare-campaign')||'{}');for(const[k,v]of Object.entries(saved))if(keys.has(k)&&typeof v==='string'&&v.length<=200&&!/[\u0000-\u001f\u007f]/.test(v))attribution[k]=v}catch{}
 const current={};for(const[k,v]of new URLSearchParams(location.search))if(keys.has(k)&&v&&v.length<=200&&!/[\u0000-\u001f\u007f]/.test(v))current[k]=v;
 if(current.utm_source||current.utm_campaign||current.gclid||current.fbclid)attribution=current;else attribution={...attribution,...current};
 try{sessionStorage.setItem('mg-daycare-campaign',JSON.stringify(attribution))}catch{}
 for(const link of document.querySelectorAll('[data-lang]')){const url=new URL(link.href);for(const[k,v]of Object.entries(attribution))url.searchParams.set(k,v);link.href=url.href;}
 let busy=false,complete=false,lastSignature='',pendingId='',pendingSince=0;
 const detailMemory=new Map(),contactMemory=new Map();let oldDetail='',oldChannel='';
 function addInput(parent,key,caption,type='text',required=true,value='') {
  const label=document.createElement('label');label.textContent=caption;
  const input=document.createElement('input');input.type=type;input.name=key;input.maxLength=key==='contact'?250:250;input.required=required;input.value=value;
  if(key==='contact')input.autocomplete=type==='email'?'email':'tel';
  label.append(input);parent.append(label);
 }
 function updateDetails() {
  const target=byId('details'),previous=target.querySelector('input');if(previous&&oldDetail)detailMemory.set(oldDetail,previous.value);
  target.replaceChildren();const program=byId('program').value,goal=byId('goal').value;oldDetail=program+'/'+goal;if(!program)return;
  const value=detailMemory.get(oldDetail)||'';
  switch(goal){
   case 'spots':addInput(target,'group',program==='home'?localize('Quais idades você quer atender?','Which ages are you looking to enroll?'):localize('Qual turma ou unidade é a prioridade?','Which classroom or location is the priority?'),'text',true,value);break;
   case 'google':case 'site':addInput(target,'website',localize('Link do site ou do perfil no Google (opcional)','Website or Google profile link (optional)'),'url',false,value);break;
   case 'ads':addInput(target,'ads',localize('Qual programa você quer divulgar?','Which program would you like to promote?'),'text',true,value);break;
   case 'follow':addInput(target,'follow',localize('Como vocês acompanham os pedidos de visita hoje?','How do you track tour requests today?'),'text',true,value);break;
   case 'other':addInput(target,'other',localize('Em que podemos ajudar?','How can we help?'),'text',true,value);break;
  }
 }
 function updateAddress(){const target=byId('address'),previous=target.querySelector('input');if(previous&&oldChannel)contactMemory.set(oldChannel,previous.value);target.replaceChildren();const channel=byId('channel').value;oldChannel=channel;if(channel)addInput(target,'contact',channel==='email'?localize('E-mail','Email'):channel==='whatsapp'?localize('Número de WhatsApp','WhatsApp number'):localize('Telefone com código de área','Phone number with area code'),channel==='email'?'email':'tel',true,contactMemory.get(channel)||'');}
 for(const id of ['program','goal'])byId(id).addEventListener('change',updateDetails);
 byId('channel').addEventListener('change',updateAddress);
 fields.disabled=false;updateDetails();updateAddress();
 function message(text,error=false){status.textContent=text;status.hidden=!text;status.setAttribute('role',error?'alert':'status');}
 function endpoint(){try{const url=new URL(config.endpoint,location.href);if(!config.endpoint||(!['https:'].includes(url.protocol)&&!(location.hostname==='127.0.0.1'||location.hostname==='localhost')))return '';return url.href}catch{return ''}}
 form.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');if(!busy)message('')});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||complete)return;
  for(const input of fields.querySelectorAll('input'))input.value=input.value.trim();
  if(!form.reportValidity())return;
  const answers={};for(const el of fields.querySelectorAll('input[name],select[name]'))if(el.name!=='companyWebsite')answers[el.name]=el.value.trim();
  const data={locale:english?'en':'pt-BR',pagePath:english?'/daycare/en/':'/daycare/',answers,attribution,companyWebsite:form.elements.companyWebsite.value};
  const signature=JSON.stringify(data);
  if(signature!==lastSignature){pendingId=crypto.randomUUID();pendingSince=Date.now();lastSignature=signature;}
  // Do not automatically resend an ambiguous request after the provider's 24h dedup window.
  if(Date.now()-pendingSince>23*60*60*1000){message(localize('Não conseguimos confirmar o pedido anterior. Escreva para mategrowthus@gmail.com antes de enviar novamente.','We could not confirm your earlier request. Email mategrowthus@gmail.com before sending again.'),true);return;}
  const url=endpoint();if(!url){message(localize('O envio está indisponível no momento. Suas respostas continuam aqui. Tente novamente mais tarde.','Sending is currently unavailable. Your answers are still here. Please try again later.'),true);return;}
  busy=true;fields.disabled=true;button.textContent=localize('Enviando…','Sending…');form.setAttribute('aria-busy','true');message(localize('Enviando seu pedido…','Sending your request…'));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId:pendingId,...data}),credentials:'omit',signal:controller.signal});
   const result=await response.json().catch(()=>null);
   if(!response.ok||result?.ok!==true||result.status!=='accepted'||result.submissionId!==pendingId){
    if(result?.fields)for(const name of result.fields){const el=form.elements.namedItem(name);if(el&&el.setAttribute)el.setAttribute('aria-invalid','true');}
    throw Error('not_confirmed');
   }
   complete=true;fields.hidden=true;message('');byId('result').hidden=false;byId('result').focus();
   window.MGDaycareAnalytics?.lead(pendingId);
  }catch{message(localize('Não conseguimos confirmar o envio. Suas respostas continuam preenchidas. Tente novamente.','We could not confirm your request. Your answers are still filled in. Please try again.'),true);}
  finally{clearTimeout(timer);busy=false;fields.disabled=false;button.textContent=localize('Enviar meu pedido →','Send My Request →');form.removeAttribute('aria-busy');}
 });
})();
