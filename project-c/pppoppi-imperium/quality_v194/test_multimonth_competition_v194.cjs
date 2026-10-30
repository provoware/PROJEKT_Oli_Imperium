'use strict';
// WIR-03 / BAL-01: genuine three-month, two-company inventory and market audit.
// No injected cash, oil, demand or ownership. Original engine remains untouched.
const assert = require('node:assert/strict');
for (const name of ['v07_engine', 'v08_engine', 'v082_engine'])
  require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const clone = x => JSON.parse(JSON.stringify(x));
const CLAIMS = ['BERLIN-1', 'BERLIN-2'];
const company = (s, id) => {
  const f = s.companies.find(x => x.id === id);
  assert.ok(f, 'missing company ' + id);
  return f;
};
function action(s, type, id, month, claimId) {
  const cmd = {type, companyId: id,
    requestId: 'MULTIMONTH-' + month + '-' + id + '-' + type,
    ...(claimId ? {claimId} : {})};
  const before = clone(s);
  const result = E.transition(s, cmd);
  assert.equal(result.duplicate, false, 'unexpected duplicate ' + cmd.requestId);
  assert.deepEqual(s, before, 'input mutated ' + cmd.requestId);
  assert.equal(E.validate(result.state), true);
  return {state: result.state, cmd};
}
function play() {
  let s = E.fresh({humans: 2, ais: 0, seed: 'MULTIMONTH-SHARED-BERLIN'});
  const initial = CLAIMS.map((claimId, i) => ({
    reserveMilli: s.claims[claimId].reserveMilli,
    cashCent: company(s, 'H' + (i + 1)).cashCent
  }));
  const cumulativeSold = [0, 0];
  const reports = [];
  let jsonRoundtrips = 0, duplicateChecks = 0, companyMonthChecks = 0;
  for (let month = 1; month <= 3; month++) {
    assert.equal(s.month, month);
    assert.equal(s.phase, 'TURN');
    for (let i = 0; i < 2; i++) {
      const id = 'H' + (i + 1), claimId = CLAIMS[i];
      const types = month === 1
        ? ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP', 'OFFER']
        : (s.claims[claimId].inventoryMilli > 0
          ? ['SHIP', 'OFFER'] : ['PUMP', 'SHIP', 'OFFER']);
      for (const type of types) s = action(s, type, id, month, claimId).state;
      const last = action(s, 'END_TURN', id, month);
      s = last.state;
      const duplicate = E.transition(s, last.cmd);
      assert.equal(duplicate.duplicate, true, 'duplicate end turn accepted');
      assert.deepEqual(duplicate.state, s, 'duplicate changed state');
      duplicateChecks++;
    }
    assert.equal(s.phase, 'REPORT', 'month not settled ' + month);
    assert.equal(s.lastReport.month, month);
    const report = s.lastReport;
    const soldByClaim = CLAIMS.map(id => report.allocations.BERLIN[id] || 0);
    const offered = CLAIMS.map((id, i) => {
      const c = s.claims[id];
      return c.inventoryMilli + soldByClaim[i];
    });
    const totalSold = soldByClaim.reduce((n, x) => n + x, 0);
    const totalOffered = offered.reduce((n, x) => n + x, 0);
    const demand = report.regions.BERLIN.demandMilli;
    assert.equal(totalSold, Math.min(totalOffered, demand),
      'market allocation not limited by actual demand in month ' + month);
    assert.ok(Math.abs(soldByClaim[0] - soldByClaim[1]) <= 1,
      'identical offers allocated unequally in month ' + month);
    for (let i = 0; i < 2; i++) {
      const id = 'H' + (i + 1), claimId = CLAIMS[i];
      const c = s.claims[claimId], f = company(s, id);
      cumulativeSold[i] += soldByClaim[i];
      const produced = initial[i].reserveMilli - c.reserveMilli;
      assert.equal(produced, cumulativeSold[i] + c.inventoryMilli + c.preparedMilli,
        'cumulative oil conservation failed ' + id + ' month ' + month);
      assert.equal(c.owner, id, 'claim ownership changed');
      assert.equal(c.preparedMilli, 0, 'unsettled shipment');
      assert.equal(c.order, false, 'unsettled offer');
      assert.equal(f.monthSoldMilli, soldByClaim[i], 'wrong monthly sales counter');
      const expectedRevenue = Math.floor((soldByClaim[i] * s.prices.BERLIN + 500) / 1000);
      assert.equal(f.monthRevenueCent, expectedRevenue, 'wrong monthly revenue');
      assert.equal(f.cashCent - initial[i].cashCent,
        f.ledger.reduce((n, row) => n + row.deltaCent, 0),
        'cash ledger differs from actual cash');
      companyMonthChecks++;
    }
    if (month === 1) {
      assert.deepEqual(soldByClaim, [60000, 60000],
        'known first-month competition baseline changed');
      assert.deepEqual(CLAIMS.map(id => s.claims[id].inventoryMilli), [40000, 40000]);
    }
    const snapshot = clone(s);
    assert.equal(E.validate(snapshot), true, 'report JSON roundtrip invalid');
    assert.deepEqual(snapshot, s);
    s = snapshot;
    jsonRoundtrips++;
    reports.push({month, demandMilli: demand, soldMilli: totalSold,
      remainingMilli: CLAIMS.reduce((n, id) => n + s.claims[id].inventoryMilli, 0),
      cumulativeSoldMilli: cumulativeSold.reduce((n, x) => n + x, 0)});
    if (month < 3) {
      s = action(s, 'NEXT_MONTH', 'H1', month, null).state;
      assert.equal(s.month, month + 1);
      for (let i = 0; i < 2; i++) {
        assert.equal(company(s, 'H' + (i + 1)).monthSoldMilli, 0,
          'sale counter not reset');
      }
      s = clone(s);
      assert.equal(E.validate(s), true, 'next-month JSON roundtrip invalid');
      jsonRoundtrips++;
    }
  }
  return {reports, companyMonthChecks, duplicateChecks, jsonRoundtrips,
    cumulativeSoldMilli: cumulativeSold.reduce((n, x) => n + x, 0),
    producedMilli: CLAIMS.reduce((n, id, i) =>
      n + initial[i].reserveMilli - s.claims[id].reserveMilli, 0),
    remainingMilli: CLAIMS.reduce((n, id) => n + s.claims[id].inventoryMilli, 0)};
}
const first = play();
assert.deepEqual(play(), first, 'non-deterministic repeated three-month competition');
assert.equal(first.producedMilli, first.cumulativeSoldMilli + first.remainingMilli);
console.log(JSON.stringify({
  schema: 'pppoppi.multimonth-competition/1', scenarios: 1,
  repeatedRuns: 2, simulatedMonths: 6, companyMonthChecks: 12,
  duplicateChecks: 12, jsonRoundtrips: 10,
  noInjectedCashOrInventory: true, result: first,
  limitations: ['Two human firms and two Berlin claims; three completed market months.',
    'No refinery or public freight in this targeted test.',
    'Cash reconciliation is not a profit or asset valuation.',
    'Browser file dialog, historic C64 and personal acceptance remain open.'],
  prereleaseGate: 'BLOCKED'
}, null, 2));
