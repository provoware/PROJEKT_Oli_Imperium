'use strict';
// BAL-01 / WIR-04: real AI-acquired oilfields, synthetic debt shock, real engine restart.
// No production file, historical reference or user save is changed.
const assert = require('node:assert/strict');
for (const file of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + file + '.js');
const E = globalThis.OliV082;
const clone = value => JSON.parse(JSON.stringify(value));
function firm(state, id) {
  const found = state.companies.find(item => item.id === id);
  assert.ok(found, 'missing company ' + id);
  return found;
}
function owned(state, id) {
  return Object.values(state.claims).filter(claim => claim.owner === id)
    .map(claim => claim.id).sort();
}
function transition(state, type, requestId, companyId = 'H1') {
  const before = clone(state);
  const result = E.transition(state, {type, companyId, requestId});
  assert.equal(result.duplicate, false, 'unexpected duplicate ' + requestId);
  assert.deepEqual(state, before, 'input mutated by ' + requestId);
  assert.equal(E.validate(result.state), true, 'invalid state after ' + requestId);
  return result.state;
}
function run() {
  let state = E.fresh({humans: 1, ais: 2, seed: 'BAL01-AI-OWNED-CLAIMS-20261030'});
  const untouched = E.fresh({humans: 1, ais: 2, seed: 'BAL01-AI-OWNED-CLAIMS-20261030'});
  let acquisitionMonth = null;
  let handledHumanRescues = 0;
  for (let month = 1; month <= 18; month++) {
    assert.equal(state.phase, 'TURN');
    assert.equal(state.month, month);
    state = transition(state, 'END_TURN', 'BAL01-ASSET-SETTLE-' + month);
    while (state.phase === 'RESCUE') {
      assert.ok(++handledHumanRescues <= 18, 'human rescue loop');
      assert.deepEqual(state.rescueIds, ['H1'], 'unexpected human rescue queue');
      state = transition(state, 'RESTART',
        'BAL01-ASSET-HUMAN-RESTART-' + month, 'H1');
    }
    assert.equal(state.phase, 'REPORT');
    assert.equal(state.reports.length, month);
    if (owned(state, 'A1').length) {
      acquisitionMonth = month;
      state = transition(state, 'NEXT_MONTH',
        'BAL01-ASSET-AFTER-ACQUISITION-' + month);
      break;
    }
    state = transition(state, 'NEXT_MONTH', 'BAL01-ASSET-NEXT-' + month);
  }
  assert.ok(acquisitionMonth !== null, 'AI A1 never acquired a field in 18 natural months');
  const acquired = owned(state, 'A1');
  const otherOwned = owned(state, 'A2');
  const a1Before = firm(state, 'A1');
  const beforeGeneration = a1Before.generation;
  const beforeRescues = a1Before.stats.rescues;
  const beforeRestartEvents = state.events.filter(e =>
    e.type === 'SANIERUNGSNEUSTART' && e.company === 'A1').length;
  const beforeReportCount = state.reports.length;
  assert.ok(acquired.length > 0, 'AI must own a field before the crisis');
  assert.equal(E.validate(state), true);
  // Only the debt and cash of A1 are injected; the field ownership is genuinely earned.
  a1Before.cashCent = 0;
  a1Before.debtCent = 100000000;
  assert.equal(E.validate(state), true, 'synthetic crisis state invalid');
  const input = clone(state);
  const crisisId = 'BAL01-ASSET-CRISIS-' + state.month;
  let crisis = transition(state, 'END_TURN', crisisId);
  assert.equal(crisis.reports.length, beforeReportCount + 1);
  assert.equal(firm(crisis, 'A1').generation, beforeGeneration + 1,
    'insolvent AI did not restart');
  assert.equal(firm(crisis, 'A1').stats.rescues, beforeRescues + 1);
  assert.equal(firm(crisis, 'A1').debtCent, 0);
  assert.equal(E.pending(firm(crisis, 'A1')), 0);
  assert.deepEqual(owned(crisis, 'A1'), [], 'insolvent AI retained its fields');
  for (const id of acquired) {
    assert.deepEqual(crisis.claims[id], untouched.claims[id],
      'released claim was not fully reset: ' + id);
  }
  for (const id of otherOwned) {
    assert.equal(crisis.claims[id].owner, 'A2',
      'unrelated AI lost its pre-existing field: ' + id);
  }
  assert.equal(crisis.events.filter(e =>
    e.type === 'SANIERUNGSNEUSTART' && e.company === 'A1').length,
  beforeRestartEvents + 1, 'restart event must occur exactly once');
  assert.deepEqual(state, input, 'synthetic source state was modified');
  const duplicate = E.transition(crisis, {
    type: 'END_TURN', companyId: 'H1', requestId: crisisId
  });
  assert.equal(duplicate.duplicate, true, 'duplicate crisis request accepted');
  assert.deepEqual(duplicate.state, crisis, 'duplicate crisis changed game');
  while (crisis.phase === 'RESCUE') {
    assert.deepEqual(crisis.rescueIds, ['H1']);
    crisis = transition(crisis, 'RESTART',
      'BAL01-ASSET-FINAL-HUMAN-RESTART', 'H1');
  }
  assert.equal(crisis.phase, 'REPORT');
  const restored = clone(crisis);
  assert.equal(E.validate(restored), true);
  assert.deepEqual(restored, crisis, 'JSON roundtrip changed released fields');
  const next = transition(restored, 'NEXT_MONTH', 'BAL01-ASSET-POST-CRISIS');
  assert.equal(next.phase, 'TURN');
  assert.equal(next.reports.length, beforeReportCount + 1);
  assert.equal(firm(next, 'A1').generation, beforeGeneration + 1);
  assert.deepEqual(owned(next, 'A1'), []);
  for (const id of acquired) {
    assert.equal(next.claims[id].owner, null, 'released field reappeared');
  }
  return {
    acquisitionMonth, crisisMonth: input.month, naturallyAcquiredClaimIds: acquired,
    releasedClaimCount: acquired.length, unaffectedA2ClaimCount: otherOwned.length,
    a1GenerationBefore: beforeGeneration, a1GenerationAfter: beforeGeneration + 1,
    handledHumanRescues, duplicateRejected: true,
    jsonRoundtrip: true, nextMonthValid: true
  };
}
const first = run();
assert.deepEqual(run(), first, 'asset-bearing AI insolvency is not reproducible');
console.log(JSON.stringify({
  schema: 'pppoppi.ai-owned-claim-insolvency/1',
  engine: 'unchanged V1.9.3 core / V1.9.4 test fixture',
  repeatedRuns: 2, result: first,
  limitations: [
    'Field acquisition occurs through real AI turns; cash and debt crisis is injected.',
    'Released claims are not assigned a monetary value; this is not an asset valuation.',
    'Natural debt accumulation, historical C64 equivalence and release approval remain open.'
  ],
  prereleaseGate: 'BLOCKED'
}, null, 2));
