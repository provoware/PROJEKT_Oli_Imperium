'use strict';
// Eigenstaendige PPPOPPI-Kampagnen: reale Engine, keine historische C64-Regel.
// Reiner Regressionstest; kein Produkt-, Speicherformat- oder Originalquell-Eingriff.
const assert = require('node:assert/strict');
const {test} = require('node:test');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const engine = require('../SPIEL/src/v082_strategy_engine.js');
const candidate = require('./endstate_candidate_v194.cjs');
const io = require('./endstate_archive_io_v194.cjs');
const session = require('./endstate_session_v194.cjs');
global.window = {OliV082: engine, PPPEndstate: {candidate, io, session}};
require('./endstate_live_v194.js');
const live = global.window.PPPEndstateLive;
let sequence = 0;
function action(state, type, companyId = 'H1') {
  return live.apply(state, {
    type, companyId, requestId: 'LONG-CAMPAIGN-' + (++sequence)
  }).state;
}
function campaign(months) {
  let state = live.start(
    engine.fresh({humans: 2, ais: 0, seed: 'LONG-CAMPAIGN-' + months}),
    'campaign:' + months
  );
  assert.equal(live.contract().months, months);
  assert.equal(live.status(), 'active');
  const checkpointMonth = months / 2;
  let rescueActions = 0;
  for (let month = 1; month <= months; month++) {
    assert.equal(state.month, month, 'Startmonat ' + month);
    assert.equal(state.phase, 'TURN', 'Rundenbeginn ' + month);
    assert.equal(live.status(), 'active', 'Nicht vorzeitig archivieren');
    state = action(state, 'END_TURN', 'H1');
    state = action(state, 'END_TURN', 'H2');
    let rescueGuard = 0;
    while (live.status() === 'active' && state.phase === 'RESCUE') {
      assert.ok(++rescueGuard <= 10, 'Sanierungsschleife in Monat ' + month);
      assert.ok(Array.isArray(state.rescueIds) && state.rescueIds.length > 0,
        'Sanierungsfirma muss bekannt sein');
      state = action(state, 'RESTART', state.rescueIds[0]);
      rescueActions++;
    }
    assert.equal(state.phase, 'REPORT', 'Monatsbericht ' + month);
    assert.equal(state.reports.length, month, 'Exakt ein Bericht pro Monat');
    if (month === checkpointMonth) {
      const exported = live.exportSession();
      const data = JSON.parse(exported);
      assert.equal(data.contract.mode, 'campaign');
      assert.equal(data.contract.months, months);
      assert.deepEqual(data.state, state);
      const invalid = structuredClone(data);
      invalid.contract.months = 12;
      assert.throws(() => live.importSession(JSON.stringify(invalid)),
        'Falscher Kampagnenvertrag darf aktive Sitzung nicht ersetzen');
      assert.equal(live.exportSession(), exported,
        'Fehlerhafter Import muss atomar sein');
      state = live.importSession(exported);
      assert.deepEqual(state, data.state, 'Spielstand nach Zwischenimport identisch');
      assert.equal(live.contract().months, months, 'Laufzeit bleibt erhalten');
    }
    if (month < months) {
      assert.equal(live.status(), 'active', 'Vorzeitiges Spielende in Monat ' + month);
      state = action(state, 'NEXT_MONTH');
    }
  }
  assert.equal(live.status(), 'finished', 'Ende exakt nach ' + months + ' Monaten');
  assert.equal(state.month, months);
  assert.equal(engine.validate(state), true);
  const archive = live.archive();
  assert.equal(archive.durationMonths, months);
  assert.equal(archive.endMonth, months);
  assert.equal(archive.reason, 'campaign-duration');
  assert.deepEqual(archive.snapshot, state);
  assert.equal(archive.ranking.length, state.companies.length);
  assert.deepEqual(archive.winnerIds,
    archive.ranking.filter(row => row.rank === 1).map(row => row.companyId));
  assert.ok(archive.ranking.every((row, i, rows) =>
    i === 0 || BigInt(rows[i - 1].scoreCent) >= BigInt(row.scoreCent)));
  const finalText = live.exportSession();
  const finalData = JSON.parse(finalText);
  assert.equal(finalData.state, null, 'Abgeschlossene Sitzung ohne aktiven Spielstand');
  assert.deepEqual(finalData.archive, archive);
  assert.deepEqual(live.importSession(finalText), state);
  assert.deepEqual(live.archive(), archive, 'Archiv nach Import unveraendert');
  assert.throws(() => action(state, 'NEXT_MONTH'), /unveraenderbar/,
    'Archiv darf keine weitere Buchung erlauben');
  console.log('KAMPAGNEN-LANGTEST', JSON.stringify({
    months, reports: state.reports.length, companies: state.companies.length,
    rescueActions, checkpointMonth, restoredArchive: true,
    historicalC64Verification: 'BLOCKED', releaseGate: 'BLOCKED'
  }));
}
test('24-Monats-Kampagne: vollstaendige Engine-Partie, Zwischenimport, Abschluss', () => {
  campaign(24);
});
test('60-Monats-Kampagne: vollstaendige Engine-Partie, Zwischenimport, Abschluss', () => {
  campaign(60);
});
