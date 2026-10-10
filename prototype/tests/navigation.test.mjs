import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SCREEN, availablePilotActions, getPilotCard, navigatePilot, validatePilotContract } from '../navigation.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const contract = JSON.parse(readFileSync(join(root, 'data', 'contract.json'), 'utf8'));

describe('HTML-PILOT – beleggebundener Navigationsentwurf, kein Originaltest', () => {
  it('liest ausschließlich den bestehenden Forschungsvertrag', () => {
    assert.equal(validatePilotContract(contract), true);
    assert.equal(INITIAL_SCREEN, 'SCREEN-001');
  });

  it('bildet die hypothetische Büro → Karte → Claim-Folge ab', () => {
    const first = navigatePilot(INITIAL_SCREEN, 'to-map');
    assert.deepEqual(first, { ok: true, screen: 'SCREEN-002' });
    assert.deepEqual(navigatePilot(first.screen, 'to-claims'), { ok: true, screen: 'SCREEN-003' });
    assert.deepEqual(navigatePilot('SCREEN-003', 'to-map'), { ok: true, screen: 'SCREEN-002' });
    assert.deepEqual(navigatePilot('SCREEN-002', 'to-office'), { ok: true, screen: 'SCREEN-001' });
  });

  it('verweigert nicht vorgesehene Schritte ohne Zustandswechsel', () => {
    const failed = navigatePilot('SCREEN-001', 'to-claims');
    assert.equal(failed.ok, false);
    assert.equal(failed.screen, 'SCREEN-001');
    assert.deepEqual(availablePilotActions('UNKNOWN'), []);
  });

  it('zeigt Regel-IDs, Fragen und Quellen aus dem Originaldatensatz', () => {
    const office = getPilotCard(contract, 'SCREEN-001');
    assert.equal(office.screen.id, 'SCREEN-001');
    assert.ok(office.rules.some((r) => r.id === 'REGEL-002'));
    assert.ok(office.questions.some((q) => q.id === 'Q-001'));
    assert.ok(office.sources.some((s) => s.id === 'SRC-001'));
    assert.equal(office.reference.verified_run, false);
  });

  it('markiert die unbestätigte Claim-Ansicht weiterhin als offen', () => {
    const claim = getPilotCard(contract, 'SCREEN-003');
    assert.equal(claim.screen.status, 'open');
    assert.ok(claim.questions.some((q) => q.id === 'Q-002'));
  });

  it('verändert den Datenvertrag bei Navigation und Ableitung nicht', () => {
    const old = JSON.stringify(contract);
    getPilotCard(contract, 'SCREEN-001');
    navigatePilot('SCREEN-001', 'to-map');
    assert.equal(JSON.stringify(contract), old);
  });

  it('verweigert beschädigte Daten statt Forschungsbelege zu erfinden', () => {
    assert.throws(() => validatePilotContract({ schema_version: '9.0' }));
    assert.throws(() => getPilotCard(contract, 'SCREEN-999'));
    const duplicate = structuredClone(contract);
    duplicate.screens.push({ ...duplicate.screens[0] });
    assert.throws(() => validatePilotContract(duplicate), /Doppelte Forschungs-ID/);
    const missing = structuredClone(contract);
    missing.screens = [];
    assert.throws(() => validatePilotContract(missing), /Pilotbildschirm/);
  });

  it('weist weder alle Regeln noch Originaltests als bestanden aus', () => {
    assert.equal(contract.rules.filter((r) => r.status === 'approved').length, 0);
    assert.equal(contract.tests.filter((t) => t.kind === 'original' && t.status === 'passed').length, 0);
  });
});
