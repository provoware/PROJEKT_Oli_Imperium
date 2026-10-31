'use strict';
// WIR-04/BAL-01: independent physical stock audit across a real periodic fire.
// No unapproved depreciation, write-down, or stock-loss rule is inferred.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine']) {
  require('../SPIEL/src/' + name + '.js');
}
const E = globalThis.OliV082;
const CLAIM = 'BERLIN-1';
const copy = value => JSON.parse(JSON.stringify(value));
let sequence = 0;
function move(state, type, companyId = 'H1', extra = {}) {
  const before = copy(state);
  const result = E.transition(state, {
    type, companyId, requestId: 'FIRE-STOCK-' + (++sequence), ...extra
  });
  assert.equal(result.duplicate, false);
  assert.deepEqual(state, before, 'engine mutated input');
  assert.equal(E.validate(result.state), true);
  return result.state;
}
function audit(state, opening, expectedProduced, expectedSold, expectedStock) {
  const claim = state.claims[CLAIM];
  const firm = state.companies.find(x => x.id === 'H1');
  assert.equal(claim.owner, 'H1', 'wrong claim owner');
  const ids = firm.ledger.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate booking ID');
  const ledgerDelta = firm.ledger.reduce((n, x) => {
    assert.ok(Number.isSafeInteger(x.deltaCent), 'unsafe booking');
    return n + x.deltaCent;
  }, 0);
  assert.ok(Number.isSafeInteger(ledgerDelta), 'unsafe ledger sum');
  assert.equal(firm.cashCent, opening.cashCent + ledgerDelta,
    'cash/ledger mismatch');
  let sold = 0;
  for (const report of state.reports) {
    const allocations = report.allocations.BERLIN;
    const regionTotal = Object.values(allocations).reduce((n, x) => n + x, 0);
    assert.equal(regionTotal, report.regions.BERLIN.soldMilli,
      'report region mismatch');
    sold += allocations[CLAIM] || 0;
  }
  assert.equal(sold, expectedSold, 'sale total mismatch');
  assert.equal(opening.reserveMilli - claim.reserveMilli, expectedProduced,
    'production mismatch');
  assert.equal(claim.inventoryMilli + claim.preparedMilli, expectedStock,
    'stock mismatch');
  assert.equal(expectedProduced, sold + claim.inventoryMilli + claim.preparedMilli,
    'physical conservation mismatch');
  assert.equal(E.validate(state), true);
}
function scenario() {
  let state = E.fresh({humans: 2, ais: 0, seed: 'FIRE-STOCK-20261031'});
  const opening = {
    cashCent: state.companies[0].cashCent,
    reserveMilli: state.claims[CLAIM].reserveMilli
  };
  for (let month = 1; month <= 3; month++) {
    const actions = month === 1
      ? ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP', 'OFFER']
      : month === 2 ? ['PUMP', 'SHIP', 'OFFER'] : ['PUMP'];
    for (const type of actions) {
      state = move(state, type, 'H1', {claimId: CLAIM});
    }
    state = move(state, 'END_TURN', 'H1');
    state = move(state, 'END_TURN', 'H2');
    assert.equal(state.phase, 'REPORT', 'month not settled');
    if (month < 3) state = move(state, 'NEXT_MONTH');
  }
  const pumped = E.CFG.pumpMilli * 3;
  const soldBeforeFire = E.CFG.pumpMilli * 2;
  const stockBeforeFire = E.CFG.pumpMilli;
  audit(state, opening, pumped, soldBeforeFire, stockBeforeFire);
  const beforeFire = copy(state.claims[CLAIM]);
  state = move(state, 'NEXT_MONTH');
  assert.equal(state.month, 4);
  assert.equal(state.phase, 'TURN');
  assert.equal(state.claims[CLAIM].burning, true, 'periodic fire missing');
  assert.ok(state.events.some(e => e.type === 'BRAND' &&
    e.month === 4 && e.claimId === CLAIM), 'fire event missing');
  for (const key of ['reserveMilli', 'inventoryMilli', 'preparedMilli']) {
    assert.equal(state.claims[CLAIM][key], beforeFire[key],
      'unapproved stock write-down at fire: ' + key);
  }
  audit(state, opening, pumped, soldBeforeFire, stockBeforeFire);
  const blocked = copy(state);
  assert.throws(() => move(state, 'PUMP', 'H1', {claimId: CLAIM}),
    /Förderung gesperrt/);
  assert.deepEqual(state, blocked, 'rejected pumping changed input');
  const cashBeforeExtinguish = state.companies[0].cashCent;
  state = move(state, 'FIRE_EXPERT', 'H1', {claimId: CLAIM});
  assert.equal(state.claims[CLAIM].burning, false);
  assert.equal(state.claims[CLAIM].damaged, false);
  assert.equal(state.companies[0].cashCent,
    cashBeforeExtinguish - E.COST.fireExpertCost, 'fire service cost mismatch');
  assert.equal(state.companies[0].ledger.filter(x =>
    x.code === 'BRANDBEKÄMPFUNG_PROFI').length, 1,
    'fire service booking count mismatch');
  audit(state, opening, pumped, soldBeforeFire, stockBeforeFire);
  const restored = copy(state);
  assert.deepEqual(restored, state, 'JSON restore changed state');
  audit(restored, opening, pumped, soldBeforeFire, stockBeforeFire);
  const cases = [
    ['cash/ledger mismatch', s => {s.companies[0].cashCent++;}],
    ['cash/ledger mismatch', s => {s.companies[0].ledger[0].deltaCent++;}],
    ['production mismatch', s => {s.claims[CLAIM].reserveMilli++;}],
    ['stock mismatch', s => {s.claims[CLAIM].inventoryMilli++;}],
    ['report region mismatch', s => {
      s.reports[0].allocations.BERLIN[CLAIM]++;
    }],
    ['duplicate booking ID', s => {
      s.companies[0].ledger.push(copy(s.companies[0].ledger[0]));
    }]
  ];
  for (const [message, corrupt] of cases) {
    const bad = copy(state);
    corrupt(bad);
    assert.throws(() => audit(bad, opening, pumped, soldBeforeFire,
      stockBeforeFire), new RegExp(message.replace('/', '\\/')));
  }
  state = move(state, 'SHIP', 'H1', {claimId: CLAIM});
  state = move(state, 'OFFER', 'H1', {claimId: CLAIM});
  state = move(state, 'END_TURN', 'H1');
  state = move(state, 'END_TURN', 'H2');
  assert.equal(state.phase, 'REPORT');
  audit(state, opening, pumped, pumped, 0);
  return {
    months: 4, fireEvents: 1, expertExtinguishments: 1,
    blockedPumps: 1, jsonRestores: 1, negativeCases: cases.length,
    producedMilli: pumped, soldMilli: pumped, remainingStockMilli: 0,
    observedStockLossAtFireMilli: 0,
    valuationStatus: 'UNPRICED', fireLossRuleStatus: 'NOT_DEFINED',
    profitStatus: 'NOT_COMPUTABLE'
  };
}
const first = scenario();
const second = scenario();
assert.deepEqual(first, second, 'non-reproducible fire scenario');
console.log(JSON.stringify({
  schema: 'pppoppi.fire-raw-stock/1', scenarios: 2,
  ...first, months: first.months + second.months,
  negativeCases: first.negativeCases + second.negativeCases,
  prereleaseGate: 'BLOCKED',
  limitations: [
    'The current engine sets burning=true but does not reduce raw stock.',
    'This is an observation, not proof that fire cannot damage raw oil.',
    'Fire write-down, inventory unit cost and residual values lack approved rules.',
    'No accounting profit, net worth or C64 historical equivalence is asserted.'
  ]
}, null, 2));
