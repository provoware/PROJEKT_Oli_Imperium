'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const vm = require('node:vm');
const {bundleSource, MODULES} = require('./endstate_browser_bundle_v194.cjs');

test('Browser-Paket enthaelt genau die drei versionierten Originaladapter', () => {
  assert.deepEqual(MODULES, [
    'endstate_candidate_v194.cjs',
    'endstate_archive_io_v194.cjs',
    'endstate_session_v194.cjs'
  ]);
  const code = bundleSource();
  assert.ok(code.includes('root.PPPEndstate'));
  assert.ok(!code.includes('eval('));
  assert.ok(code.length > 5000);
});

test('Ohne Node-require im Browser: freies Ende, JSON-Rundlauf und Aktionssperre', () => {
  const context = vm.createContext({window: {}, TextEncoder});
  vm.runInContext(bundleSource(), context, {timeout: 3000});
  const result = vm.runInContext(`
    (() => {
      const {candidate: C, io: IO, session: S} = window.PPPEndstate;
      const engine = {
        validate(s) { if (s.schema !== C.ENGINE_SCHEMA || s.month < 1) throw Error('Ungueltiger Zustand'); return true; },
        transition(s, cmd) { s.month += 1; return {state: s}; }
      };
      const deps = {engine, candidate: C, io: IO, regions: []};
      const state = {schema: C.ENGINE_SCHEMA, ruleset: 'preview', phase: 'TURN',
        month: 1, companies: [{id: 'H1', cashCent: 100, debtCent: 0, obligations: []}], claims: {}};
      const s = S.createSession({...deps, contract: C.rules({mode: 'free'}), state});
      const before = s.exportSession();
      s.apply({type: 'NEXT_MONTH'});
      const after = s.snapshot().month;
      const ended = s.finish(true).status;
      const archive = s.exportArchive();
      const restored = S.importSession(s.exportSession(), deps);
      let locked = false;
      try { restored.apply({type: 'NEXT_MONTH'}); } catch (error) { locked = /unveraenderbar/.test(error.message); }
      return {before: before.length > 0, after, ended, locked,
        restored: restored.status(), archive: IO.importArchive(archive, []).endMonth};
    })()
  `, context, {timeout: 3000});
  assert.equal(result.before, true);
  assert.equal(result.after, 2);
  assert.equal(result.ended, 'finished');
  assert.equal(result.restored, 'finished');
  assert.equal(result.archive, 2);
  assert.equal(result.locked, true);
});

test('Browser-Adapter lehnt defekten Archiv-Spielstand ab', () => {
  const context = vm.createContext({window: {}, TextEncoder});
  vm.runInContext(bundleSource(), context, {timeout: 3000});
  const result = vm.runInContext(`
    (() => {
      const {candidate: C, io: IO, session: S} = window.PPPEndstate;
      const engine = {
        validate(s) { if (s.integrity === 'broken') throw Error('Spielstand ungueltig'); return true; },
        transition(s) { return {state: s}; }
      };
      const deps = {engine, candidate: C, io: IO, regions: []};
      const state = {schema: C.ENGINE_SCHEMA, ruleset: 'preview', phase: 'TURN',
        month: 1, companies: [], claims: {}};
      const good = S.createSession({...deps, contract: C.rules({mode: 'free'}), state});
      good.finish(true);
      const archive = JSON.parse(good.exportArchive());
      archive.snapshot.integrity = 'broken';
      // Der geaenderte Zustand ist im isolierten Archiv formal konsistent.
      const raw = JSON.stringify(archive);
      let rejected = false;
      try { S.createSession({...deps, contract: C.rules({mode: 'free'}), archivedText: raw}); }
      catch (error) { rejected = /Spielstand ungueltig/.test(error.message); }
      return rejected;
    })()
  `, context, {timeout: 3000});
  // Der Archiv-Adapter kann den zusaetzlichen Wert ablehnen; in beiden Faellen sicher.
  assert.equal(result, true);
});
