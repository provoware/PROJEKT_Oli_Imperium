/* PPPOPPI IMPERIUM V1.9.1: presentation-only navigation safeguard.
 * Never mutates the economy object, never uses a network API.
 * Handles scene existence, backwards paths, privacy during player handoff.
 */
(()=>{'use strict';
const originalShow=window.show;
const originalClose=window.close;
if(typeof originalShow!=='function'||typeof originalClose!=='function'||!window.NeoEconomy||!window.scenes){
  // Global classic-script const 'scenes' is normally lexical rather than window property.
}
const dialog=document.getElementById('dialog'),content=document.getElementById('dialogContent');
const registry=scenes;
const allowedWithoutGame=new Set(['startup','help','duck','bear','coffee','plant','lamp','window','minigame','quick']);
const parent={region:'map',claim:'region',field:'claim',warehouse:'claim',pipeline:'warehouse',factory:'claim',refinery:'factory',transport:'refinery',publicNetwork:'transport',market:'computer',contracts:'phone',finance:'computer',newsroom:'newspaper',boardroom:'phone',chronicle:'boardroom',security:'workshop',workshop:'case',report:'calendar',rescue:'calendar',awards:'computer',paper:'newspaper',quick:'computer'};
let trail=[],changing=false,serial=0;
const state=()=>window.NeoEconomy?.getState?.();
const isPrivate=()=>Boolean(window.NeoEconomy?.needsHandoff?.());
function route(request){
 if(!Object.prototype.hasOwnProperty.call(registry,request))return 'help';
 if(isPrivate())return 'handoff';
 const data=state();
 if(!data&&!allowedWithoutGame.has(request))return 'startup';
 // Report and rescue are economic phases, not navigation locks.
 // The economic kernel rejects actions invalid in that phase. Read-only screens stay accessible.
 return request;
}
function setToolbar(){
 let nav=dialog.querySelector('#v191-navigator');
 if(!nav){
  nav=document.createElement('nav');nav.id='v191-navigator';nav.className='v191-nav';nav.setAttribute('aria-label','Bildschirmnavigation');
  nav.innerHTML='<button type="button" data-nav="back" aria-label="Vorherigen Bildschirm öffnen">← Zurück</button><button type="button" data-nav="desk">⌂ Büro</button><button type="button" data-nav="quick">▦ Übersicht</button><span id="v191-location" role="status" aria-live="polite"></span>';
  dialog.insertBefore(nav,content);
 }
 const current=window.active||active;
 nav.querySelector('[data-nav="back"]').disabled=isPrivate()||!trail.length&&!parent[current];
 nav.querySelector('[data-nav="quick"]').disabled=isPrivate();
 nav.querySelector('[data-nav="desk"]').disabled=isPrivate();
 nav.querySelector('#v191-location').textContent=(registry[current]?.title||current||'Büro')+' · '+(serial>0?'Navigation aktiv':'');
}
function guardedShow(request,options={}){
 let destination=route(request);
 const current=active;
 if(!options.back && current && current!==destination && destination!=='handoff' && destination!=='startup' && trail.length<35)trail.push(current);
 if(destination==='handoff'||destination==='startup' || (destination==='computer'&&current==='startup'))trail=[];
 try{originalShow(destination)}catch(err){
   console.error('V1.9.1: Bildschirm konnte nicht angezeigt werden',destination,err);
   trail=[];originalShow(state()?'computer':'startup');
   let marker=document.createElement('p');marker.className='econ-tip';marker.textContent='Dieser Bildschirm ist zurzeit nicht verfügbar. Die sichere Firmenübersicht wurde geöffnet.';content.prepend(marker);
 }
 serial++;setToolbar();return destination;
}
window.show=guardedShow;
window.close=function(){trail=[];return originalClose()};
dialog.addEventListener('close',()=>{trail=[]});
dialog.addEventListener('click',e=>{
 const button=e.target.closest('#v191-navigator button[data-nav]');if(!button)return;
 e.preventDefault();e.stopPropagation();
 const command=button.dataset.nav;
 if(isPrivate()){guardedShow('handoff');return}
 if(command==='desk'){window.close();return}
 if(command==='quick'){guardedShow(state()?'quick':'startup');return}
 if(command==='back'){
  const current=active;let previous=trail.pop()||parent[current]||(state()?'computer':'startup');
  if(previous==='startup'&&state())previous='computer';
  guardedShow(previous,{back:true});
 }
},true);
window.addEventListener('keydown',e=>{
 if(e.altKey&&e.key==='ArrowLeft'&&dialog.open){e.preventDefault();dialog.querySelector('[data-nav="back"]')?.click()}
},true);
window.PPNavigation191={version:'1.9.1',getScenes:()=>Object.keys(registry),open:id=>guardedShow(id),getTrail:()=>[...trail],current:()=>active,privacy:isPrivate,validate:()=>({registered:Object.keys(registry).length,hasStartup:!!registry.startup,hasQuick:!!registry.quick,hasReport:!!registry.report})};
})();
