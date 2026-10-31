/* Offline-Oberfläche ohne Bibliotheken, nur Berliner eigenständige Entwurfsregeln. */
(()=>{
'use strict';
const E=window.OliEngine, NAV=window.OLI_NAV||[];
let game=null, view='SCR-START', nextId=0;
const $=id=>document.getElementById(id);
const money=n=>(n/100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const bbl=n=>(n/1000).toLocaleString('de-DE',{maximumFractionDigits:3})+' bbl';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(txt,isError=false){$('notice').textContent=txt;$('notice').className=isError?'notice warn':'notice';}
function issue(type){
 try {if(!game)throw new Error('Erst eine Partie beginnen');const key=`${game.seed}-${Date.now()}-${++nextId}`;
  const r=E.transition(game,{type,requestId:key});game=r.state;say(game.message);
  if(game.phase==='RESCUE')view='SCR-RESCUE';
  else if(type==='END_MONTH'||type==='RESTART'||type==='RESCUE_LOAN'||type==='RESCUE_SALE'&&game.phase==='MONTH_REPORT')view='SCR-MONTH-REPORT';
  else if(type==='NEXT_MONTH')view='SCR-HQ';
  render();
 }catch(e){say(e.message,true);render();}
}
function nav(to){
 if(view===to)return;
 const edge=NAV.find(x=>x.from_screen===view&&x.to_screen===to);
 if(!edge){say('Dieser Bildschirmwechsel ist im Navigationsmodell nicht vorgesehen.',true);return;}
 if(edge.implemented!==true){say('Übergang ist als Entwurf vorhanden, aber im Prototyp nicht bedienbar.',true);return;}
 if(to==='SCR-RESCUE'&&game?.phase!=='RESCUE'){say('Rettung nur in einer echten Zahlungskrise.',true);return;}
 if(view==='SCR-RESCUE'&&game?.phase==='RESCUE'){say('Erst Rettung abschließen oder Neustart auswählen.',true);return;}
 if(to==='SCR-END-TURN'&&game?.phase!=='TURN_ACTIVE'){say('Zugende ist momentan gesperrt.',true);return;}
 if(to==='SCR-MONTH-REPORT'&&game?.phase!=='MONTH_REPORT'){say('Noch kein abgeschlossener Monat vorhanden.',true);return;}
 view=to;render();
}
const navBtn=(to,label)=>`<button type="button" data-nav="${esc(to)}">${esc(label)}</button>`;
const act=(type,label,desc='')=>`<button type="button" data-action="${type}">${esc(label)}</button>${desc?`<small>${esc(desc)}</small>`:''}`;
function rawNavOptions(){return NAV.filter(x=>x.from_screen===view&&x.implemented&&x.event!=='archive_run');}
function drawCenter(){
 if(!game&&view==='SCR-SETUP')return `<h2>Spielstart</h2><p>Die Mini-Partie startet mit ${money(E.P.startCashCent)}, 30 Spieltagen, einer Förderregion und einem Vergleichsangebot des Computer-Konkurrenten.</p><div class="actions">${act('CREATE_GAME','Partie jetzt beginnen')}</div>`;
 if(!game){return `<h2>Neues satirisches Wirtschaftsspiel</h2><p>PPPOPPI eröffnet eine eigene Ölfirma. Das ist ein <strong>eigenständiger Berliner Testentwurf</strong>, keine originalgetreue C64-Fassung.</p><p>Ein kompletter Testmonat: Gutachten, Kauf, Bohrung, Förderung, Lieferung, Angebot, Markt, Zahlung und Bericht.</p><div class="actions">${navBtn('SCR-SETUP','Neue Partie einrichten')}</div>`;}
 if(view==='SCR-SETUP')return `<h2>Spielstart</h2><p>Startkapital ${money(E.P.startCashCent)}, 30 Spieltage, ein Testfeld, ein Computer-Konkurrent.</p>${act('CREATE_GAME','Neue Partie starten')}`;
 const labels={'SCR-HQ':'Firmenzentrale Berlin','SCR-MAP':'Fiktive Deutschlandkarte','SCR-REGION':'Region Brandenburg (fiktives Szenario)','SCR-FIELD':'Ölfeld P-01','SCR-EXPERTISE':'Geologisches Gutachten','SCR-PURCHASE':'Konzession erwerben','SCR-DRILL':'Bohrung','SCR-STOCK':'Lager und Förderung','SCR-LOGISTICS':'Lieferung vorbereiten','SCR-MARKET':'Ölmarkt','SCR-END-TURN':'Monatsabschluss','SCR-MONTH-REPORT':'Monatsbericht','SCR-RESCUE':'Rettungsverfahren','SCR-FINANCE':'Finanzen','SCR-MILESTONES':'Meilensteine','SCR-HELP':'Spielhilfe','SCR-JOURNAL':'Buchungsjournal'};
 let html=`<h2>${esc(labels[view]||'Bereich in Planung')}</h2>`;
 switch(view){
 case 'SCR-HQ': html+=`<p><strong>PPPOPPI:</strong> „Es riecht nach Öl. Oder nach dem letzten Geschäftsbericht.“</p><div class="actions">${navBtn('SCR-MAP','Karte und Ölfeld')}${navBtn('SCR-STOCK','Lager & Förderung')}${navBtn('SCR-MARKET','Ölmarkt')}${navBtn('SCR-FINANCE','Finanzen')}${navBtn('SCR-END-TURN','Spielmonat abschließen')}</div><p class="muted">Reihenfolge für Pilot 01: Karte → Feld → Gutachten → Kauf → Bohrung → Lager → Lieferung → Markt → Monatsende.</p>`;break;
 case 'SCR-MAP':html+=`<p>Eine einzige <strong>fiktive</strong> Förderregion ist für die Mini-Partie freigeschaltet. Die landesweite Karte mit weiteren Gebieten bleibt ein späterer Entwicklungsbaustein.</p>${navBtn('SCR-REGION','Fiktives Brandenburg öffnen')}`;break;
 case 'SCR-REGION':html+=`<p>Testgebiet P-01: Reserve ${bbl(game.field.reserveMilli)}. Eigentümer: ${game.field.owned?'PPPOPPI':'Niemand'}.</p>${navBtn('SCR-FIELD','Feld P-01 untersuchen')}`;break;
 case 'SCR-FIELD':html+=`<div class="kv"><span>Gutachten</span><strong>${game.field.surveyed?'Vorhanden':'Fehlt'}</strong><span>Eigentum</span><strong>${game.field.owned?'Gekauft':'Noch frei'}</strong><span>Bohrung</span><strong>${game.field.drilled?'Betriebsbereit':'Nicht gebohrt'}</strong><span>Reserve</span><strong>${bbl(game.field.reserveMilli)}</strong></div><div class="actions">${navBtn('SCR-EXPERTISE','Gutachten')}${navBtn('SCR-PURCHASE','Feldkauf')}${navBtn('SCR-DRILL','Bohrung')}</div>`;break;
 case 'SCR-EXPERTISE':html+=`<p>Preis: ${money(E.P.surveyCent)}; Zeit: 2 Tage. Das Gutachten zeigt die im Testprofil festgelegte Rohstoffreserve.</p>${act('SURVEY','Gutachten beauftragen')}`;break;
 case 'SCR-PURCHASE':html+=`<p>Kaufpreis: ${money(E.P.buyCent)}; Zeit: 1 Tag. Voraussetzung: bereits erstelltes Gutachten.</p>${act('BUY_FIELD','Konzession kaufen')}`;break;
 case 'SCR-DRILL':html+=`<p>Bohrkosten: ${money(E.P.drillCent)}; Zeit: 5 Tage. Voraussetzung: Eigentum am Feld.</p>${act('DRILL','Bohrfirma einsetzen')}<p class="muted">Das Geschicklichkeits-Minispiel ist im vollständigen Entwurf vorgesehen, aber <strong>noch nicht implementiert</strong>.</p>`;break;
 case 'SCR-STOCK':html+=`<p>Im Lager: <strong>${bbl(game.inventoryMilli)}</strong> · Für Verkauf vorbereitet: ${bbl(game.preparedMilli)} · Kapazität: ${bbl(game.tankCapacityMilli)}</p><p>Fördercharge: ${bbl(E.P.pumpMilli)}, Kosten ${money(E.P.pumpCent)}, Zeit 4 Tage.</p><div class="actions">${act('PUMP','100 Barrel fördern')}${navBtn('SCR-LOGISTICS','Logistik öffnen')}</div>`;break;
 case 'SCR-LOGISTICS':html+=`<p>Alle vorhandenen, nicht gebundenen Barrel für Lieferung vorbereiten. Kosten ${money(E.P.transportCent)}, Zeit 1 Tag. Transportkosten bleiben bei einem Abbruch bestehen.</p><div class="actions">${act('TRANSPORT','Lieferung vorbereiten')}${act('CANCEL_SHIPMENT','Vorbereitung zurücknehmen')}</div>`;break;
 case 'SCR-MARKET':html+=`<p>Test-Marktpreis: <strong>${money(E.P.priceCentPerBbl)} pro Barrel</strong>. Nachfrage: ${bbl(E.P.marketDemandMilli)}. Konkurrenzangebot: ${bbl(E.P.rivalOfferMilli)}.</p><p>Dein vorbereitetes Öl: ${bbl(game.preparedMilli)}. ${game.order?'Verkaufsauftrag ist verbindlich vorgemerkt.':'Noch kein Verkaufsauftrag.'}</p>${act('OFFER','Verkaufsangebot abgeben','1 Spieltag · Abrechnung erfolgt beim Monatsabschluss.')}<p class="muted">Bei zu vielen Angeboten erfolgt eine gleichrangige anteilige Verteilung; nicht verkaufte Ware kommt zurück ins Lager.</p>`;break;
 case 'SCR-FINANCE':html+=`<p><strong>Milchmädchen Pete</strong> prognostiziert eine ruhmreiche Zukunft. Die verlässlichen Zahlen stehen rechts.</p><p>Schulden: ${money(game.debtCent)}. Offene Verbindlichkeiten: ${money(game.obligations.reduce((a,o)=>a+o.dueCent-o.paidCent,0))}.</p>${game.phase==='RESCUE'?navBtn('SCR-RESCUE','Zur Rettung'):''}`;break;
 case 'SCR-END-TURN':html+=`<p>Es werden alle Angebote anteilig zugeteilt, Einnahmen einmal gebucht und Monatskosten nach Priorität bezahlt. Nur dann kann der nächste Monat starten.</p>${act('END_MONTH','Monat verbindlich abrechnen')}`;break;
 case 'SCR-MONTH-REPORT':{const r=game.monthReport;if(r)html+=`<div class="kv"><span>Abgeschlossener Monat</span><strong>${r.month}</strong><span>Verkauf</span><strong>${bbl(r.soldMilli)}</strong><span>Einnahmen</span><strong>${money(r.revenueCent)}</strong><span>Marktanteil</span><strong>${(r.marketShareBps/100).toFixed(2).replace('.',',')} %</strong><span>Kritische Restschulden</span><strong>${money(r.criticalOutstandingCent)}</strong></div>`;
 html+=act('NEXT_MONTH','Nächsten Spielmonat beginnen');break;}
 case 'SCR-RESCUE':html+=`<p><strong>Weiche Pleite:</strong> Kein automatisches Spielende. Erst Rückstände prüfen, dann Kredit, Notverkauf oder geregelter Neustart. Die Erfolge bleiben bei einem Neustart erhalten.</p><div class="actions">${act('RESCUE_LOAN',`Rettungskredit: ${money(E.P.rescueLoanCent)}`)}${act('RESCUE_SALE','Konzession im Notverkauf abgeben')}${act('RESTART','Neue Wirtschaftsgeneration beginnen')}</div>`;break;
 case 'SCR-MILESTONES':html+=`<p>Berliner Marktführer: mindestens 60 % in sechs geeigneten Monaten. Vertragsmeister: 20 erfüllte Verträge bei mindestens 95 % Pünktlichkeit.</p><p>Aktuelle Marktführer-Serie: ${game.marketStreak}/6 · Auszeichnungen: ${game.awards.length?esc(game.awards.join(', ')):'Keine'}</p><p class="muted">Vertrags- und Mehrspielersystem sind noch nicht Teil der Mini-Partie. Marktführer-Mindestbedingungen wurden für den Testfall parametrisiert.</p>`;break;
 case 'SCR-JOURNAL':html+=`<table><thead><tr><th>Monat</th><th>Vorgang</th><th>Betrag</th></tr></thead><tbody>${game.ledger.slice(-20).reverse().map(l=>`<tr><td>${l.month}</td><td>${esc(l.code)}</td><td>${l.deltaCent>0?'+':''}${money(l.deltaCent)}</td></tr>`).join('')}</tbody></table>`;break;
 case 'SCR-HELP':html+=`<p>Dieses Paket läuft ohne Internet. Start über <strong>index.html</strong>. Speichern: links „Spielstand exportieren“; Laden: JSON auswählen.</p><p><strong>Wichtig:</strong> Angebote und Zahlungen werden erst am Monatsende verarbeitet. Kosten werden genau einmal gebucht. Reine Bildschirmwechsel kosten keine Spieltage.</p><p>Unfertige C64-Funktionen, KI-Ausbau, Verträge und drei Minispiele sind als Entwürfe, nicht als fertige Funktionen markiert.</p>`;break;
 default:html+=`<p>Dieser Bildschirm ist im Gesamtkatalog enthalten, aber in der Mini-Partie bewusst noch nicht umgesetzt. Kein vorgetäuschter Funktionsumfang.</p>`;
 }
 const back=rawNavOptions().filter(x=>['close','back','close_or_finish','cancel'].includes(x.event)).map(x=>navBtn(x.to_screen,'← Zurück')).join('');
 return html+(back?`<div class="back">${back}</div>`:'');
}
function render(){
 const s=game;
 $('topStatus').textContent=!s?'Neue Partie':`Monat ${s.month} · Generation ${s.generation} · ${s.phase==='TURN_ACTIVE'?'Aktiver Monat':s.phase==='RESCUE'?'RETTUNG':'Monatsbericht'}`;
 $('main').innerHTML=drawCenter();
 const links=s?NAV.filter(x=>x.from_screen==='SCR-HQ'&&x.implemented&&x.to_screen!=='SCR-START'&&x.to_screen!=='SCR-END-TURN').map(x=>navBtn(x.to_screen,({'SCR-MAP':'Karte','SCR-MARKET':'Markt','SCR-STOCK':'Lager','SCR-FINANCE':'Finanzen','SCR-MILESTONES':'Erfolge','SCR-JOURNAL':'Buchungen','SCR-HELP':'Hilfe'}[x.to_screen]||x.to_screen))).join(''):'';
 const allowedBack=NAV.filter(x=>x.from_screen===view&&x.implemented&&(['back','close','close_or_finish','cancel'].includes(x.event)));
 $('navigation').innerHTML=(s?`<p>${view==='SCR-HQ'?'Bereiche ab Firmenzentrale:':'Rückwege im Ablaufmodell:'}</p><div class="nav-group">${view==='SCR-HQ'?links:allowedBack.map(x=>navBtn(x.to_screen,'← '+(x.to_screen==='SCR-HQ'?'Zentrale':'Zurück'))).join('')}</div>`:'<p>Einzelspieler-Testpartie ohne Internetverbindung.</p>');
 $('indicators').innerHTML=s?`<div class="kv"><span>Kasse</span><strong>${money(s.cashCent)}</strong><span>Schulden</span><strong>${money(s.debtCent)}</strong><span>Spieltage übrig</span><strong>${E.P.monthDays-s.actionDaysUsed}/${E.P.monthDays}</strong><span>Rohöl im Lager</span><strong>${bbl(s.inventoryMilli)}</strong><span>Zur Lieferung reserviert</span><strong>${bbl(s.preparedMilli)}</strong><span>Reserve im Feld</span><strong>${bbl(s.field.reserveMilli)}</strong><span>Erfolge</span><strong>${s.awards.length}</strong></div>`:'<p>Spielwerte werden nach dem Start angezeigt.</p>';
 $('phaseInfo').textContent=s?.message||'Das ist die eigenständige Berliner Entwicklungsfassung.';
 const canSave=Boolean(s);
 $('exportBtn').disabled=!canSave;
}
function exportGame(){if(!game)return;const blob=new Blob([JSON.stringify(game,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`PPPOPPI_Spielstand_M${game.month}_G${game.generation}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);say('Spielstand als JSON-Datei exportiert.');}
async function importGame(file){try{assertFile(file);const text=await file.text();const state=JSON.parse(text);E.validate(state);game=state;view=game.phase==='RESCUE'?'SCR-RESCUE':game.phase==='MONTH_REPORT'?'SCR-MONTH-REPORT':'SCR-HQ';say('Spielstand erfolgreich geprüft und geladen.');render();}catch(e){say('Laden abgebrochen: '+e.message,true);}}
function assertFile(file){if(!file||file.size>4000000)throw new Error('Nur JSON bis 4 MB zulässig.');}
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||btn.disabled)return;
 if(btn.dataset.nav){if(!game&&btn.dataset.nav==='SCR-SETUP'){view='SCR-SETUP';render();}else nav(btn.dataset.nav);return;}
 if(btn.dataset.action){if(btn.dataset.action==='CREATE_GAME'){game=E.fresh('BERLIN-'+Date.now());view='SCR-HQ';say('Partie gestartet.');render();}else issue(btn.dataset.action);}
});
$('exportBtn').addEventListener('click',exportGame);
$('importBtn').addEventListener('click',()=>$('fileImport').click());
$('fileImport').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importGame(f);e.target.value='';});
render();
})();
