'use strict';
// BAL-01: diagnostic of actual AI turn order, proposal execution and rejections.
// Protected V1.9.3 sources are read only. No rule changes or historical claims.
const assert = require('node:assert/strict');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');
const E = globalThis.OliV082;
const IDS = ['A1', 'A2', 'A3'];
const CASES = SCENARIOS.filter(s => ['active_normal', 'active_low_price'].includes(s.name));
const clone = value => JSON.parse(JSON.stringify(value));

function traceRun(scenario) {
  const transition = E.transition;
  const planner = globalThis.PPStrategicAI;
  assert.ok(planner && planner.ready() && typeof planner.rank === 'function');
  const records = new Map();
  const key = (month, id) => month + ':' + id;
  let probeSerial = 0;
  try {
    globalThis.PPStrategicAI = {
      ...planner,
      rank(state, id) {
        assert.equal(state.phase, 'TURN');
        assert.equal(state.companies[state.turnIndex].id, id);
        const before = JSON.stringify(state);
        const proposals = planner.rank(state, id);
        assert.equal(JSON.stringify(state), before, 'rank mutated the state');
        const k = key(state.month, id);
        let row = records.get(k);
        if (!row) {
          const firm = state.companies.find(f => f.id === id);
          const attempts = [];
          for (const proposal of proposals) {
            assert.ok(proposal && proposal.cmd && proposal.cmd.type);
            const shadow = clone(state);
            shadow.turnIndex = shadow.companies.findIndex(f => f.id === id);
            shadow.companies[shadow.turnIndex].type = 'human';
            const shadowBefore = JSON.stringify(shadow);
            const cmd = {
              ...proposal.cmd, companyId: id,
              requestId: 'AI-TRACE-' + (++probeSerial)
            };
            let error = null;
            try {
              const result = transition(shadow, cmd);
              assert.equal(result.duplicate, false, 'probe duplicate');
              E.validate(result.state);
            } catch (err) {
              error = String(err.message || err).slice(0, 160);
            }
            assert.equal(JSON.stringify(shadow), shadowBefore, 'probe changed its source');
            attempts.push({
              type: proposal.cmd.type,
              claimId: proposal.cmd.claimId || null,
              accepted: error === null, error
            });
          }
          row = {
            month: state.month, companyId: id,
            cashCent: firm.cashCent, daysUsed: firm.daysUsed,
            freeClaims: Object.values(state.claims).filter(c => c.owner === null).length,
            ownedClaims: Object.values(state.claims).filter(c => c.owner === id).length,
            firstRankCount: proposals.length, rankCalls: 0,
            firstProposals: proposals.slice(0, 3).map(p => ({
              type: p.cmd.type, claimId: p.cmd.claimId || null, score: p.score
            })),
            executableProbes: attempts.filter(a => a.accepted).length,
            rejectedProbes: attempts.filter(a => !a.accepted),
            executedActions: [], waited: false, turnObserved: false,
            logisticsActions: 0, logisticsDeclined: 0
          };
          records.set(k, row);
        }
        row.rankCalls++;
        row.lastRankCount = proposals.length;
        return proposals;
      }
    };
    E.transition = function(input, command) {
      const out = transition(input, command);
      if (command.type === 'END_TURN' && !out.duplicate) {
        const month = input.month;
        const events = out.state.events.filter(e => e.month === month);
        for (const id of IDS) {
          const row = records.get(key(month, id));
          assert.ok(row, 'AI rank not observed: ' + key(month, id));
          row.executedActions = events
            .filter(e => e.type === 'KI_ENTSCHEIDUNG' && e.company === id)
            .map(e => ({ type: e.action, claimId: e.claimId }));
          row.waited = events.some(e => e.type === 'KI_ABWARTEN' && e.company === id);
          row.turnObserved = events.some(e => e.type === 'KI_ZUG' && e.company === id);
          assert.ok(row.turnObserved, 'AI turn missing: ' + key(month, id));
          assert.ok(row.rankCalls >= row.executedActions.length, 'more actions than rankings');
          assert.equal(row.waited, row.executedActions.length === 0,
            'idle event contradicts executed actions: ' + key(month, id));
        }
        const logistics = events.filter(e => e.type === 'KI_LOGISTIK_SUMME');
        assert.equal(logistics.length, 1, 'missing logistics summary in month ' + month);
        for (const id of IDS) {
          const row = records.get(key(month, id));
          row.logisticsActions = events.filter(e =>
            e.type === 'KI_LOGISTIK' && e.company === id).length;
          row.logisticsDeclined = logistics[0].declined;
        }
      }
      return out;
    };
    const result = run('BAL01-AI-TURN-TRACE', scenario);
    const rows = [...records.values()].sort((a, b) =>
      a.month - b.month || a.companyId.localeCompare(b.companyId));
    assert.equal(rows.length, MONTHS * IDS.length, 'missing monthly AI diagnostics');
    assert.ok(rows.every(r => r.turnObserved && r.rankCalls >= 1));
    assert.equal(new Set(rows.map(r => key(r.month, r.companyId))).size, rows.length);
    return { result, rows };
  } finally {
    E.transition = transition;
    globalThis.PPStrategicAI = planner;
  }
}

function execute() {
  assert.equal(CASES.length, 2);
  const originalTransition = E.transition;
  const originalPlanner = globalThis.PPStrategicAI;
  const reports = [];
  for (const scenario of CASES) {
    const first = traceRun(scenario);
    const repeat = traceRun(scenario);
    assert.deepEqual(repeat, first, 'non-reproducible AI trace: ' + scenario.name);
    assert.deepEqual(first.result, run('BAL01-AI-TURN-TRACE', scenario),
      'instrumentation changed production economic outcome: ' + scenario.name);
    reports.push({
      scenario: scenario.name,
      baselineParity: true,
      companySummary: IDS.map(id => {
        const rows = first.rows.filter(r => r.companyId === id);
        return {
          companyId: id, months: rows.length,
          monthsWithNoProposals: rows.filter(r => r.firstRankCount === 0).length,
          monthsWithNoExecutableProbes: rows.filter(r => r.executableProbes === 0).length,
          monthsWithNoActions: rows.filter(r => r.waited).length,
          totalExecutedActions: rows.reduce((n, r) => n + r.executedActions.length, 0),
          totalRejectedFirstRankProbes: rows.reduce((n, r) => n + r.rejectedProbes.length, 0),
          finalFields: first.result.firms.find(f => f.id === id).finalFields
        };
      }),
      firstTwelveMonths: first.rows.filter(r => r.month <= 12)
    });
  }
  assert.strictEqual(E.transition, originalTransition, 'production transition not restored');
  assert.strictEqual(globalThis.PPStrategicAI, originalPlanner, 'planner not restored');
  return {
    schema: 'pppoppi.ai-turn-trace/1',
    scope: 'Real AI turns, first-rank executable probes and actual events; no source changes',
    scenarios: CASES.map(s => s.name), monthsPerRun: MONTHS,
    tracedRuns: CASES.length * 2, parityRuns: CASES.length,
    totalSimulatedMonths: CASES.length * 3 * MONTHS,
    caveats: [
      'A probe temporarily treats an AI firm as human in a cloned state; it does not alter the live game.',
      'Only first-ranking proposals are probed; later proposal rejections are not individually intercepted.',
      'The logistics decline count is global per month, not attributable to one company.',
      'This is deterministic scripted play, not independent randomized samples or historical C64 evidence.',
      'No claim about accounting profit, asset valuation, legal rights or prerelease approval.'
    ],
    reports, prereleaseGate: 'BLOCKED'
  };
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { execute, traceRun };
