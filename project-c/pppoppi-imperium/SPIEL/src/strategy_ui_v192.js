/* Nur-lesbarer, optionaler Einblick in Entscheidungen der KI. */
(()=>{'use strict';
 const trigger=document.createElement('button');trigger.id='pp-ai-button';trigger.type='button';trigger.textContent='🤖 KI-Entscheidungen';trigger.setAttribute('aria-controls','pp-ai-drawer');trigger.setAttribute('aria-expanded','false');
 const drawer=document.createElement('section');drawer.id='pp-ai-drawer';drawer.hidden=true;drawer.setAttribute('aria-label','Strategieprotokoll der Computergegner');
 drawer.innerHTML='<header><strong>Strategieprotokoll · V1.9.3</strong><button type="button" id="pp-ai-close" aria-label="KI-Protokoll schließen">✕</button></header><div id="pp-ai-body"></div>';
 document.body.append(trigger,drawer);
 // Native <dialog> is top-layer: an external button cannot receive pointer events.
 // Move the inspector inside the open dialog, and back to the desk when closed.
 const gameDialog=document.getElementById('dialog');
 const relocate=()=>{const parent=gameDialog?.open?gameDialog:document.body;
  if(trigger.parentNode!==parent)parent.append(trigger,drawer);};
 if(gameDialog){new MutationObserver(relocate).observe(gameDialog,{attributes:true,attributeFilter:['open']});
  gameDialog.addEventListener('close',relocate);}
 relocate();
 function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function draw(){const s=window.NeoEconomy?.getState?.();const body=drawer.querySelector('#pp-ai-body');
  if(!s){body.textContent='Neue Partie starten, um Entscheidungen zu sehen.';return;}
  const events=s.events.filter(e=>e.type==='KI_ENTSCHEIDUNG'||e.type==='KI_ABWARTEN'||e.type==='KI_LOGISTIK').slice(-35).reverse();
  if(!events.length){body.textContent='Noch keine KI-Entscheidungen. Den menschlichen Zug beenden.';return;}
  body.innerHTML='<p class="pp-ai-intro">Nur Spielprotokoll – keine nachträglichen Buchungen.</p>'+events.map(e=>'<article><small>Monat '+e.month+' · '+escapeHTML(e.company)+' · '+escapeHTML(e.strategy||'Strategie')+'</small><b>'+escapeHTML(e.action||'Abwarten')+(e.claimId?' · '+escapeHTML(e.claimId):(e.destination?' → '+escapeHTML(e.destination):''))+'</b><p>'+escapeHTML(e.reason||'Entscheidung protokolliert')+'</p></article>').join('');
 }
 function toggle(open){drawer.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)draw();}
 trigger.addEventListener('click',()=>toggle(drawer.hidden));drawer.querySelector('#pp-ai-close').addEventListener('click',()=>toggle(false));
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)toggle(false)});
 window.PPAIInspector={open:()=>toggle(true),close:()=>toggle(false),refresh:draw};
})();
