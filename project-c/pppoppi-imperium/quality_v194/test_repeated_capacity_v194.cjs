'use strict';
// WIR-02/03: two independently settled real capacity bottlenecks (M3/M6), M8 closure, M9 repair.
// Only original engine actions. No inventory/cash/route-state injection.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E=globalThis.OliV082, P=globalThis.PPPublicNetwork;
const clone=x=>JSON.parse(JSON.stringify(x));
const IDS=['H1','H2'], CLAIMS=['BERLIN-1','BERLIN-2'], PATH=['B-BB','BB-N'];
assert.deepEqual(P.routeFor('BERLIN','NORD'),PATH);
const firm=(s,id)=>s.companies.find(x=>x.id===id);
const command=(type,id,suffix,extra={})=>({type,companyId:id,
  requestId:'MULTIFIRM-CLOSURE-'+id+'-'+suffix,...extra});
function act(s,c) {
  const original=clone(s),r=E.transition(s,c);
  assert.equal(r.duplicate,false,'unexpected duplicate '+c.requestId);
  assert.deepEqual(s,original,'transition mutated input '+c.requestId);
  assert.equal(E.validate(r.state),true);
  return r.state;
}
function rejected(s,c,pattern) {
  const original=clone(s);
  assert.throws(()=>E.transition(s,c),pattern);
  assert.deepEqual(s,original,'rejected action changed state');
}
function roundtrip(s) {
  const restored=clone(s);
  assert.deepEqual(restored,s);
  assert.equal(E.validate(restored),true);
  return restored;
}
function end(s,id,month) {
  const c=command('END_TURN',id,'M'+month+'-END');
  s=act(s,c);
  const duplicate=E.transition(s,c);
  assert.equal(duplicate.duplicate,true);
  assert.deepEqual(duplicate.state,s);
  return s;
}
function audit(s,initial,sold,batches,stage) {
  for(let i=0;i<IDS.length;i++) {
    const id=IDS[i],claim=s.claims[CLAIMS[i]],f=firm(s,id);
    const depot=s.transport.firms[id].BERLIN,plant=s.refinery.plants[id].BERLIN;
    const transport=s.transport.shipments.filter(x=>x.companyId===id)
      .reduce((n,x)=>n+x.qtyMilli,0);
    const publicTransit=s.publicNetwork.inTransit.filter(x=>x.companyId===id)
      .reduce((n,x)=>n+x.qtyMilli,0);
    const queued=s.publicNetwork.queued.filter(x=>x.companyId===id)
      .reduce((n,x)=>n+x.qtyMilli,0);
    const offered=s.publicNetwork.offers.filter(x=>x.companyId===id)
      .reduce((n,x)=>n+x.qtyMilli,0);
    const positions={field:claim.inventoryMilli,prepared:claim.preparedMilli,
      raw:depot.rawMilli,product:plant.productMilli,regional:depot.marketMilli,
      received:s.publicNetwork.received[id].NORD,transport,publicTransit,queued,offered,
      sold:sold[id],refiningLoss:batches*1000};
    for(const [name,value] of Object.entries(positions))
      assert.ok(Number.isSafeInteger(value)&&value>=0,
        'audit: invalid '+name+' '+stage+' '+id);
    assert.equal(claim.owner,id,'audit: wrong owner '+stage+' '+id);
    assert.equal(initial[id].reserveMilli-claim.reserveMilli,E.CFG.pumpMilli,
      'audit: production '+stage+' '+id);
    assert.equal(Object.values(positions).reduce((a,b)=>a+b,0),E.CFG.pumpMilli,
      'audit: physical conservation '+stage+' '+id);
    const ledger=f.ledger.reduce((n,x)=>n+x.deltaCent,0);
    assert.equal(f.cashCent-initial[id].cashCent,ledger,
      'audit: cash/ledger '+stage+' '+id);
    const sales=f.ledger.filter(x=>x.code==='AUSSENMARKT');
    const reportSales=s.reports.map(r=>
      r.publicNetwork?.productMarket?.NORD?.allocations?.[id]).filter(Boolean);
    assert.equal(sales.reduce((n,x)=>n+x.deltaCent,0),
      reportSales.reduce((n,x)=>n+x.revenueCent,0),
      'audit: cumulative external revenue '+stage+' '+id);
    assert.equal(sales.length,reportSales.filter(x=>x.soldMilli>0).length,
      'audit: external sales entry count '+stage+' '+id);
  }
}
function freightAudit(s,month,requested,accepted,returned,used) {
  const report=s.lastReport.publicNetwork;
  for(const edge of PATH) {
    assert.equal(report.capacity[edge].usedMilli,used,
      'audit: capacity '+month+' '+edge);
    assert.equal(report.capacity[edge].downUntil,
      month===8&&edge==='B-BB'?10:0,
      'audit: closure '+month+' '+edge);
  }
  for(const id of IDS) {
    const rows=report.freight.filter(x=>x.companyId===id);
    assert.equal(rows.length,1,'audit: freight row count '+month+' '+id);
    const x=rows[0];
    assert.equal(x.requestedMilli,requested,'audit: requested '+month+' '+id);
    assert.equal(x.acceptedMilli,accepted,'audit: accepted '+month+' '+id);
    assert.equal(x.returnedMilli,returned,'audit: returned '+month+' '+id);
    assert.equal(x.acceptedMilli+x.returnedMilli,requested,
      'audit: freight conservation '+month+' '+id);
    const journal=firm(s,id).ledger.filter(x=>x.month===month);
    const holds=journal.filter(x=>x.code==='PUBLIC_FREIGHT_HOLD');
    const refunds=journal.filter(x=>x.code==='FRACHT_RUECKGABE');
    assert.equal(holds.length,1,'audit: hold count '+month+' '+id);
    assert.equal(holds[0].deltaCent,-P.freight(requested,PATH),
      'audit: hold value '+month+' '+id);
    assert.equal(refunds.length,returned?1:0,
      'audit: refund count '+month+' '+id);
    assert.equal(refunds.reduce((n,x)=>n+x.deltaCent,0),
      P.freight(returned,PATH),'audit: refund value '+month+' '+id);
    assert.equal(-holds[0].deltaCent-
      refunds.reduce((n,x)=>n+x.deltaCent,0),
      P.freight(accepted,PATH),'audit: net freight '+month+' '+id);
  }
}
function play() {
  let s=E.fresh({humans:2,ais:0,seed:'REPEATED-CAPACITY-TWO-FIRMS'});
  const initial={};
  for(let i=0;i<2;i++) initial[IDS[i]]={
    cashCent:firm(s,IDS[i]).cashCent,
    reserveMilli:s.claims[CLAIMS[i]].reserveMilli};
  const sold={H1:0,H2:0};
  let roundtrips=0,duplicates=0,corruptions=0,foreign=0,repairs=0;
  let batches=0;
  function settle(month) {
    for(const id of IDS) s=end(s,id,month);
    if(s.phase==='RESCUE') for(const id of [...s.rescueIds])
      s=act(s,command('RESCUE_LOAN',id,'M'+month+'-RESCUE'));
    assert.equal(s.phase,'REPORT','month '+month+' did not settle');
    assert.equal(s.lastReport.month,month);
    assert.equal(s.reports.length,month);
    for(const id of IDS) {
      const x=s.lastReport.publicNetwork.productMarket.NORD.allocations[id];
      if(x) {
        sold[id]+=x.soldMilli;
        assert.equal(firm(s,id).ledger.filter(e=>e.code==='AUSSENMARKT')
          .reduce((n,e)=>n+e.deltaCent,0),
          s.reports.reduce((n,r)=>n+
            (r.publicNetwork?.productMarket?.NORD?.allocations?.[id]?.revenueCent||0),0),
          'audit: cumulative external revenue '+month+' '+id);
      }
    }
    audit(s,initial,sold,batches,'M'+month);
    s=roundtrip(s);roundtrips++;
  }
  function advance(month) {
    s=act(s,command('NEXT_MONTH','H1','M'+month+'-NEXT'));
    assert.equal(s.month,month);
    s=roundtrip(s);roundtrips++;
  }
  function queue(id,month,qty) {
    const c=command('PUBLIC_QUEUE',id,'M'+month+'-QUEUE',
      {from:'BERLIN',to:'NORD',qtyMilli:qty});
    s=act(s,c);
    const duplicate=E.transition(s,c);
    assert.equal(duplicate.duplicate,true);
    assert.deepEqual(duplicate.state,s);
    duplicates++;
  }
  // M1: genuinely purchase, drill, pump, and transport 20 bbl of raw oil per firm.
  for(let i=0;i<2;i++) {
    const id=IDS[i],claimId=CLAIMS[i];
    for(const [type,extra] of [
      ['SURVEY',{claimId}],['BUY',{claimId}],['DRILL',{claimId}],
      ['PUMP',{claimId}],['REFINERY_BUILD',{region:'BERLIN',claimId}],
      ['ROUTE_BUILD',{region:'BERLIN'}],['NETWORK_ENABLE',{region:'BERLIN'}],
      ['NETWORK_BUILD',{region:'BERLIN',kind:'RAW',claimId}],
      ['NETWORK_BUILD',{region:'BERLIN',kind:'PIPE'}],
      ['NETWORK_BUILD',{region:'BERLIN',kind:'FINAL'}],
      ['NETWORK_RAW',{region:'BERLIN',claimId,qtyMilli:20000}]
    ]) s=act(s,command(type,id,'M1-'+type+'-'+(extra.kind||''),extra));
    if(i===1) {
      rejected(s,command('PUMP',id,'FOREIGN',{claimId:CLAIMS[0]}),
        /Claim gehört nicht zum Unternehmen/);
      foreign++;
    }
    s=end(s,id,1);
  }
  // M1 was already ended during ownership setup.
  assert.equal(s.phase,'REPORT');
  for(const id of IDS) audit(s,initial,sold,batches,'M1-'+id);
  s=roundtrip(s);roundtrips++;
  advance(2);
  for(let i=0;i<2;i++) {
    const id=IDS[i],claimId=CLAIMS[i];
    for(let n=0;n<2;n++) s=act(s,command('NETWORK_REFINE',id,'M2-REFINE-'+n,
      {region:'BERLIN',claimId}));
    s=act(s,command('NETWORK_PRODUCT',id,'M2-PRODUCT',
      {region:'BERLIN',qtyMilli:18000}));
    s=end(s,id,2);
  }
  batches=2;
  assert.equal(s.phase,'REPORT');
  audit(s,initial,sold,batches,'M2');
  s=roundtrip(s);roundtrips++;
  advance(3);
  for(const id of IDS) {
    s=act(s,command('PUBLIC_CONNECT',id,'M3-CONNECT',
      {from:'BERLIN',to:'NORD'}));
    // Regional RAW link is limited to 30 bbl per month: transport the
    // second 20 bbl naturally in M3, arriving for M4 refining.
    s=act(s,command('NETWORK_RAW',id,'M3-RAW',
      {region:'BERLIN',claimId:CLAIMS[IDS.indexOf(id)],qtyMilli:20000}));
    queue(id,3,18000);
    s=end(s,id,3);
  }
  assert.equal(s.phase,'REPORT');
  freightAudit(s,3,18000,9000,9000,18000);
  audit(s,initial,sold,batches,'M3');
  s=roundtrip(s);roundtrips++;
  for(const month of [4,5,6,7]) {
    advance(month);
    if(month===4) {
      for(let i=0;i<2;i++) {
        const id=IDS[i],claimId=CLAIMS[i];
        // Real month-end events may damage or ignite a claim. Use the
        // existing paid game actions; never clear a damage flag directly.
        if(s.claims[claimId].burning)
          s=act(s,command('FIRE_EXPERT',id,'M4-EXTINGUISH',{claimId}));
        if(s.claims[claimId].damaged)
          s=act(s,command('REPAIR',id,'M4-REPAIR',{claimId}));
        for(let n=0;n<2;n++) s=act(s,command('NETWORK_REFINE',id,'M4-REFINE-'+n,
          {region:'BERLIN',claimId}));
      }
      batches=4;
    }
    if(month===5) for(const id of IDS) {
      s=act(s,command('NETWORK_PRODUCT',id,'M5-PRODUCT',
        {region:'BERLIN',qtyMilli:18000}));
      assert.equal(s.publicNetwork.received[id].NORD,9000);
      s=act(s,command('PUBLIC_OFFER',id,'M5-OFFER',
        {from:'BERLIN',to:'NORD',qtyMilli:9000}));
      s=end(s,id,5);
    }
    if(month===6) for(const id of IDS) {
      queue(id,6,18000);
      s=end(s,id,6);
    }
    if(month===5) {
      assert.equal(s.phase,'REPORT');
      for(const id of IDS) sold[id]+=s.lastReport.publicNetwork
        .productMarket.NORD.allocations[id].soldMilli;
      audit(s,initial,sold,batches,'M5');
      s=roundtrip(s);roundtrips++;
    } else if(month===6) {
      assert.equal(s.phase,'REPORT');
      freightAudit(s,6,18000,9000,9000,18000);
      audit(s,initial,sold,batches,'M6');
      s=roundtrip(s);roundtrips++;
    } else settle(month);
  }
  advance(8);
  assert.equal(s.publicNetwork.links['B-BB'].downUntil,10,
    'public closure not triggered at M8');
  for(const id of IDS) {
    queue(id,8,9000);
    assert.equal(s.publicNetwork.received[id].NORD,9000);
    s=act(s,command('PUBLIC_OFFER',id,'M8-OFFER',
      {from:'BERLIN',to:'NORD',qtyMilli:9000}));
    s=end(s,id,8);
  }
  for(const id of IDS) sold[id]+=
    s.lastReport.publicNetwork.productMarket.NORD.allocations[id].soldMilli;
  assert.equal(s.phase,'REPORT');
  freightAudit(s,8,9000,0,9000,0);
  for(const id of IDS) assert.equal(s.transport.firms[id].BERLIN.marketMilli,18000);
  audit(s,initial,sold,batches,'M8');
  for(const id of IDS) {
    const bad=clone(s);
    bad.lastReport.publicNetwork.freight.find(x=>x.companyId===id).acceptedMilli++;
    assert.throws(()=>freightAudit(bad,8,9000,0,9000,0),/audit:/);
    corruptions++;
  }
  s=roundtrip(s);roundtrips++;
  advance(9);
  rejected(s,command('PUBLIC_REPAIR','H1','M9-BAD-LINK',{link:'INVALID'}),
    /Unbekannte öffentliche Strecke/);
  s=act(s,command('PUBLIC_REPAIR','H1','M9-REPAIR',{link:'B-BB'}));
  repairs++;
  assert.equal(s.publicNetwork.links['B-BB'].downUntil,0);
  queue('H1',9,9000);
  s=end(s,'H1',9);
  rejected(s,command('PUBLIC_REPAIR','H2','M9-REPAIR-AGAIN',{link:'B-BB'}),
    /Öffentliche Strecke nicht gesperrt/);
  queue('H2',9,9000);
  s=end(s,'H2',9);
  assert.equal(s.phase,'REPORT');
  freightAudit(s,9,9000,9000,0,18000);
  assert.equal(firm(s,'H1').ledger.filter(x=>x.code==='PUBLIC_REPAIR').length,1);
  assert.equal(firm(s,'H2').ledger.filter(x=>x.code==='PUBLIC_REPAIR').length,0);
  assert.equal(firm(s,'H1').ledger.find(x=>x.code==='PUBLIC_REPAIR').deltaCent,
    -600000);
  audit(s,initial,sold,batches,'M9');
  for(const id of IDS) {
    const bad=clone(s);
    bad.publicNetwork.inTransit.find(x=>x.companyId===id).qtyMilli++;
    assert.throws(()=>audit(bad,initial,sold,batches,'tampered-M9'),/audit:/);
    corruptions++;
  }
  s=roundtrip(s);roundtrips++;
  advance(10);settle(10);
  advance(11);
  for(const id of IDS) {
    assert.equal(s.publicNetwork.received[id].NORD,9000);
    s=act(s,command('PUBLIC_OFFER',id,'M11-OFFER',
      {from:'BERLIN',to:'NORD',qtyMilli:9000}));
    s=end(s,id,11);
  }
  assert.equal(s.phase,'REPORT');
  assert.equal(s.reports.length,11);
  for(const id of IDS)
    sold[id]+=s.lastReport.publicNetwork.productMarket.NORD.allocations[id].soldMilli;
  audit(s,initial,sold,batches,'M11');
  s=roundtrip(s);roundtrips++;
  assert.deepEqual(sold,{H1:27000,H2:27000});
  for(const id of IDS) {
    assert.equal(s.claims[CLAIMS[IDS.indexOf(id)]].inventoryMilli,60000);
    assert.equal(s.transport.firms[id].BERLIN.marketMilli,9000);
    assert.equal(s.publicNetwork.received[id].NORD,0);
    for(const change of [
      state=>{state.claims[CLAIMS[IDS.indexOf(id)]].inventoryMilli++;},
      state=>{firm(state,id).cashCent++;},
      state=>{firm(state,id).ledger[0].deltaCent++;}
    ]) {
      const bad=clone(s);change(bad);
      assert.throws(()=>audit(bad,initial,sold,batches,'tampered-M11'),/audit:/);
      corruptions++;
    }
  }
  assert.equal(s.publicNetwork.inTransit.length,0);
  assert.equal(s.transport.shipments.length,0);
  assert.equal(s.publicNetwork.queued.length,0);
  return {months:11,companyMonthChecks:22,roundtrips,duplicates,
    corruptions,foreign,repairs,sold,finalMonth:s.month,
    closedMonth:8,repairedMonth:9,freightMonths:[3,6,8,9],bottleneckMonths:[3,6]};
}
const first=play(),second=play();
assert.deepEqual(second,first,'non-deterministic repeat');
console.log(JSON.stringify({
  schema:'pppoppi.multifirm-repeated-capacity/1',
  runs:2,simulatedMonths:22,companyMonthChecks:44,
  jsonRoundtrips:first.roundtrips+second.roundtrips,
  duplicatesRejected:first.duplicates+second.duplicates,
  corruptionsCaught:first.corruptions+second.corruptions,
  foreignActionsRejected:first.foreign+second.foreign,
  publicRepairs:first.repairs+second.repairs,
  noInjectedInventoryOrCash:true,prereleaseGate:'BLOCKED',
  result:first,
  limitations:['Two real 18+18 bbl oversubscription months, separate monthly settlement and refunds.',
    'M3 and M6 each independently oversubscribed: 18+18 bbl ordered, 9+9 accepted, 9+9 refunded.',
    'M8 full refund on public closure; M9 one real shared repair and renewed freight.',
    'No profit/asset valuation, full endgame, historical C64 or asset-rights clearance.']
},null,2));
