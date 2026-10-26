/* V1.9.4: optionale, atomare lokale Zwischenstaende; kein Cloud-Dienst.
 * Nur der technische Vorschauaufbau laedt diese Datei. Die 110 Originale bleiben unveraendert.
 * IndexedDB schreibt einen vollstaendigen JSON-Snapshot pro Transaktion und behaelt zwei Generationen.
 * Ein Browser-/Datentraegerabsturz ist damit NICHT als getestet oder ausfallsicher bewiesen.
 */
(()=>{'use strict';
const DB_NAME='pppoppi-imperium-local-backups-v1', STORE='snapshots', MAX_BYTES=5_000_000;
let queue=Promise.resolve();
const indicator=document.createElement('div');
indicator.id='backupStatus';
indicator.setAttribute('role','status');
indicator.setAttribute('aria-live','polite');
indicator.style.cssText='position:fixed;bottom:4px;right:6px;z-index:24;max-width:min(90vw,390px);padding:4px 8px;border:1px solid #99845d;border-radius:5px;background:#14272b;color:#f6e6c4;font:12px/1.4 sans-serif;pointer-events:none';
document.body.appendChild(indicator);
function status(message,bad=false){
 indicator.textContent=message;
 indicator.style.borderColor=bad?'#ff9b77':'#99845d';
 indicator.dataset.error=bad?'true':'false';
}
status('Zwischensicherung bereit – JSON-Export bleibt empfohlen.');
function openDatabase(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('Browser-Speicher nicht verfügbar'));return;}
  let request;
  try{request=indexedDB.open(DB_NAME,1)}catch(error){reject(error);return;}
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains(STORE))
    request.result.createObjectStore(STORE,{keyPath:'slot'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Browser-Speicher konnte nicht geöffnet werden'));
  request.onblocked=()=>reject(Error('Browser-Speicher ist durch ein anderes Fenster blockiert'));
 });
}
async function writeSnapshot(json){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  let tx;
  try{
   tx=db.transaction(STORE,'readwrite');
   const store=tx.objectStore(STORE);
   const request=store.getAll();
   request.onsuccess=()=>{
    const latest=Math.max(0,...request.result.map(x=>Number.isSafeInteger(x.seq)?x.seq:0));
    const seq=latest+1;
    store.put({slot:seq%2,seq,created:new Date().toISOString(),json});
   };
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onabort=()=>{db.close();reject(tx.error||Error('Schreibvorgang abgebrochen'))};
   tx.onerror=()=>{}; // onabort reports the complete transaction failure
  }catch(error){db.close();reject(error)}
 });
}
async function readSnapshots(){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  let tx, result=[];
  try{
   tx=db.transaction(STORE,'readonly');
   const request=tx.objectStore(STORE).getAll();
   request.onsuccess=()=>{result=request.result};
   tx.oncomplete=()=>{db.close();resolve(result)};
   tx.onabort=()=>{db.close();reject(tx.error||Error('Sicherungen nicht lesbar'))};
  }catch(error){db.close();reject(error)}
 });
}
function capture(state){
 let json;
 try{
  json=JSON.stringify(state);
  if(!json||new Blob([json]).size>MAX_BYTES)throw Error('Spielstand überschreitet 5 MB');
 }catch(error){status('Automatische Sicherung fehlgeschlagen: '+error.message,true);return Promise.resolve(false)}
 status('Zwischensicherung wird geschrieben …');
 queue=queue.catch(()=>false).then(()=>writeSnapshot(json)).then(()=>{
  status('Zwischensicherung vollständig gespeichert. JSON-Export empfohlen.');
  return true;
 }).catch(error=>{
  status('Sicherung fehlgeschlagen: '+(error?.message||'Browser-Speicher gesperrt')+'. JSON exportieren!',true);
  return false;
 });
 return queue;
}
async function restore(validate){
 await queue; // niemals eine noch laufende eigene Sicherung überholen
 let saves;
 try{saves=(await readSnapshots()).sort((a,b)=>b.seq-a.seq)}
 catch(error){
  status('Wiederherstellung nicht möglich: '+(error?.message||'Browser-Speicher nicht lesbar')+'. JSON-Datei laden!',true);
  throw error;
 }
 if(!saves.length){
  status('Keine lokale Zwischensicherung vorhanden. JSON-Datei laden!',true);
  throw Error('Keine lokale Zwischensicherung vorhanden');
 }
 for(let i=0;i<saves.length;i++){
  try{
   const state=JSON.parse(saves[i].json);
   if(validate(state)!==true)throw Error('Ungültiger Spielstand');
   status(i?'Ältere gültige Sicherung gefunden – neuere beschädigt.':'Gültige Zwischensicherung geprüft.');
   return {state,older:i>0,sequence:saves[i].seq};
  }catch(_error){/* nächste, ältere Generation prüfen */}
 }
 status('Beide Zwischensicherungen sind beschädigt. JSON-Datei laden!',true);
 throw Error('Keine gültige Zwischensicherung gefunden');
}
window.PPBackup={capture,restore,idle:()=>queue,status:()=>indicator.textContent};
})();
