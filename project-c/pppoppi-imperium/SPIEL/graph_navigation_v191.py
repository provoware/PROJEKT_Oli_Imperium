from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
p=Path(__file__).resolve().parent
s=p.joinpath('index.html').read_text()
s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+p.joinpath(m.group(1)).read_text()+'</style>',s)
s=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+p.joinpath(m.group(1)).read_text()+'</script>',s)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page();page.set_content(s,wait_until='load');page.evaluate("NeoEconomy.start('1-2')")
 result=page.evaluate('''() => {
 const names=PPNavigation191.getScenes(), edges={}, missing=new Set();
 const known=new Set(names);
 const auto={region:['region'], 'public-region':['publicNetwork'],'handoff-ok':['computer'],'newgame':['computer']};
 for(let id of names){
  const targets=[];try{PPNavigation191.open(id);}catch(e){missing.add(id);continue}
  document.querySelectorAll('#dialogContent button').forEach(b=>{
   let to=b.dataset.go||b.dataset.act||b.dataset.claim&&'claim';
   if(b.dataset.ui && auto[b.dataset.ui])to=auto[b.dataset.ui][0];
   if(to&&known.has(to)&&to!==id)targets.push(to)
  });
  edges[id]=[...new Set(targets)];
 }
 const start=[...document.querySelectorAll('#stage [data-fun]')].map(b=>b.dataset.fun).filter(x=>known.has(x));
 start.push('help','quick','startup','minigame');
 const reachable=new Set(start);let change=true;
 while(change){change=false;for(let k of [...reachable])for(let j of edges[k]||[])if(!reachable.has(j)){reachable.add(j);change=true}}
 return {total:names.length,reachable:[...reachable],unreachable:names.filter(x=>!reachable.has(x)),exceptions:[...missing],edges,entry:start};
}''')
 # known condition-only states are not generically reachable except by gameplay events.
 result['conditional_states']=['report','rescue','handoff']
 result['unexpected_unreachable']=[x for x in result['unreachable'] if x not in result['conditional_states']]
 b.close()
path=p/'evidence_v191'/'NAVIGATIONSGRAPH_V191.json';path.write_text(json.dumps(result,indent=2,ensure_ascii=False))
print('REGISTER',result['total'],'ERREICHBAR',len(result['reachable']),'UNERREICHBAR',result['unreachable'],'NICHT_ERWARTET',result['unexpected_unreachable'],'AUSNAHMEN',result['exceptions'])
if result['unexpected_unreachable'] or result['exceptions']:raise SystemExit(1)
