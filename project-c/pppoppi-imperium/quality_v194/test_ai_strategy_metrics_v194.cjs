'use strict';
// BAL-01: quantitative, reproducible baseline using the unchanged V1.9.3 engine.
// This is NOT a historical C64 comparison, an asset valuation or a causal AI A/B test.
const assert = require('node:assert/strict');
for (const file of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + file + '.js');
const E = globalThis.OliV082;
const A = globalThis.PPStrategicAI;
const IDS = ['A1', 'A2', 'A3'];
const SEEDS = ['alpha', 'beta', 'gamma'];
const SCENARIOS = [
  { name: 'passive_normal', human: 'passive', shock: null },
  { name: 'active_normal', human: 'active', shock: null },
  { name: 'active_low_demand', human: 'active', shock: 'demand' },
  { name: 'active_low_price', human: 'active', shock: 'price' }
];
const MONTHS = 36;

function net(firm) {
  assert.ok(Number.isSafeInteger(firm.cashCent) && firm.cashCent >= 0, 'cash');
  assert.ok(Number.isSafeInteger(firm.debtCent) && firm.debtCent >= 0, 'debt');
  const value = firm.cashCent - firm.debtCent;
  assert.ok(Number.isSafeInteger(value), 'net liquidity overflow');
  return value;
}
function snapshot(state, id) {
  const firm = state.companies.find(f => f.id === id);
  assert.ok(firm && firm.type === 'ai', 'AI company missing');
  const fields = Object.values(state.claims).filter(c => c.owner === id).length;
  assert.ok(Number.isSafeInteger(fields) && fields >= 0, 'field count');
  assert.ok(Number.isSafeInteger(firm.stats.rescues) && firm.stats.rescues >= 0, 'rescue count');
  return {
    cashCent: firm.cashCent, debtCent: firm.debtCent,
    netCent: net(firm), fields, rescues: firm.stats.rescues
  };
}
function summarize(history, profile, decisionCount, logisticsCount) {
  assert.equal(history.length, MONTHS + 1, 'initial + 36 monthly snapshots');
  const buffer = A.config[profile].buffer;
  let peak = history[0].netCent, maxDrawdown = 0;
  for (const entry of history) {
    assert.ok(Number.isSafeInteger(entry.netCent), 'invalid net value');
    peak = Math.max(peak, entry.netCent);
    maxDrawdown = Math.max(maxDrawdown, peak - entry.netCent);
  }
  const start = history[0], end = history.at(-1);
  return {
    profile, startNetCent: start.netCent,
    finalNetCent: end.netCent,
    liquidNetChangeCent: end.netCent - start.netCent,
    finalCashCent: end.cashCent, finalDebtCent: end.debtCent,
    minimumCashCent: Math.min(...history.map(x => x.cashCent)),
    maximumDebtCent: Math.max(...history.map(x => x.debtCent)),
    maximumNetDrawdownCent: maxDrawdown,
    monthsBelowProfileBuffer: history.slice(1).filter(x => x.cashCent < buffer).length,
    finalFields: end.fields, rescueCount: end.rescues - start.rescues,
    strategicDecisions: decisionCount, logisticsDecisions: logisticsCount
  };
}
function run(seed, scenario) {
  let serial = 0, acceptedHumanActions = 0, rejectedHumanActions = 0;
  function act(state, type, companyId = 'H1', extra = {}) {
    return E.transition(state, {
      type, companyId, requestId: 'BAL01-' + (++serial), ...extra
    }).state;
  }
  let state = E.fresh({ humans: 1, ais: 3, seed: 'BAL01-' + seed + '-' + scenario.name });
  if (scenario.shock === 'demand') {
    for (const r of E.REGIONS) state.demand[r.id] = Math.floor(state.demand[r.id] * 0.45);
  }
  if (scenario.shock === 'price') {
    for (const r of E.REGIONS) state.prices[r.id] = Math.floor(state.prices[r.id] * 0.52);
  }
  E.validate(state);
  const histories = Object.fromEntries(IDS.map(id => [id, [snapshot(state, id)]]));
  for (let month = 1; month <= MONTHS; month++) {
    assert.equal(state.phase, 'TURN', 'start phase month ' + month);
    if (scenario.human === 'active') {
      let count = 0;
      for (const c of Object.values(state.claims).sort((a, b) => a.id.localeCompare(b.id))) {
        if (count > 4) break;
        const commands = c.owner === 'H1'
          ? (!c.drilled ? ['DRILL'] : c.inventoryMilli > 0 ? ['SHIP', 'OFFER'] : ['PUMP'])
          : c.owner === null ? ['SURVEY', 'BUY'] : [];
        for (const type of commands) {
          try {
            state = act(state, type, 'H1', { claimId: c.id });
            count++; acceptedHumanActions++;
          } catch (_) {
            rejectedHumanActions++;
          }
        }
        if (state.companies[0].daysUsed >= E.CFG.monthDays - 4) break;
      }
    }
    state = act(state, 'END_TURN');
    let rescueAttempts = 0;
    while (state.phase === 'RESCUE') {
      assert.ok(++rescueAttempts <= 12, 'rescue loop');
      const id = state.rescueIds[0];
      assert.ok(id, 'rescue company missing');
      const firm = state.companies.find(f => f.id === id);
      try {
        state = act(state, firm.loanUsed ? 'RESTART' : 'RESCUE_LOAN', id);
      } catch (_) {
        state = act(state, 'RESTART', id);
      }
    }
    assert.equal(state.phase, 'REPORT', 'report phase month ' + month);
    E.validate(state);
    for (const id of IDS) histories[id].push(snapshot(state, id));
    state = act(state, 'NEXT_MONTH');
    E.validate(state);
  }
  const decisions = state.events.filter(e => e.type === 'KI_ENTSCHEIDUNG');
  const logistics = state.events.filter(e => e.type === 'KI_LOGISTIK');
  const firms = IDS.map(id => ({
    id,
    ...summarize(histories[id], A.profile(id),
      decisions.filter(e => e.company === id).length,
      logistics.filter(e => e.company === id).length)
  }));
  assert.equal(firms.length, 3);
  return { seed, scenario: scenario.name, months: MONTHS,
    acceptedHumanActions, rejectedHumanActions, firms };
}
function aggregate(rows) {
  const result = [];
  for (const scenario of SCENARIOS) {
    for (const id of IDS) {
      const subset = rows.filter(row => row.scenario === scenario.name)
        .map(row => row.firms.find(f => f.id === id));
      assert.equal(subset.length, SEEDS.length);
      const range = key => ({
        min: Math.min(...subset.map(x => x[key])),
        max: Math.max(...subset.map(x => x[key]))
      });
      result.push({
        scenario: scenario.name, id, profile: A.profile(id), samples: subset.length,
        liquidNetChangeCent: range('liquidNetChangeCent'),
        finalCashCent: range('finalCashCent'),
        maximumDebtCent: range('maximumDebtCent'),
        maximumNetDrawdownCent: range('maximumNetDrawdownCent'),
        rescueCount: subset.reduce((n, x) => n + x.rescueCount, 0),
        finalFields: range('finalFields'),
        monthsBelowProfileBuffer: range('monthsBelowProfileBuffer')
      });
    }
  }
  return result;
}
function main() {
  const rows = [];
  for (const scenario of SCENARIOS) {
    for (const seed of SEEDS) {
      const result = run(seed, scenario);
      // Repeat exactly the same starting configuration; reject non-determinism.
      assert.deepEqual(run(seed, scenario), result,
        'non-reproducible economy: ' + scenario.name + '/' + seed);
      rows.push(result);
    }
  }
  assert.equal(rows.length, 12);
  const report = {
    schema: 'pppoppi.ai-strategy-baseline/1',
    engine: 'V1.9.3 core / V1.9.4 verification',
    comparison: 'observational, not randomized or causal',
    monthsPerRun: MONTHS, scenarioCount: SCENARIOS.length,
    seedsPerScenario: SEEDS.length, totalSimulatedMonths: rows.length * MONTHS * 2,
    limitations: [
      'Cash minus debt is a liquidity proxy, not accounting profit or total company value.',
      'Field counts are not priced; market share and production profits are not established.',
      'AI profiles are bound to company IDs and turn order; results are not a causal A/B test.',
      'Human behavior is scripted; no historical C64 or human playtest evidence.'
    ],
    rows, summary: aggregate(rows), prereleaseGate: 'BLOCKED'
  };
  console.log(JSON.stringify(report, null, 2));
}
if (require.main === module) main();
module.exports = { net, summarize, run, aggregate, SCENARIOS, SEEDS, MONTHS };
