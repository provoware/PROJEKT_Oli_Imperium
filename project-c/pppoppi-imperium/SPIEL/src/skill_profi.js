/* V1.5.1: optional skill obstacles added without editing historical V0.8.2 economics.
   No penalty or charge for preparation; only original core can accept/reject outcomes. */
(function(root){'use strict';const base=root.PPArcade;if(!base)throw Error('Skill V1.4 required');
 let mode='standard',key='',ready=false,feedback='';
 function k(m){return [m.companyId,m.claimId,m.kind,m.stage].join(':')}
 function context(m,s){const mix=[...m.claimId].reduce((a,b)=>a+b.charCodeAt(0),s.month);return ['Windböen am Förderturm','Schiefergestein und Druckschwankungen','Alter Rohranschluss unter Spannung'][mix%3]}
 function prepare(m){if(k(m)!==key){key=k(m);ready=false;feedback='';}}
 const render=base.render;
 base.render=function(m,E,s){prepare(m);const label=m.kind==='DRILL'?'Bohrkopf zentrieren und Druck prüfen':m.kind==='PIPE'?'Störventil verriegeln, dann Verbindung prüfen':'Einsatztrupp sichern, dann Löschfolge starten';
  return render(m,E,s)+`<aside class="profi-skill" data-testid="skill-profi"><div><b>EXPERTEN-EINSATZ</b><span>${context(m,s)}</span></div><label for="skillMode">Schwierigkeit</label><select id="skillMode" aria-label="Schwierigkeitsgrad"><option value="einfach" ${mode==='einfach'?'selected':''}>Einfach</option><option value="standard" ${mode==='standard'?'selected':''}>Standard</option><option value="profi" ${mode==='profi'?'selected':''}>Profi</option></select><p>Zusatzaufgabe: ${label}. Im Profi-Modus ist die Vorbereitung verpflichtend; sie kostet weder Geld noch Spieltage.</p><button type="button" data-arcade="profi-prep">${ready?'✓ Vorbereitung abgeschlossen':'Vorbereitung durchführen'}</button><small role="status">${feedback||'Optional auf Einfach / Standard. Pflicht auf Profi.'}</small></aside>`;
 };
 const play=base.play;
 base.play=function(a,m,E,s,resolve,rerender,choice){prepare(m);if(a==='profi-prep'){ready=true;feedback='Sicherungsmaßnahme abgeschlossen.';rerender();return;}
  if(mode==='profi'&&!ready&&['drill-check','pipe-check','fire'].includes(a)){feedback='Profi-Einsatz: Erst die Sicherungsmaßnahme durchführen.';rerender();return;}
  if(['drill-check','pipe-check','fire'].includes(a)){ready=false;feedback='';}
  return play(a,m,E,s,resolve,rerender,choice);
 };
 root.addEventListener('change',e=>{if(e.target.id==='skillMode'&&['einfach','standard','profi'].includes(e.target.value)){mode=e.target.value;feedback='Schwierigkeit gesetzt. Keine Änderung an Kosten oder Spieltagen.';}});
 root.PPSkillProfi={setMode:x=>{if(!['einfach','standard','profi'].includes(x))throw Error('Ungültig');mode=x},status:()=>({mode,key,ready})};
})(typeof globalThis!=='undefined'?globalThis:this);
