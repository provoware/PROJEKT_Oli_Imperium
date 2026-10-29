'use strict';
// BAL-01: investment eligibility diagnostics, without changing protected game sources.
// These are first-turn counterfactuals, NOT full campaigns or historical C64 evidence.
const assert = require('node:assert/strict');
require('./test_ai_strategy_metrics_v194.cjs');
const E = globalThis.OliV082;
const AI = globalThis.PPStrategicAI;
const IDS = ['A1', 'A2', 'A3'];
const SHOCKS = [
  { name: 'normal', priceFactor: 1 },
  { name: 'low_price', priceFactor: 0.52 }
];
const CASH_SHIFTS = [0, 5000000, 15000000]; // cents: 0, 50k, 150k EUR
const clone = value => JSON.parse(JSON.stringify(value));

function diagnose(state, id) {
  const firm = state.companies.find(x => x.id === id);
  assert.ok(firm && firm.type === 'ai', 'AI company missing');
  assert.equal(state.phase, 'TURN');
  const profile = AI.profile(id);
  const buffer = AI.config[profile].buffer;
  const owned = Object.values(state.claims).filter(c => c.owner === id);
  const unresolved = owned.filter(c => !c.drilled).length;
  const drilled = owned.filter(c => c.drilled && !c.burning && !c.damaged).length;
  const daysLeft = E.CFG.monthDays - firm.daysUsed;
  const reasons = {
    insufficientPayback: 0, unresolvedOwnedField: 0,
    threeProducingFields: 0, insufficientCash: 0, insufficientDays: 0
  };
  const eligible = [], free = [];
  for (const c of Object.values(state.claims)) {
    if (c.owner !== null) continue;
    const region = E.REGIONS.find(r => r.id === c.region);
    assert.ok(region, 'unknown region');
    const price = state.prices[c.region];
    const demand = Math.max(1, state.demand[c.region]);
    const offered = Object.values(state.claims).filter(v => v.region === c.region && v.order)
      .reduce((sum, v) => sum + v.preparedMilli, 0);
    const pressure = Math.max(0.25, Math.min(1, (demand - offered) / Math.max(1000, demand)));
    const revenue = E.CFG.pumpMilli * price / 1000 * pressure;
    const margin = revenue - E.CFG.pumpCost - E.CFG.shippingCost +
      (c.pipeline ? E.COST.pipeRefund : 0);
    const payback = Math.max(0, margin) *
      Math.max(1, Math.floor(c.reserveMilli / E.CFG.pumpMilli));
    const investment = region.buy + region.drill + region.survey;
    const surveyed = c.surveyedBy.includes(id);
    const type = surveyed ? 'BUY' : 'SURVEY';
    const cost = surveyed ? region.buy : region.survey;
    const days = surveyed ? 1 : 2;
    const failures = [];
    if (!(payback > investment * 1.15)) failures.push('insufficientPayback');
    if (unresolved !== 0) failures.push('unresolvedOwnedField');
    if (drilled >= 3) failures.push('threeProducingFields');
    if (firm.cashCent < cost + buffer) failures.push('insufficientCash');
    if (daysLeft < days) failures.push('insufficientDays');
    for (const reason of failures) reasons[reason]++;
    if (failures.length === 0) eligible.push(c.id + ':' + type);
    free.push({
      claimId: c.id, type, paybackCent: Math.round(payback),
      investmentCent: investment, failures
    });
  }
  const before = JSON.stringify(state);
  const ranked = AI.rank(state, id);
  assert.equal(JSON.stringify(state), before, 'AI rank changed the input state');
  const actual = ranked.filter(p => ['SURVEY', 'BUY'].includes(p.cmd.type))
    .map(p => p.cmd.claimId + ':' + p.cmd.type).sort();
  assert.deepEqual(actual, eligible.sort(), 'AI investment proposals diverge from independent gate calculation');
  assert.equal(new Set(actual).size, actual.length, 'duplicate investment proposals');
  return {
    companyId: id, profile, cashCent: firm.cashCent, bufferCent: buffer,
    unresolvedOwnedFields: unresolved, producingFields: drilled,
    freeClaims: free.length, eligibleInvestments: actual.length,
    rejectedByGate: reasons,
    proposals: actual,
    topPaybackCandidates: free.sort((a, b) => b.paybackCent - a.paybackCent)
      .slice(0, 3)
  };
}

function execute() {
  assert.ok(E && AI && AI.ready(), 'game modules unavailable');
  const rows = [];
  for (const shock of SHOCKS) {
    const baseline = E.fresh({ humans: 1, ais: 3, seed: 'BAL01-GATES-' + shock.name });
    if (shock.priceFactor !== 1) {
      for (const region of E.REGIONS) {
        baseline.prices[region.id] = Math.floor(baseline.prices[region.id] * shock.priceFactor);
      }
    }
    E.validate(baseline);
    const unchanged = JSON.stringify(baseline);
    for (const cashShiftCent of CASH_SHIFTS) {
      for (const id of IDS) {
        const state = clone(baseline);
        const firm = state.companies.find(x => x.id === id);
        firm.cashCent += cashShiftCent;
        assert.ok(Number.isSafeInteger(firm.cashCent), 'cash counterfactual overflow');
        E.validate(state);
        const first = diagnose(state, id);
        const second = diagnose(state, id);
        assert.deepEqual(second, first, 'first-turn gate diagnostic not reproducible');
        rows.push({ scenario: shock.name, cashShiftCent, ...first });
      }
    }
    assert.equal(JSON.stringify(baseline), unchanged, 'baseline modified by diagnostic');
  }
  assert.equal(rows.length, 18, 'two markets x three capital levels x three firms');
  assert.equal(rows.filter(x => x.companyId === 'A3').length, 6);
  return {
    schema: 'pppoppi.ai-investment-gates/1',
    scope: 'First-turn strategic SURVEY/BUY gates; original source unchanged',
    rows,
    caveats: [
      'Capital increases exist only in cloned test states and are not real earnings or game actions.',
      'Proposals are eligibility candidates, not guaranteed executed or profitable actions.',
      'Two market starts only; no 36-month counterfactual, independent seed diversity or asset valuation.',
      'No historical C64 equivalence, resource rights clearance or prerelease authorization.'
    ],
    prereleaseGate: 'BLOCKED'
  };
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { execute, diagnose };
