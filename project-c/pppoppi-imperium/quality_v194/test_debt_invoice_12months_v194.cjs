'use strict';
// WIR-04: 12 echte Monatsabrechnungen mit hoher Verschuldung und mehreren Rechnungen.
// Testet nur die eigenständige Berliner Engine, NICHT das historische C64-Original.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');
const copy = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function check(name, fn) {
  fn();
  checks += 1;
  console.log('PASS', checks, name);
}
function request(state, type, requestId, companyId = 'H1') {
  const result = E.transition(state, {type, companyId, requestId});
  assert.equal(result.duplicate, false, requestId + ' unerwartet doppelt');
  assert.equal(E.validate(result.state), true);
  return result.state;
}
// Unabhängige ganzzahlige Halb-auf-Rundung: vermeidet JS-Gleitkommafehler
// bei der Berechnung der erwarteten Zinsen und Tilgungen.
function roundedBps(cents, bps) {
  return Number((BigInt(cents) * BigInt(bps) + 5000n) / 10000n);
}
function invoice(firm, month, kind) {
  const id = `M${month}-G${firm.generation}-${kind}`;
  const found = firm.obligations.filter(o => o.id === id);
  assert.equal(found.length, 1, id + ' muss genau einmal vorkommen');
  return found[0];
}
let state = E.fresh({humans: 2, ais: 0, seed: 'WIR04-12-MONATE-20261029'});
state.companies[0].cashCent = 700000000;
state.companies[0].debtCent = 400000000;
state.companies[1].cashCent = 350000000;
state.companies[1].debtCent = 200000000;
// Zwei Prioritätsklassen, bereits teilweise bezahlte Rechnungen und
// ein alter Tilgungsrückstand; alle Werte sind bewusst echte Centbeträge.
state.companies[0].obligations = [
  {id: 'ALT-TRANSPORT', priority: 2, kind: 'TRANSPORT', dueCent: 450000, paidCent: 0},
  {id: 'ALT-ZINS', priority: 3, kind: 'ZINS', dueCent: 90000, paidCent: 20000},
  {id: 'ALT-TILGUNG', priority: 3, kind: 'TILGUNG', dueCent: 1200000, paidCent: 200000}
];
state.companies[1].obligations = [
  {id: 'ALT-PERSONAL', priority: 1, kind: 'PERSONAL', dueCent: 190000, paidCent: 90000}
];
check('Manipulationsfreie Ausgangslage mit hohen Schulden', () => {
  assert.equal(E.validate(state), true);
  assert.equal(state.companies.length, 2);
});
const firstInput = copy(state);
for (let month = 1; month <= 12; month++) {
  const before = copy(state);
  const debts = before.companies.map(f => f.debtCent);
  const cash = before.companies.map(f => f.cashCent);
  const ledgers = before.companies.map(f => f.ledger.length);
  state = request(state, 'END_TURN', `WIR04-M${month}-H1`, 'H1');
  check(`Monat ${month}: H1-Zug geht an H2`, () => {
    assert.equal(state.phase, 'TURN');
    assert.equal(state.companies[state.turnIndex].id, 'H2');
  });
  const endId = `WIR04-M${month}-H2`;
  state = request(state, 'END_TURN', endId, 'H2');
  check(`Monat ${month}: Abrechnung ohne Insolvenz`, () => {
    assert.equal(state.phase, 'REPORT');
    assert.equal(state.lastReport.month, month);
    assert.equal(state.rescueIds.length, 0);
    assert.equal(state.reports.length, month);
  });
  for (let i = 0; i < 2; i++) {
    const f = state.companies[i];
    const beforeFirm = before.companies[i];
    check(`Monat ${month} ${f.id}: Zins und Tilgung exakt gerundet`, () => {
      assert.equal(invoice(f, month, 'ZINS').dueCent,
        roundedBps(debts[i], E.CFG.loanInterestBps));
      assert.equal(invoice(f, month, 'TILGUNG').dueCent,
        Math.min(debts[i] - beforeFirm.obligations
          .filter(o => o.kind === 'TILGUNG')
          .reduce((total, o) => total + o.dueCent - o.paidCent, 0),
          roundedBps(debts[i], E.CFG.loanRepaymentBps)));
      assert.equal(invoice(f, month, 'LOHN').dueCent, E.CFG.wage);
    });
    check(`Monat ${month} ${f.id}: Rechnungen vollständig bezahlt`, () => {
      assert.equal(E.pending(f), 0);
      assert.ok(f.obligations.every(o => o.dueCent === o.paidCent));
    });
    check(`Monat ${month} ${f.id}: Bargeld und Schulden bilanziert`, () => {
      const additions = f.ledger.slice(ledgers[i]);
      const cashDelta = additions.reduce((total, entry) => total + entry.deltaCent, 0);
      const repaid = additions
        .filter(entry => entry.code === 'ZAHLUNG_TILGUNG')
        .reduce((total, entry) => total - entry.deltaCent, 0);
      assert.equal(f.cashCent, cash[i] + cashDelta);
      assert.equal(f.debtCent, debts[i] - repaid);
      assert.ok(f.cashCent >= 0 && f.debtCent >= 0);
    });
  }
  check(`Monat ${month}: doppelte Monatsbuchung wird unterbunden`, () => {
    const duplicate = E.transition(state, {type: 'END_TURN', companyId: 'H2', requestId: endId});
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.state, state);
  });
  // Dateiexport/-import als JSON-Rundlauf; keine Browser-Dateidialogbehauptung.
  const restored = copy(state);
  check(`Monat ${month}: JSON-Wiederherstellung ohne Geldverlust`, () => {
    assert.equal(E.validate(restored), true);
    assert.deepEqual(restored, state);
  });
  state = restored;
  if (month < 12) state = request(state, 'NEXT_MONTH', `WIR04-M${month}-NEXT`);
}
check('Zwölf Monatsberichte und unveränderte Eingangsdaten', () => {
  assert.equal(state.reports.length, 12);
  assert.equal(state.month, 12);
  assert.deepEqual(firstInput.companies.map(f => f.debtCent), [400000000, 200000000]);
  assert.equal(firstInput.companies[0].obligations[2].paidCent, 200000);
});
console.log('WIR-04:', JSON.stringify({
  result: 'PASS', checks, months: 12, companies: 2,
  browser_restart: 'NOT_TESTED', historical_c64_equivalence: 'NOT_TESTED',
  full_business_gameplay: 'NOT_TESTED', release_gate: 'BLOCKED'
}));
