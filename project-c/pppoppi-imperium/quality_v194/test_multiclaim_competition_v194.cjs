'use strict';
// WIR-03 / BAL-01: two genuinely acquired, drilled and pumped fields.
// Same-region competition vs independent regional demand, with no injected oil/cash.
const assert = require('node:assert/strict');
for (const name of ['v07_engine', 'v08_engine', 'v082_engine'])
  require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const CASES = [
  {name: 'shared_berlin_market', fields: ['BERLIN-1', 'BERLIN-2'],
    expectedSold: [60000, 60000]},
  {name: 'independent_markets', fields: ['BERLIN-1', 'BRANDENBURG-1'],
    expectedSold: [100000, 100000]}
];
function company(s, id) {
  const f = s.companies.find(row => row.id === id);
  assert.ok(f, 'missing company ' + id);
  return f;
}
function command(type, id, scenario, suffix, claimId) {
  return {type, companyId: id, requestId: 'MULTICLAIM-' + scenario + '-' +
    id + '-' + suffix, ...(claimId ? {claimId} : {})};
}
function step(s, cmd) {
  const before = copy(s);
  const result = E.transition(s, cmd);
  assert.equal(result.duplicate, false, 'unexpected duplicate ' + cmd.requestId);
  assert.deepEqual(s, before, 'input mutated ' + cmd.requestId);
  assert.equal(E.validate(result.state), true);
  return result.state;
}
function audit(s, tc, initial, stage) {
  let soldTotal = 0, remainingTotal = 0, ledgerSales = 0;
  for (let i = 0; i < 2; i++) {
    const id = 'H' + (i + 1);
    const claim = s.claims[tc.fields[i]];
    const f = company(s, id);
    const sold = tc.expectedSold[i];
    assert.equal(claim.owner, id, stage + ': foreign ownership ' + id);
    assert.equal(initial[i].reserveMilli - claim.reserveMilli,
      E.CFG.pumpMilli, stage + ': wrong production ' + id);
    assert.equal(claim.inventoryMilli, E.CFG.pumpMilli - sold,
      stage + ': wrong retained stock ' + id);
    assert.equal(claim.preparedMilli, 0, stage + ': unprocessed offer ' + id);
    assert.equal(claim.order, false, stage + ': active order ' + id);
    assert.equal(f.monthProducedMilli, E.CFG.pumpMilli,
      stage + ': production counter ' + id);
    assert.equal(f.monthSoldMilli, sold, stage + ': sale counter ' + id);
    const sales = f.ledger.filter(x => x.code === 'MARKTERLÖS');
    assert.equal(sales.length, 1, stage + ': duplicate or missing sale ' + id);
    const price = s.prices[claim.region];
    const expectedRevenue = Math.floor((sold * price + 500) / 1000);
    assert.equal(sales[0].deltaCent, expectedRevenue,
      stage + ': wrong market revenue ' + id);
    assert.equal(f.cashCent - initial[i].cashCent,
      f.ledger.reduce((n, x) => n + x.deltaCent, 0),
      stage + ': cash/ledger mismatch ' + id);
    soldTotal += sold;
    remainingTotal += claim.inventoryMilli;
    ledgerSales += sales[0].deltaCent;
  }
  assert.equal(soldTotal + remainingTotal, 2 * E.CFG.pumpMilli,
    stage + ': cross-company oil conservation failed');
  assert.equal(Object.values(s.claims).filter(c => c.owner).length, 2,
    stage + ': unexpected third owned field');
  return {soldTotal, remainingTotal, ledgerSales};
}
function play(tc) {
  let s = E.fresh({humans: 2, ais: 0, seed: 'MULTICLAIM-' + tc.name});
  const initial = tc.fields.map((claimId, i) => ({
    reserveMilli: s.claims[claimId].reserveMilli,
    cashCent: company(s, 'H' + (i + 1)).cashCent
  }));
  let rejectedForeignActions = 0;
  for (let i = 0; i < 2; i++) {
    const id = 'H' + (i + 1), other = tc.fields[1 - i], claimId = tc.fields[i];
    const unchanged = copy(s);
    assert.throws(() => E.transition(s,
      command('PUMP', id, tc.name, 'FOREIGN-PUMP', other)),
      /Claim gehört nicht zum Unternehmen/);
    assert.deepEqual(s, unchanged, 'foreign action changed original');
    rejectedForeignActions++;
    for (const type of ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP', 'OFFER'])
      s = step(s, command(type, id, tc.name, type, claimId));
    assert.equal(s.claims[claimId].preparedMilli, E.CFG.pumpMilli,
      'shipment preparation lost produced oil');
    assert.equal(company(s, id).daysUsed, 14, 'unexpected action-day budget');
    s = step(s, command('END_TURN', id, tc.name, 'END-M1'));
  }
  assert.equal(s.phase, 'REPORT');
  assert.equal(s.reports.length, 1);
  assert.equal(s.lastReport.month, 1);
  const result = audit(s, tc, initial, 'month-one');
  // These corruptions remain structurally valid; only independent checks
  // catch them. No altered fixture is ever persisted or fed to the engine.
  const inflated = copy(s);
  inflated.claims[tc.fields[0]].inventoryMilli += 1000;
  assert.equal(E.validate(inflated), true);
  assert.throws(() => audit(inflated, tc, initial, 'inflated'),
    /wrong retained stock/);
  const shifted = copy(s);
  if (tc.expectedSold[0] < E.CFG.pumpMilli) {
    shifted.claims[tc.fields[0]].inventoryMilli -= 1000;
    shifted.claims[tc.fields[1]].inventoryMilli += 1000;
    assert.equal(E.validate(shifted), true);
    assert.throws(() => audit(shifted, tc, initial, 'shifted'),
      /wrong retained stock/);
  } else {
    shifted.companies[0].monthSoldMilli += 1000;
    assert.equal(E.validate(shifted), true);
    assert.throws(() => audit(shifted, tc, initial, 'counter'),
      /sale counter/);
  }
  const badLedger = copy(s);
  badLedger.companies[0].ledger.find(x => x.code === 'MARKTERLÖS').deltaCent++;
  assert.equal(E.validate(badLedger), true);
  assert.throws(() => audit(badLedger, tc, initial, 'ledger'),
    /wrong market revenue/);
  s = copy(s);
  assert.equal(E.validate(s), true, 'report JSON roundtrip invalid');
  s = step(s, command('NEXT_MONTH', 'H1', tc.name, 'NEXT-M2'));
  assert.equal(s.month, 2);
  assert.equal(s.phase, 'TURN');
  for (let i = 0; i < 2; i++) {
    const id = 'H' + (i + 1);
    assert.equal(company(s, id).monthSoldMilli, 0, 'monthly counter not reset');
    assert.equal(s.claims[tc.fields[i]].inventoryMilli,
      E.CFG.pumpMilli - tc.expectedSold[i], 'stock lost on month change');
    assert.equal(company(s, id).ledger.filter(x => x.code === 'MARKTERLÖS').length,
      1, 'sale duplicated on month change');
  }
  s = copy(s);
  assert.equal(E.validate(s), true, 'next-month JSON roundtrip invalid');
  return {scenario: tc.name, fields: tc.fields, soldMilli: result.soldTotal,
    remainingMilli: result.remainingTotal, revenueCent: result.ledgerSales,
    rejectedForeignActions, negativeChecks: 3, jsonRoundtrips: 2,
    companyMonthChecks: 2};
}
const rows = CASES.map(tc => {
  const first = play(tc);
  assert.deepEqual(play(tc), first, 'non-deterministic ' + tc.name);
  return first;
});
console.log(JSON.stringify({
  schema: 'pppoppi.multiclaim-competition/1',
  scenarios: 2, repeatedRuns: 2, simulatedMonths: 4,
  companyMonthChecks: 8, foreignActionRejections: 8,
  deliberateCorruptionsCaught: 12, jsonRoundtrips: 8,
  noInjectedCashOrInventory: true, rows,
  limitations: [
    'Two firms and two genuinely produced fields; only one completed market month.',
    'Shared Berlin demand versus independent Berlin/Brandenburg demand is tested.',
    'No refinery, public freight, long-term asset valuation or historical C64 claim.',
    'No browser, zoom, rights or release approval is implied.'
  ],
  prereleaseGate: 'BLOCKED'
}, null, 2));
