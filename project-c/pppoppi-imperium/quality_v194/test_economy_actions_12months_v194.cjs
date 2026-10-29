'use strict';
// WIR-04/LOG-02/LOG-03: 12 echte Wirtschaftszuege der eigenstaendigen Berliner Engine.
// Kein historischer C64-Vergleich, keine Browser- oder Prozessneustartbehauptung.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');
const clone = x => JSON.parse(JSON.stringify(x));
let checks = 0, actions = 0, repaired = 0;
function check(label, fn) {
  fn();
  checks++;
  console.log('PASS', checks, label);
}
function send(state, companyId, type, requestId, extra = {}) {
  const before = clone(state);
  const result = E.transition(state, {type, companyId, requestId, ...extra});
  assert.equal(result.duplicate, false, requestId + ' doppelt');
  assert.deepEqual(state, before, 'Eingangsspielstand unerwartet veraendert');
  assert.equal(E.validate(result.state), true);
  actions++;
  return result.state;
}
const fields = {
  H1: ['BERLIN-1', 'BERLIN-2', 'BERLIN-3'],
  H2: ['BRANDENBURG-1', 'BRANDENBURG-2', 'BRANDENBURG-3']
};
let state = E.fresh({humans: 2, ais: 0, seed: 'WIR04-REAL-ACTIONS-12M-20261029'});
state.companies[0].cashCent = 700000000;
state.companies[0].debtCent = 400000000;
state.companies[1].cashCent = 350000000;
state.companies[1].debtCent = 200000000;
state.companies[0].obligations = [
  {id:'ALT-FRACHT',priority:2,kind:'TRANSPORT',dueCent:450000,paidCent:50000},
  {id:'ALT-ZINS',priority:3,kind:'ZINS',dueCent:90000,paidCent:20000}
];
check('Ausgangsstand mit zwei verschuldeten Firmen und offenen Rechnungen', () => {
  assert.equal(E.validate(state), true);
  assert.equal(state.companies.length, 2);
});
for (let month = 1; month <= 12; month++) {
  const before = clone(state);
  const previousLedgers = before.companies.map(f => f.ledger.length);
  const previousCash = before.companies.map(f => f.cashCent);
  const previousDebt = before.companies.map(f => f.debtCent);
  for (const companyId of ['H1', 'H2']) {
    const slot = month <= 5 ? 0 : month <= 10 ? 1 : 2;
    const claimId = fields[companyId][slot];
    const id = (action, suffix = '') => 'WIR04-ACT-M' + month + '-' + companyId + '-' + action + suffix;
    const cmd = (type, extra = {}) => {
      state = send(state, companyId, type, id(type), extra);
    };
    if (state.claims[claimId].owner === null) {
      cmd('SURVEY', {claimId});
      cmd('BUY', {claimId});
      cmd('DRILL', {claimId});
    }
    if (state.claims[claimId].burning) {
      cmd('FIRE_EXPERT', {claimId});
      repaired++;
    }
    cmd('PUMP', {claimId});
    cmd('SHIP', {claimId});
    cmd('OFFER', {claimId});
    if (month === 1 && companyId === 'H1') {
      cmd('SIGN', {region: 'BERLIN'});
    }
    check('Monat ' + month + ' ' + companyId + ': echte Foerderung und Marktangebot', () => {
      const c = state.claims[claimId];
      const f = state.companies.find(f => f.id === companyId);
      assert.equal(c.owner, companyId);
      assert.equal(c.drilled, true);
      assert.equal(c.order, true);
      assert.equal(c.preparedMilli, E.CFG.pumpMilli);
      assert.equal(f.monthProducedMilli, E.CFG.pumpMilli);
    });
    cmd('END_TURN');
  }
  check('Monat ' + month + ': echter Monatsbericht und gueltiger Abschluss', () => {
    assert.equal(state.phase, 'REPORT');
    assert.equal(state.month, month);
    assert.equal(state.reports.length, month);
    assert.equal(state.lastReport.month, month);
    assert.equal(state.rescueIds.length, 0);
    for (const f of state.companies) {
      assert.equal(E.pending(f), 0);
      assert.ok(f.obligations.every(o => o.dueCent === o.paidCent));
    }
  });
  check('Monat ' + month + ': Einnahmen, Zahlungen und Tilgung stimmen', () => {
    for (let i = 0; i < 2; i++) {
      const f = state.companies[i];
      const entries = f.ledger.slice(previousLedgers[i]);
      const cashDelta = entries.reduce((n, x) => n + x.deltaCent, 0);
      const repayment = entries.filter(x => x.code === 'ZAHLUNG_TILGUNG')
        .reduce((n, x) => n - x.deltaCent, 0);
      assert.equal(f.cashCent, previousCash[i] + cashDelta);
      assert.equal(f.debtCent, previousDebt[i] - repayment);
      assert.ok(entries.some(x => x.code === 'FOERDERUNG'));
      assert.ok(entries.some(x => x.code === 'TRANSPORT'));
      assert.ok(entries.some(x => x.code === 'MARKTERLÖS'));
      assert.ok(entries.some(x => x.code === 'ZAHLUNG_ZINS'));
    }
  });
  if (month === 1) {
    check('Monat 1: Vertrag bleibt bis zur naechsten Abrechnung offen', () => {
      assert.equal(state.companies[0].contracts.length, 1);
      assert.equal(state.companies[0].contracts[0].status, 'OPEN');
    });
  }
  if (month === 2) {
    check('Monat 2: Vertrag aus realer Foerderung erfuellt', () => {
      const f = state.companies[0];
      assert.equal(f.contracts[0].status, 'DONE');
      assert.equal(f.contracts[0].soldMilli, E.CFG.contractQty);
      assert.equal(f.stats.contractsDone, 1);
      assert.ok(f.ledger.some(x => x.code === 'VERTRAGSERLÖS'));
    });
  }
  const endId = 'WIR04-ACT-M' + month + '-H2-END_TURN';
  check('Monat ' + month + ': doppelte Abschlussanforderung wirkungslos', () => {
    const duplicate = E.transition(state, {type:'END_TURN', companyId:'H2', requestId:endId});
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.state, state);
  });
  const exported = JSON.stringify(state);
  const restored = JSON.parse(exported);
  check('Monat ' + month + ': JSON-Spielstand verlustfrei wiederhergestellt', () => {
    assert.equal(E.validate(restored), true);
    assert.deepEqual(restored, state);
    assert.deepEqual(before.companies.map(f => f.id), ['H1', 'H2']);
  });
  state = restored;
  if (month < 12) state = send(state, 'H1', 'NEXT_MONTH', 'WIR04-ACT-M' + month + '-NEXT');
}
check('Zwoelf Wirtschaftsmonate, Vertrag und mindestens eine Brandbehebung', () => {
  assert.equal(state.reports.length, 12);
  assert.equal(state.companies[0].stats.contractsDone, 1);
  assert.ok(repaired >= 1, 'Kein periodischer Brand behandelt');
  assert.ok(state.events.some(e => e.type === 'BRAND'));
  assert.ok(state.companies.every(f => f.generation === 1));
});
console.log('WIR-04:', JSON.stringify({
  result:'PASS', checks, actions, months:12, companies:2, repaired,
  active_actions:['SURVEY','BUY','DRILL','PUMP','SHIP','OFFER','SIGN','FIRE_EXPERT'],
  json_roundtrips:12, browser_process_restarts:'NOT_TESTED',
  historical_c64_equivalence:'NOT_TESTED', release_gate:'BLOCKED'
}));
