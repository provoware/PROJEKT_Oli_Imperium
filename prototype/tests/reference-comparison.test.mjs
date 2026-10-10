import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appendPilotTrace, createPilotTrace } from '../pilot-trace.mjs';
import { COMPARISON_KIND, createReferenceComparisonPlan, serializeReferenceComparisonPlan } from '../reference-comparison.mjs';

const contract = JSON.parse(readFileSync(new URL('../../data/contract.json', import.meta.url), 'utf8'));
const version = '0.1.0-alpha.5';

function completeTrace() {
  let trace = createPilotTrace(version);
  trace = appendPilotTrace(trace, 'SCREEN-001', 'to-map');
  trace = appendPilotTrace(trace, 'SCREEN-002', 'to-claims');
  trace = appendPilotTrace(trace, 'SCREEN-003', 'to-map');
  return appendPilotTrace(trace, 'SCREEN-002', 'to-office');
}

describe('C0 Vergleichsvorlage – technischer Entwurf gegenüber noch fehlenden Emulatorbefunden', () => {
  it('ordnet alle drei verpflichtenden Originaltests ihren rein hypothetischen Übergängen zu', () => {
    const plan = createReferenceComparisonPlan(completeTrace(), contract);
    assert.equal(plan.kind, COMPARISON_KIND);
    assert.deepEqual(plan.tests.map(item => item.test_id), ['TEST-001', 'TEST-002', 'TEST-003']);
    assert.deepEqual(plan.tests.map(item => item.draft_step_numbers), [[1], [2], [4]]);
    assert.equal(plan.tests[0].draft_expected.action, 'to-map');
    assert.equal(plan.tests[1].draft_expected.to, 'SCREEN-003');
    assert.equal(plan.tests[2].draft_expected.from, 'SCREEN-002');
  });
  it('übernimmt IDs, Titel und Quellen aus dem einzigen Forschungsvertrag', () => {
    const plan = createReferenceComparisonPlan(completeTrace(), contract);
    for (const test of plan.tests) {
      const entry = contract.tests.find(item => item.id === test.test_id);
      assert.equal(test.test_title, entry.title);
      assert.deepEqual(test.rule_ids, entry.rule_ids);
      assert.ok(test.source_ids.length > 0);
    }
  });
  it('gibt niemals Vergleichserfolg oder bestätigte Originaltests vor', () => {
    const plan = createReferenceComparisonPlan(completeTrace(), contract);
    assert.equal(plan.original_verified, false);
    assert.equal(plan.scientific_approval, false);
    for (const entry of plan.tests) {
      assert.equal(entry.contract_status, 'not_run');
      assert.equal(entry.comparison_status, 'not_compared');
      assert.equal(entry.original_observation, null);
      assert.equal(entry.original_evidence_id, null);
    }
  });
  it('zeigt fehlende technische Navigationsschritte offen an', () => {
    const plan = createReferenceComparisonPlan(createPilotTrace(version), contract);
    assert.deepEqual(plan.tests.map(entry => entry.draft_step_numbers), [[], [], []]);
    assert.ok(plan.notes.some(note => note.includes('null')));
  });
  it('exportiert deterministisches JSON mit klaren Negativkennzeichnungen', () => {
    const trace = completeTrace();
    const first = serializeReferenceComparisonPlan(trace, contract);
    assert.equal(first, serializeReferenceComparisonPlan(trace, contract));
    const json = JSON.parse(first);
    assert.equal(json.schema_version, 1);
    assert.equal(json.original_verified, false);
    assert.equal(json.tests.length, 3);
    assert.ok(!first.includes('"comparison_status": "passed"'));
  });
  it('verändert weder Forschungsdaten noch Navigationsprotokolle', () => {
    const trace = completeTrace();
    const beforeContract = JSON.stringify(contract);
    const beforeTrace = JSON.stringify(trace);
    createReferenceComparisonPlan(trace, contract);
    assert.equal(JSON.stringify(contract), beforeContract);
    assert.equal(JSON.stringify(trace), beforeTrace);
  });
  it('verweigert defekte Forschungsdaten, fehlende Originaltest-IDs und falsche Trace-Typen', () => {
    const trace = completeTrace();
    const broken = structuredClone(contract);
    broken.tests = broken.tests.filter(entry => entry.id !== 'TEST-002');
    assert.throws(() => createReferenceComparisonPlan(trace, broken), /Pflicht-Originaltest/);
    assert.throws(() => createReferenceComparisonPlan({ kind: 'original', steps: [] }, contract), TypeError);
    assert.throws(() => createReferenceComparisonPlan({ ...trace, reference_verified: true }, contract), TypeError);
  });
  it('kennzeichnet abgeschnittene technische Schritte und bleibt unabhängig von ihnen', () => {
    let trace = createPilotTrace(version);
    for (let i = 0; i < 260; i++) {
      trace = appendPilotTrace(trace, i % 2 ? 'SCREEN-002' : 'SCREEN-001', i % 2 ? 'to-office' : 'to-map');
    }
    const plan = createReferenceComparisonPlan(trace, contract);
    assert.ok(plan.omitted_technical_steps > 0);
    assert.equal(plan.tests.length, 3);
    assert.ok(plan.notes.some(note => note.includes('TEST-003')));
  });
});
