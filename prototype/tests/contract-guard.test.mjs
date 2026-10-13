import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePilotContract } from '../contract-guard.mjs';

const original = JSON.parse(readFileSync(new URL('../../data/contract.json', import.meta.url), 'utf8'));
const changed = (modify) => {
  const contract = structuredClone(original);
  modify(contract);
  return contract;
};

describe('C0: Browser-Datenprüfung sperrt ungeprüfte Originalaussagen', () => {
  it('nimmt den aktuell ungeprüften Vertragsstand als gültigen Entwurf an', () => {
    assert.equal(validatePilotContract(original), true);
  });
  it('verweigert erdachte Originalfreigaben ohne Emulator und SHA-256', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.reference.status = 'verified';
    })), /Originalreferenz/);
    assert.throws(() => validatePilotContract(changed(data => {
      data.reference.verified_run = true;
    })), /widersprechen/);
  });
  it('prüft Referenz-Hash und Emulator-Version bei bestätigtem Referenzstatus', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      Object.assign(data.reference, { status: 'verified', verified_run: true,
        image_sha256: '123', emulator_version: 'VICE' });
    })), /SHA-256/);
  });
  it('verweigert fehlende oder falsche Quellen-Verweise', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.rules[0].source_ids = ['SRC-NICHT-DA'];
    })), /fehlende Referenz/);
    assert.throws(() => validatePilotContract(changed(data => {
      data.rules[0].source_ids = ['REGEL-002'];
    })), /falsche Referenzart/);
  });
  it('verweigert eine angeblich freigegebene Regel ohne Quelle', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.rules[0].status = 'approved';
      data.rules[0].source_ids = [];
    })), /ohne Quelle/);
  });
  it('verweigert Originaltest PASS ohne verifizierte Originalquelle', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.tests[0].status = 'passed';
      data.tests[0].evidence = 'angeblich';
    })), /Originaltest ohne/);
  });
  it('verweigert unzulässige Prüfstatus und abweichende Schema-Version', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.screens[0].status = 'abgenommen';
    })), /Prüfstatus/);
    assert.throws(() => validatePilotContract(changed(data => {
      data.schema_version = '2.0';
    })), /Forschungsdatenvertrag/);
  });
  it('verweigert gefährliche Quelllinks und falsche Quellenarten', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.sources[0].url = 'javascript:alert(1)';
    })), /Quelladresse/);
    assert.throws(() => validatePilotContract(changed(data => {
      data.sources[0].type = 'unbekannt';
    })), /Quelladresse/);
  });
  it('verweigert doppelte Forschungs-IDs und Fragen mit fehlenden Links', () => {
    assert.throws(() => validatePilotContract(changed(data => {
      data.sources[1].id = data.sources[0].id;
    })), /Doppelte Forschungs-ID/);
    assert.throws(() => validatePilotContract(changed(data => {
      data.questions[0].related_ids = ['SCREEN-999'];
    })), /fehlende Referenz/);
  });
  it('weist fehlende Pflichtlisten für alle späteren Bildschirmansichten frühzeitig zurück', () => {
    for (const [group, index, field] of [
      ['screens', 0, 'source_ids'],
      ['screens', 2, 'source_ids'],
      ['rules', 0, 'source_ids'],
      ['rules', 1, 'screen_ids'],
      ['questions', 0, 'related_ids'],
    ]) {
      for (const mode of ['missing', 'null', 'object']) {
        assert.throws(() => validatePilotContract(changed(data => {
          if (mode === 'missing') delete data[group][index][field];
          else data[group][index][field] = mode === 'null' ? null : {};
        })), /Liste oder Verknüpfungen ungültig/, group + '[' + index + '].' + field + ':' + mode);
      }
    }
  });
  it('akzeptiert vorhandene leere Pflichtlisten ohne erfundene Quellennachweise', () => {
    const valid = changed(data => {
      data.screens[2].source_ids = [];
      data.rules[1].screen_ids = [];
      data.questions[0].related_ids = [];
    });
    assert.equal(validatePilotContract(valid), true);
  });
  it('verweigert fehlende Verweisliste beim angeblich bestandenen Originaltest kontrolliert', () => {
    for (const mode of ['missing', 'null', 'object']) {
      assert.throws(() => validatePilotContract(changed(data => {
        Object.assign(data.reference, {
          status: 'verified', verified_run: true,
          emulator_version: 'SYNTHETISCH', image_sha256: 'a'.repeat(64),
        });
        data.tests[0].status = 'passed';
        data.tests[0].evidence = 'SYNTHETISCHER TESTBELEG';
        if (mode === 'missing') delete data.tests[0].rule_ids;
        else data.tests[0].rule_ids = mode === 'null' ? null : {};
      })), /Liste oder Verknüpfungen ungültig/, mode);
    }
  });
  it('verändert den übergebenen Forschungsvertrag nicht', () => {
    const before = JSON.stringify(original);
    validatePilotContract(original);
    assert.equal(JSON.stringify(original), before);
  });
});
