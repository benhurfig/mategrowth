(() => {
 'use strict';
 // iOS SMS handlers use &body; other platforms use ?body.
 if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
  document.querySelectorAll('[data-sms-help]').forEach(link=>{link.href=link.getAttribute('href').replace('?body=','&body=')});
 }
 const byId=id=>document.getElementById(id),english=document.documentElement.lang==='en',localize=(pt,en)=>english?en:pt;
 const config=window.MG_DAYCARE_CONFIG||{},form=byId('form'),fields=byId('inputs'),status=byId('form-status'),button=byId('submit-request');
 const keys=new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','gclid','fbclid']);
 let attribution={};try{const saved=JSON.parse(sessionStorage.getItem('mg-daycare-campaign')||'{}');for(const[k,v]of Object.entries(saved))if(keys.has(k)&&typeof v==='string'&&v.length<=200&&!/[\u0000-\u001f\u007f]/.test(v))attribution[k]=v}catch{}
 const current={};for(const[k,v]of new URLSearchParams(location.search))if(keys.has(k)&&v&&v.length<=200&&!/[\u0000-\u001f\u007f]/.test(v))current[k]=v;
 if(current.utm_source||current.utm_campaign||current.gclid||current.fbclid)attribution=current;else attribution={...attribution,...current};
 try{sessionStorage.setItem('mg-daycare-campaign',JSON.stringify(attribution))}catch{}
 for(const link of document.querySelectorAll('[data-lang]')){const url=new URL(link.href);for(const[k,v]of Object.entries(attribution))url.searchParams.set(k,v);link.href=url.href;}
 let busy=false,complete=false,lastSignature='',pendingId='',pendingSince=0;
 const detailMemory=new Map(),contactMemory=new Map();let oldChannel='',otherTimeMemory='',adChannelMemory='';
 const chosenGoals=()=>Array.from(fields.querySelectorAll('input[name="goals"]:checked'),el=>el.value);
 function addInput(parent,key,caption,type='text',required=true,value='') {
  const label=document.createElement('label');label.textContent=caption;
  const input=document.createElement('input');input.type=type;input.name=key;input.maxLength=key==='contactTimeOther'?100:250;input.required=required;input.value=value;
  if(key==='contact')input.autocomplete=type==='email'?'email':'tel';
  label.append(input);parent.append(label);return input;
 }
 function updateDetails() {
  const target=byId('details'),program=byId('program').value;
  const keys=new Set(chosenGoals().map(goal=>({spots:'group',google:'website',site:'website',ads:'ads',follow:'follow',other:'other'})[goal]));
  if(!english)keys.delete('ads');
  for(const input of target.querySelectorAll(':scope > label > input'))if(!program||!keys.has(input.name)){detailMemory.set(input.name,input.value);input.parentElement.remove();}
  updateAds(Boolean(program)&&chosenGoals().includes('ads'));
  if(!program)return;
  const captions={group:program==='home'?localize('Quais idades você quer atender?','Which ages are you looking to enroll?'):localize('Qual turma ou unidade é a prioridade?','Which classroom or location is the priority?'),website:localize('Link do site ou do perfil no Google (opcional)','Website or Google profile link (optional)'),ads:localize('Qual programa você quer divulgar?','Which program would you like to promote?'),follow:localize('Como vocês acompanham os pedidos de visita hoje?','How do you track tour requests today?'),other:localize('Em que podemos ajudar?','How can we help?')};
  for(const key of keys){const input=target.querySelector('[name="'+key+'"]');if(input){input.parentElement.firstChild.textContent=captions[key];continue;}addInput(target,key,captions[key],key==='website'?'url':'text',key!=='website',detailMemory.get(key)||'');}
 }
 const adChannels={google:'No Google, quando uma família pesquisa por daycare',meta:'No Facebook e Instagram',both:'Nos dois',recommendation:'Ainda não sei. Quero uma recomendação'};
 function updateAds(active){
  if(english)return;
  let group=byId('ads-channel-wrap');
  if(!active){if(group){adChannelMemory=group.querySelector('select').value;group.remove();}return;}
  if(group)return;
  group=document.createElement('div');group.id='ads-channel-wrap';const label=document.createElement('label');label.textContent='Onde você gostaria de anunciar sua daycare?';
  const select=document.createElement('select');select.name='adChannel';select.id='ad-channel';
  const blank=document.createElement('option');blank.value='';blank.textContent='Selecione (opcional)';select.append(blank);
  for(const[value,text]of Object.entries(adChannels)){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
  select.value=adChannelMemory;label.append(select);group.append(label);byId('details').append(group);
 }
 function validateGoals(show=false){const valid=chosenGoals().length>0,first=fields.querySelector('input[name="goals"]');first.setCustomValidity(valid?'':localize('Marque pelo menos uma prioridade.','Select at least one priority.'));byId('priorities-error').hidden=valid||!show;return valid;}
 function updateAddress(){const target=byId('address'),previous=target.querySelector('input');if(previous&&oldChannel)contactMemory.set(oldChannel,previous.value);target.replaceChildren();const channel=byId('channel').value;oldChannel=channel;if(channel)addInput(target,'contact',channel==='email'?localize('E-mail','Email'):channel==='whatsapp'?localize('Número de WhatsApp','WhatsApp number'):localize('Telefone com código de área','Phone number with area code'),channel==='email'?'email':'tel',true,contactMemory.get(channel)||'');}
 function updateTime(){const target=byId('contact-time-other'),input=target.querySelector('input');if(byId('contact-time').value==='other'){if(!input){const added=addInput(target,'contactTimeOther',localize('Qual horário você prefere?','What time works for you?'),'text',true,otherTimeMemory);added.placeholder=localize('Dias de semana, entre 16h e 17h','Weekdays, between 4 and 5 PM');}}else if(input){otherTimeMemory=input.value;target.replaceChildren();}}
 byId('program').addEventListener('change',updateDetails);
 byId('priorities').addEventListener('change',()=>{validateGoals(true);updateDetails()});
 fields.querySelector('input[name="goals"]').addEventListener('invalid',()=>{byId('priorities-error').hidden=false});
 byId('channel').addEventListener('change',updateAddress);
 byId('contact-time').addEventListener('change',updateTime);
 fields.disabled=false;updateDetails();updateAddress();updateTime();validateGoals();
 function message(text,error=false){status.textContent=text;status.hidden=!text;status.setAttribute('role',error?'alert':'status');}
 function endpoint(){try{const url=new URL(config.endpoint,location.href);if(!config.endpoint||(!['https:'].includes(url.protocol)&&!(location.hostname==='127.0.0.1'||location.hostname==='localhost')))return '';return url.href}catch{return ''}}
 form.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');if(!busy)message('')});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||complete)return;
  for(const input of fields.querySelectorAll('input'))input.value=input.value.trim();
  validateGoals(true);if(!form.reportValidity())return;
  const answers={goals:chosenGoals()};for(const el of fields.querySelectorAll('input[name],select[name]'))if(el.name!=='companyWebsite'&&el.name!=='mg_contact_check'&&el.name!=='goals'&&!el.disabled)answers[el.name]=el.value.trim();
  const data={locale:english?'en':'pt-BR',pagePath:english?'/daycare/en/':'/daycare/',answers,attribution,companyWebsite:(form.elements.mg_contact_check||form.elements.companyWebsite).value};
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
