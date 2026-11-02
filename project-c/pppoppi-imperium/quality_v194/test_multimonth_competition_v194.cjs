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
// Independent cross-company accounting oracle. Corrupted copies are never fed to the engine.
function auditIndependent(s, initial, cumulativeSold, cumulativeRevenue, saleMonths, month) {
  const report = s.lastReport;
  assert.equal(report.month, month, 'audit: wrong report month');
  const demand = report.regions.BERLIN.demandMilli;
  assert.ok(Number.isSafeInteger(demand) && demand >= 0,
    'audit: invalid market demand');
  let soldTotal = 0, offeredTotal = 0;
  for (let i = 0; i < 2; i++) {
    const id = 'H' + (i + 1), claimId = CLAIMS[i];
    const claim = s.claims[claimId], firm = company(s, id);
    const sold = report.allocations.BERLIN[claimId] || 0;
    const produced = initial[i].reserveMilli - claim.reserveMilli;
    for (const [name, value] of Object.entries({sold, reserve: claim.reserveMilli,
      inventory: claim.inventoryMilli, prepared: claim.preparedMilli}))
      assert.ok(Number.isSafeInteger(value) && value >= 0,
        'audit: invalid quantity ' + id + ' ' + name);
    assert.equal(claim.owner, id, 'audit: wrong field owner');
    assert.equal(produced, cumulativeSold[i] + claim.inventoryMilli + claim.preparedMilli,
      'audit: production inventory mismatch');
    assert.equal(firm.monthSoldMilli, sold, 'audit: sale counter mismatch');
    assert.equal(firm.monthRevenueCent,
      Math.floor((sold * s.prices.BERLIN + 500) / 1000),
      'audit: market revenue mismatch');
    // Cash can reconcile even if a market sale was misclassified or duplicated.
    const saleRows = firm.ledger.filter(row => row.code === 'MARKTERLÖS');
    assert.equal(saleRows.length, saleMonths[i],
      'audit: missing or duplicate market ledger entry');
    assert.equal(saleRows.reduce((sum, row) => sum + row.deltaCent, 0),
      cumulativeRevenue[i], 'audit: cumulative market ledger revenue mismatch');
    assert.equal(firm.cashCent - initial[i].cashCent,
      firm.ledger.reduce((n, row) => n + row.deltaCent, 0),
      'audit: cash ledger mismatch');
    soldTotal += sold;
    offeredTotal += sold + claim.inventoryMilli + claim.preparedMilli;
  }
  assert.equal(soldTotal, Math.min(offeredTotal, demand),
    'audit: market allocation does not match available supply and demand');
}
function negativeAuditProbes(s, initial, cumulativeSold, cumulativeRevenue, saleMonths, month) {
  auditIndependent(s, initial, cumulativeSold, cumulativeRevenue, saleMonths, month);
  let caught = 0;
  for (let i = 0; i < 2; i++) {
    const id = 'H' + (i + 1), claimId = CLAIMS[i];
    const corruptions = [
      state => { state.claims[claimId].inventoryMilli += 1000; },
      state => { company(state, id).ledger[0].deltaCent += 1; },
      state => { company(state, id).cashCent += 1; },
      state => { company(state, id).monthSoldMilli += 1000; },
      state => { company(state, id).monthRevenueCent += 1; },
      state => { state.lastReport.allocations.BERLIN[claimId] =
        (state.lastReport.allocations.BERLIN[claimId] || 0) + 1000; },
      // These keep the total cash ledger unchanged; only sale provenance detects them.
      state => { const sale = company(state, id).ledger.find(row => row.code === 'MARKTERLÖS');
        assert.ok(sale); sale.code = 'UNBEKANNT'; },
      state => { const ledger = company(state, id).ledger;
        const sale = ledger.find(row => row.code === 'MARKTERLÖS');
        assert.ok(sale); ledger.push({...sale, deltaCent: 0}); }
    ];
    for (const mutate of corruptions) {
      const altered = clone(s);
      mutate(altered);
      assert.throws(() => auditIndependent(altered, initial, cumulativeSold, cumulativeRevenue, saleMonths, month),
        /audit:/, 'undetected cross-company corruption ' + id + ' month ' + month);
      caught++;
    }
  }
  // Global market faults are independent of a single firm's ledger.
  const marketCorruptions = [
    state => { state.lastReport.regions.BERLIN.demandMilli = 0; },
    state => { state.lastReport.regions.BERLIN.demandMilli = 0.5; },
    state => { state.lastReport.allocations.BERLIN[CLAIMS[0]] = -1; },
    state => { state.lastReport.allocations.BERLIN[CLAIMS[0]] = 0.5; }
  ];
  for (const mutate of marketCorruptions) {
    const altered = clone(s);
    mutate(altered);
    assert.throws(() => auditIndependent(altered, initial, cumulativeSold, cumulativeRevenue, saleMonths, month),
      /audit:/, 'undetected global market corruption month ' + month);
    caught++;
  }
  return caught;
}
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
  const cumulativeRevenue = [0, 0], saleMonths = [0, 0];
  const reports = [];
  let jsonRoundtrips = 0, duplicateChecks = 0, companyMonthChecks = 0;
  let deliberateCorruptionsCaught = 0, foreignActionRejections = 0;
  for (let month = 1; month <= 3; month++) {
    assert.equal(s.month, month);
    assert.equal(s.phase, 'TURN');
    for (let i = 0; i < 2; i++) {
      const id = 'H' + (i + 1), claimId = CLAIMS[i];
      const types = month === 1
        ? ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP', 'OFFER']
        : (s.claims[claimId].inventoryMilli > 0
          ? ['SHIP', 'OFFER'] : ['PUMP', 'SHIP', 'OFFER']);
      // Foreign claims must remain inaccessible through every production/market action.
      // Only probe when the rival has already acquired its field; no fake ownership.
      const rivalClaim = CLAIMS[1 - i];
      if (s.claims[rivalClaim].owner === 'H' + (2 - i)) {
        for (const foreignType of ['PUMP', 'SHIP', 'OFFER', 'CANCEL']) {
          const forbidden = {type: foreignType, companyId: id,
            claimId: rivalClaim,
            requestId: 'FOREIGN-' + month + '-' + id + '-' + foreignType};
          const untouched = clone(s);
          assert.throws(() => E.transition(s, forbidden),
            /Claim gehört nicht zum Unternehmen/,
            'foreign claim action accepted ' + month + ' ' + id + ' ' + foreignType);
          assert.deepEqual(s, untouched,
            'foreign claim action changed input ' + month + ' ' + id + ' ' + foreignType);
          assert.equal(E.validate(s), true, 'invalid state after rejected foreign action');
          foreignActionRejections++;
        }
      }
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
      cumulativeRevenue[i] += expectedRevenue;
      if (soldByClaim[i] > 0) saleMonths[i]++;
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
    deliberateCorruptionsCaught += negativeAuditProbes(
      s, initial, cumulativeSold, cumulativeRevenue, saleMonths, month);
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
    foreignActionRejections, deliberateCorruptionsCaught,
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
  foreignActionRejections: 40, deliberateCorruptionsCaught: 120,
  noInjectedCashOrInventory: true, result: first,
  limitations: ['Two human firms and two Berlin claims; three completed market months.',
    'No refinery or public freight in this targeted test.',
    '60 independent negative corruption probes per repeated run (both firms and market, three months).',
    'Sale posting count and cumulative market revenue are checked separately from cash balance.',
    '20 foreign-field PUMP/SHIP/OFFER/CANCEL actions rejected per run after rival ownership; 40 in total.',
    'Cash reconciliation is not a profit or asset valuation.',
    'Browser file dialog, historic C64 and personal acceptance remain open.'],
  prereleaseGate: 'BLOCKED'
}, null, 2));
