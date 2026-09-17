
(function(){
 const g=(n,p={})=>{if(typeof window.gtag==="function")window.gtag("event",n,p)};
 document.querySelectorAll("[data-event]").forEach(el=>el.addEventListener("click",()=>g(el.dataset.event,{page_type:"service",service:document.body.dataset.service||"",language:document.documentElement.lang,link_text:(el.textContent||"").trim().slice(0,80)})));
 const fab=document.querySelector(".contact-fab"),btn=document.querySelector(".fab-button");
 if(btn)btn.addEventListener("click",()=>{fab.classList.toggle("open");g("contact_fab_toggle",{service:document.body.dataset.service||""})});
 let fired={}; const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!fired[e.target.id]){fired[e.target.id]=1;g("section_view",{section:e.target.id,service:document.body.dataset.service||"",language:document.documentElement.lang})}}),{threshold:.35});
 document.querySelectorAll("section[id]").forEach(s=>obs.observe(s));
 [25,50,75,90].forEach(p=>{let done=false;addEventListener("scroll",()=>{if(done)return;let max=document.documentElement.scrollHeight-innerHeight;if(max>0&&scrollY/max*100>=p){done=true;g("scroll_depth",{percent:p,service:document.body.dataset.service||"",language:document.documentElement.lang})}},{passive:true})});
})();
