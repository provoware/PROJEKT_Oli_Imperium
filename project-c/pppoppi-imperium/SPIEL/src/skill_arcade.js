/* PPPOPPI IMPERIUM V1.4: three playable skill interfaces.
   Game outcomes always pass through the existing V0.8.2 engine.
   Design adaptation, NOT authenticated historical C64 minigames. */
(function(){'use strict';
 const dirs=['N','E','S','W'];const opposites={N:'S',S:'N',E:'W',W:'E'};
 const patterns=[
  [[0,1],[1,1],[2,1],[2,0],[3,0],[4,0]],
  [[0,2],[1,2],[1,1],[2,1],[3,1],[3,0],[4,0]],
  [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[4,2]]
 ];
 const emergencies=[
  {name:'Zufuhr unterbrechen',hint:'Der Nachschub speist die Flammen. Was kommt zuerst?',right:'VENTIL',flame:90},
  {name:'Anlage stabilisieren',hint:'Die Leitungen glühen noch. Verhindere die Wiederentzündung.',right:'KUEHLEN',flame:64},
  {name:'Brandherd ersticken',hint:'Der Restbrand benötigt eine geschlossene Schaumdecke.',right:'SCHAUM',flame:34}
 ];
 const strategies=[['VENTIL','Absperrventil'],['KUEHLEN','Kühlwasser'],['SCHAUM','Schaumdecke']];
 let cacheKey='', puzzle=null, pressure=50, feedback='';
 function key(m){return [m.companyId,m.claimId,m.kind,m.stage].join('|')}
 function edge(a,b){if(b[0]===a[0]+1&&b[1]===a[1])return 'E';if(b[0]===a[0]-1&&b[1]===a[1])return 'W';if(b[1]===a[1]+1&&b[0]===a[0])return 'S';return 'N'}
 function rotate(ds,k){return ds.map(d=>dirs[(dirs.indexOf(d)+k)%4]);}
 function get(m){if(cacheKey!==key(m)){
  cacheKey=key(m);pressure=50;feedback='';puzzle={};
  const p=patterns[m.stage];
  for(let i=0;i<p.length;i++){const [x,y]=p[i],prev=i===0?'W':edge(p[i],p[i-1]),next=i===p.length-1?'E':edge(p[i],p[i+1]);puzzle[`${x}-${y}`]={id:`${x}-${y}`,x,y,original:[prev,next],turns:(i*3+m.stage+1)%4};}
 }return puzzle;}
 function opens(t){return rotate(t.original,t.turns)}
 function checkPipe(m){const tiles=get(m),p=patterns[m.stage],start=p[0],end=p[p.length-1];let cur=[...start],entry='W',seen=new Set();
  while(true){const k=cur.join('-'),t=tiles[k];if(!t||seen.has(k))return false;seen.add(k);const ds=opens(t);if(!ds.includes(entry))return false;const out=ds.find(x=>x!==entry);if(!out)return false;
   if(cur[0]===end[0]&&cur[1]===end[1]&&out==='E')return true;
   const np=[cur[0]+(out==='E'?1:out==='W'?-1:0),cur[1]+(out==='S'?1:out==='N'?-1:0)];entry=opposites[out];cur=np;
  }
 }
 function tileSVG(t){let p='';for(const d of opens(t)){const to={N:[50,6],E:[94,50],S:[50,94],W:[6,50]}[d];p+=`<path d="M50 50 L${to[0]} ${to[1]}" stroke="#243b3b" stroke-width="26" stroke-linecap="round"/><path d="M50 50 L${to[0]} ${to[1]}" stroke="#d4ab65" stroke-width="17" stroke-linecap="round"/>`;}
 return `<svg viewBox="0 0 100 100" aria-hidden="true">${p}<circle cx="50" cy="50" r="10" fill="#f5d697"/></svg>`;}
 function pipelineUI(m){const t=get(m);let h=`<div class="skill-heading"><span>02 / LEITUNGSBAU</span><strong>Rohrnetz verbinden</strong><small>Drehe die Rohrstücke. Vom linken Anschluss muss eine durchgängige Leitung zum rechten Ausgang führen.</small></div><div class="pipe-outlets"><b>◀ QUELLE</b><b>ZIEL ▶</b></div><div class="skill-pipeboard" role="group" aria-label="Drehbares Rohrleitungsfeld mit fünf Spalten und drei Reihen">`;
 for(let y=0;y<3;y++)for(let x=0;x<5;x++){const cell=t[`${x}-${y}`];h+=cell?`<button type="button" class="skill-pipe-tile" data-arcade="rotate" data-cell="${cell.id}" aria-label="Rohrstück Spalte ${x+1} Zeile ${y+1} um 90 Grad drehen" title="Drehen">${tileSVG(cell)}</button>`:`<span class="skill-rock" aria-hidden="true">▧</span>`;}
 h+=`</div><div class="skill-footer"><span>Abschnitt ${m.stage+1} von 3 · Fehlversuche ${m.attempts}/2</span><button type="button" data-arcade="pipe-check">Leitung unter Druck prüfen</button></div>`;return h;}
 function drillUI(m,E,s){get(m);const goal=E.target(s,m),tol=[6,4,3][m.stage],min=goal-tol,max=goal+tol;return `<div class="skill-heading"><span>01 / BOHRTECHNIK</span><strong>Druck unter Kontrolle</strong><small>Positioniere den Bohrdruck im goldenen Bereich. Jeder Bohrabschnitt benötigt höhere Präzision.</small></div><div class="skill-drill-panel"><div class="skill-drill-graphic" aria-hidden="true"><div class="skill-rig"><i></i><i></i><i></i><i></i></div><div class="skill-depth"><div style="height:${(m.stage+1)*33}%"></div></div><span>ABSCHNITT ${m.stage+1}/3</span></div><div class="skill-controls"><label for="skillPressure">Bohrdruck <strong id="pressureValue">${pressure} %</strong></label><div class="skill-meter"><div class="skill-safeband" style="left:${min}%;width:${max-min}%"></div><div class="skill-marker" id="pressureMarker" style="left:${pressure}%"></div></div><input id="skillPressure" type="range" min="0" max="100" step="1" value="${pressure}" aria-describedby="skillDrillHint"><small id="skillDrillHint">Sicherheitszone: ${min}–${max} %. Aktuell ${m.attempts} Fehlversuche; zwei Fehlschläge beenden den Auftrag.</small><button type="button" data-arcade="drill-check">Bohrdruck übernehmen</button></div></div>`;}
 function fireUI(m){get(m);const e=emergencies[m.stage];return `<div class="skill-heading"><span>03 / FEUERWEHR</span><strong>${e.name}</strong><small>${e.hint}</small></div><div class="skill-fire-scene"><span aria-hidden="true">♨</span><div class="skill-smoke" aria-hidden="true"></div><div class="skill-flames" style="--flame:${e.flame}%" aria-hidden="true">🔥 🔥 🔥</div><small>Alarmstufe ${3-m.stage} · ${m.attempts}/2 Fehlversuche</small></div><div class="skill-choices" role="group" aria-label="Taktische Brandbekämpfung">${strategies.map(([id,title])=>`<button type="button" data-arcade="fire" data-choice="${id}">${title}</button>`).join('')}</div>`;}
 function render(m,E,s){return `<section class="skill-console" data-testid="skill-console">${m.kind==='DRILL'?drillUI(m,E,s):m.kind==='PIPE'?pipelineUI(m):fireUI(m)}<div class="skill-feedback" role="status" aria-live="polite">${feedback||'Bereit. Die wirtschaftlichen Kosten wurden bereits beim Start des Minispiels gebucht.'}</div><p class="skill-disclaimer">Eigenständige Berliner Spielmechanik. Keine bestätigte Rekonstruktion der historischen C64-Sequenz. Alle Ergebnisse werden vom bestehenden Wirtschaftskern geprüft.</p></section>`;}
 function setPressure(v){pressure=Math.max(0,Math.min(100,Number(v)||0));const out=document.getElementById('pressureValue'),mark=document.getElementById('pressureMarker');if(out)out.textContent=pressure+' %';if(mark)mark.style.left=pressure+'%';}
 function play(e,m,E,s,resolve,rerender){if(!m)return;if(e==='rotate'){const id=arguments[6];const t=get(m)[id];if(t){t.turns=(t.turns+1)%4;feedback='Rohrstück gedreht. Anschluss überprüfen.';rerender();}return;}
  if(e==='drill-check'){const pass=Math.abs(E.target(s,m)-pressure)<=[6,4,3][m.stage];feedback=pass?'Druck stabilisiert. Bohrphase freigegeben.':'Druck außerhalb der Sicherheitszone.';resolve(pass);return;}
  if(e==='pipe-check'){const pass=checkPipe(m);feedback=pass?'Leitung geschlossen. Druckprüfung bestanden.':'Leck oder falsche Verbindung. Rohre neu ausrichten.';resolve(pass);return;}
  if(e==='fire'){const choice=arguments[6];const pass=choice===emergencies[m.stage].right;feedback=pass?'Einsatzschritt erfolgreich.':'Falsche Maßnahme – Flammen breiten sich aus.';resolve(pass);return;}}
 const test={tileCount:stage=>patterns[stage].length,checkPipe(stage,turns){const m={companyId:'X',claimId:'BERLIN-1',kind:'PIPE',stage};get(m);Object.entries(turns||{}).forEach(([id,t])=>{if(puzzle[id])puzzle[id].turns=t});return checkPipe(m);},solution(stage){const m={companyId:'X',claimId:'BERLIN-1',kind:'PIPE',stage};get(m);return Object.fromEntries(Object.values(puzzle).map(t=>[t.id,0]));},targetFire:stage=>emergencies[stage].right};
 window.PPArcade={render,play,setPressure,reset(){cacheKey='';feedback=''},test};
})();
