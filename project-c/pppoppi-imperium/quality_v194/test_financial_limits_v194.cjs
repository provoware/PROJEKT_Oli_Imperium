'use strict';
// WIR-04: Nur die erzeugte, nicht freigegebene Technikfassung enthaelt den
// isolierten BigInt-Fix. Die 110 archivierten Originalquellen bleiben unberuehrt.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length, 3, 'Aufruf: node test_financial_limits_v194.cjs <technische-src>');
const root = path.resolve(process.argv[2]);
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require(path.join(root, name + '.js'));
const E = globalThis.OliV082;
const MAX = Number.MAX_SAFE_INTEGER;
const make = () => E.fresh({humans: 2, ais: 0, seed: 'WIR04-LIMITS'});
let serial = 0, passed = 0;
const cmd = (type, companyId = 'H1', extra = {}) =>
  ({type, companyId, requestId: 'WIR04-' + (++serial), ...extra});
const act = (s, type, companyId = 'H1', extra = {}) => E.transition(s, cmd(type, companyId, extra)).state;
const check = (label, fn) => { fn(); console.log('PASS WIR-04', ++passed, label); };
const count = (f, code) => f.ledger.filter(x => x.code === code).length;
function close(s) {
  s = act(s, 'END_TURN');
  s = act(s, 'END_TURN', 'H2');
  return s;
}
function rescueWithInvoices(invoices) {
  const s = make(), f = s.companies[0];
  f.cashCent = 0;
  f.obligations = invoices.map((dueCent, i) => ({id: 'ALT-' + i, priority: 1,
    dueCent, paidCent: 0, kind: 'PERSONAL'}));
  s.phase = 'RESCUE'; s.rescueIds = ['H1'];
  E.validate(s);
  return s;
}

check('Negative, gebrochene und unsichere Geld- und Schuldwerte im Save gesperrt', () => {
  for (const key of ['cashCent', 'debtCent']) for (const value of [-1, 1.5, MAX + 1, NaN, Infinity]) {
    const s = make(); s.companies[0][key] = value;
    assert.throws(() => E.validate(s), /Firmenwert/);
  }
});

check('Centgenaue Kaufgrenze: Betrag reicht exakt, ein Cent weniger sperrt atomar', () => {
  const price = E.REGIONS.find(r => r.id === 'BERLIN').survey;
  const no = make(); no.companies[0].cashCent = price - 1;
  const snapshot = structuredClone(no);
  assert.throws(() => act(no, 'SURVEY', 'H1', {claimId: 'BERLIN-1'}), /Guthaben/);
  assert.deepEqual(no, snapshot);
  const yes = make(); yes.companies[0].cashCent = price;
  const out = act(yes, 'SURVEY', 'H1', {claimId: 'BERLIN-1'});
  assert.equal(out.companies[0].cashCent, 0);
  assert.equal(count(out.companies[0], 'GUTACHTEN'), 1);
  assert.equal(out.companies[1].cashCent, E.CFG.startCash);
});

check('Raffineriebau bei Geldmangel verweigert ohne Zeit- oder Journalverlust', () => {
  const s = make(); s.claims['BERLIN-1'].owner = 'H1';
  s.claims['BERLIN-1'].drilled = true;
  s.companies[0].cashCent = globalThis.PPProfi.COSTS.buildCent - 1;
  E.validate(s); const before = structuredClone(s);
  assert.throws(() => act(s, 'REFINERY_BUILD', 'H1', {claimId: 'BERLIN-1'}), /Bargeld/);
  assert.deepEqual(s, before);
});

check('Geringe Schulden: Zins 1 Prozent und Tilgung 5 Prozent centgenau', () => {
  const s = make(); s.companies[0].cashCent = 0; s.companies[0].debtCent = 101;
  const end = close(s), f = end.companies[0];
  assert.equal(f.obligations.find(o => o.kind === 'ZINS').dueCent, 1);
  assert.equal(f.obligations.find(o => o.kind === 'TILGUNG').dueCent, 5);
  assert.equal(f.debtCent, 101);
  assert.equal(f.cashCent, 0);
});

check('Hohe Schuld: Zins und Tilgung ohne IEEE-754-Zwischenrundung', () => {
  const debt = 9007199254740349;
  const s = make(); s.companies[0].cashCent = 0; s.companies[0].debtCent = debt;
  const end = close(s), f = end.companies[0];
  const due = kind => f.obligations.find(o => o.kind === kind).dueCent;
  assert.equal(due('ZINS'), Number((BigInt(debt) * 100n + 5000n) / 10000n));
  assert.equal(due('TILGUNG'), Number((BigInt(debt) * 500n + 5000n) / 10000n));
  assert.equal(due('ZINS'), 90071992547403);
  assert.equal(f.debtCent, debt);
  assert.equal(end.lastReport.companies[0].debtCent, debt);
  E.validate(end);
});

check('Maximaler sicherer Kontostand bleibt bei Abbuchungen gültig', () => {
  const s = make(); s.companies[0].cashCent = MAX;
  const end = act(s, 'SURVEY', 'H1', {claimId: 'BERLIN-1'});
  assert.equal(end.companies[0].cashCent, MAX - E.REGIONS[0].survey);
  assert.ok(Number.isSafeInteger(end.companies[0].cashCent));
  E.validate(end);
});

check('Einnahme oberhalb MAX_SAFE_INTEGER sperrt ganzen Monatsabschluss', () => {
  let s = make(); s.companies[0].cashCent = MAX;
  const p = s.refinery.plants.H1.BERLIN;
  p.built = true; p.route = true; p.productMilli = 9000;
  E.validate(s);
  s = act(s, 'REFINED_SELL', 'H1', {region: 'BERLIN'});
  s = act(s, 'END_TURN');
  const before = structuredClone(s);
  assert.throws(() => act(s, 'END_TURN', 'H2'), /Buchungsüberlauf/);
  assert.deepEqual(s, before);
});

check('Rettungskredit erzeugt genau gleiche Schuld und Forderung', () => {
  const s = rescueWithInvoices([300000]);
  const c = cmd('RESCUE_LOAN');
  const result = E.transition(s, c);
  const f = result.state.companies[0];
  assert.equal(f.debtCent, E.CFG.credit);
  assert.equal(f.cashCent, E.CFG.credit - 300000);
  assert.equal(f.obligations[0].paidCent, 300000);
  assert.equal(count(f, 'RETTUNGSKREDIT'), 1);
  assert.equal(count(f, 'ZAHLUNG_PERSONAL'), 1);
  assert.equal(result.state.phase, 'REPORT');
  assert.deepEqual(E.transition(result.state, c), {state: result.state, duplicate: true});
});

check('Gleichrangige unbezahlte Rechnungen fair geteilt, zweiter Kredit gesperrt', () => {
  let s = rescueWithInvoices([3000000, 3000000]);
  s = act(s, 'RESCUE_LOAN');
  const f = s.companies[0];
  assert.deepEqual(f.obligations.map(o => o.paidCent), [2000000, 2000000]);
  assert.equal(f.cashCent, 0);
  assert.equal(f.debtCent, E.CFG.credit);
  assert.equal(s.phase, 'RESCUE');
  const original = structuredClone(s);
  assert.throws(() => act(s, 'RESCUE_LOAN'), /verbraucht/);
  assert.deepEqual(s, original);
});

check('Schuldüberlauf bei Kreditaufnahme wird ohne Eingabeveränderung gesperrt', () => {
  const s = rescueWithInvoices([6000000]);
  s.companies[0].debtCent = MAX - E.CFG.credit + 1;
  E.validate(s); const before = structuredClone(s);
  assert.throws(() => act(s, 'RESCUE_LOAN'), /Firmenwert/);
  assert.deepEqual(s, before);
});

assert.equal(passed, 10);
console.log('RESULT WIR-04', passed, 'Geld-, Schuld-, Cent- und Ueberlaufpruefungen bestanden');
