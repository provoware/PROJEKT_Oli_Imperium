import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PILOT_TRACE_KIND, PILOT_TRACE_LIMIT, createPilotTrace,
  appendPilotTrace, serializePilotTrace,
} from '../pilot-trace.mjs';

describe('C0: reproduzierbarer technischer Navigationsbericht', () => {
  it('erstellt ein nicht als Originalnachweis ausgegebenes Sitzungsprotokoll', () => {
    const start = createPilotTrace('0.1.0-alpha.4');
    assert.equal(start.kind, PILOT_TRACE_KIND);
    assert.equal(start.reference_verified, false);
    assert.deepEqual(start.steps, [{ sequence: 0, from: null, action: 'start', to: 'SCREEN-001' }]);
    assert.match(serializePilotTrace(start), /Kein C64-Originaltest/);
  });
  it('zeichnet einen vollständigen Entwurfspfad auf und verändert niemals Vorgängerdaten', () => {
    const a = createPilotTrace('0.1.0-alpha.4');
    const b = appendPilotTrace(a, 'SCREEN-001', 'to-map');
    const c = appendPilotTrace(b, 'SCREEN-002', 'to-claims');
    const d = appendPilotTrace(c, 'SCREEN-003', 'to-map');
    const e = appendPilotTrace(d, 'SCREEN-002', 'to-office');
    assert.equal(a.steps.length, 1);
    assert.equal(b.steps.length, 2);
    assert.deepEqual(e.steps.map(x => x.to), [
      'SCREEN-001', 'SCREEN-002', 'SCREEN-003', 'SCREEN-002', 'SCREEN-001',
    ]);
    assert.deepEqual(e.steps.map(x => x.sequence), [0, 1, 2, 3, 4]);
    assert.deepEqual(JSON.parse(serializePilotTrace(e)).steps, e.steps);
  });
  it('liefert für identische Eingaben bitweise gleiche JSON-Protokolle', () => {
    const trial = () => serializePilotTrace(appendPilotTrace(
      createPilotTrace('0.1.0-alpha.4'), 'SCREEN-001', 'to-map',
    ));
    assert.equal(trial(), trial());
  });
  it('verwirft nicht vorgesehene Übergänge und Abweichungen vom aktuellen Bildschirm', () => {
    const state = createPilotTrace('0.1.0-alpha.4');
    assert.throws(() => appendPilotTrace(state, 'SCREEN-001', 'to-claims'), /nicht vorgesehen/);
    assert.throws(() => appendPilotTrace(state, 'SCREEN-003', 'to-map'), /stimmt nicht/);
    assert.equal(state.steps.length, 1);
  });
  it('lässt keine Objektprototyp-Aktionen durch', () => {
    const state = createPilotTrace('0.1.0-alpha.4');
    for (const name of ['constructor', 'toString', '__proto__']) {
      assert.throws(() => appendPilotTrace(state, 'SCREEN-001', name));
    }
  });
  it('begrenzt bei langen Sitzungen den Speicher, ohne Schrittzahlen zu verlieren', () => {
    let state = createPilotTrace('0.1.0-alpha.4');
    const actions = [
      ['SCREEN-001', 'to-map'], ['SCREEN-002', 'to-office'],
    ];
    for (let n = 0; n < 600; n++) {
      const [from, action] = actions[n % 2];
      state = appendPilotTrace(state, from, action);
    }
    assert.equal(state.steps.length, PILOT_TRACE_LIMIT);
    assert.equal(state.omitted_steps, 601 - PILOT_TRACE_LIMIT);
    assert.equal(state.steps.at(-1).sequence, 600);
    assert.equal(state.steps[0].sequence, 401);
    const parsed = JSON.parse(serializePilotTrace(state));
    assert.equal(parsed.omitted_steps, state.omitted_steps);
    assert.equal(parsed.reference_verified, false);
  });
  it('verwirft defekte Protokolle und ungültige Vorabversionskennungen', () => {
    for (const version of ['1.0.0', '0.1', '0.1.0', 'abc', '__proto__']) {
      assert.throws(() => createPilotTrace(version), TypeError);
    }
    assert.throws(() => serializePilotTrace({ kind: PILOT_TRACE_KIND, steps: [] }));
    assert.throws(() => appendPilotTrace({ steps: [], kind: PILOT_TRACE_KIND }, 'SCREEN-001', 'to-map'));
  });
  it('gibt keine Schlüssel oder Forschungsdaten im Protokoll aus', () => {
    const body = serializePilotTrace(createPilotTrace('0.1.0-alpha.4'));
    assert.ok(!body.includes('sources'));
    assert.ok(!body.includes('url'));
    assert.ok(!body.includes('image_sha256'));
  });
});
