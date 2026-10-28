/* PPPOPPI IMPERIUM V1.9.4 – Endspiel-Laufzeit der abgeleiteten Technikfassung.
 * Kein historischer C64-Regelanspruch. Keine Originaldatei wird veraendert. */
(() => {
  'use strict';
  const E = window.OliV082;
  const bundle = window.PPPEndstate;
  if (!E || !bundle || !bundle.candidate || !bundle.session || !bundle.io)
    throw Error('Endspiel-Browserpaket oder Wirtschaftskern fehlt');
  const {candidate: C, session: S, io: IO} = bundle;
  const dependencies = Object.freeze({engine: E, candidate: C, io: IO, regions: E.REGIONS});
  let current = null;
  function parseSelection(selection) {
    if (selection === 'free') return C.rules({mode: 'free'});
    const match = /^campaign:(12|24|60|120|240)$/.exec(selection);
    if (!match) throw Error('Spielart muss ausdruecklich ausgewaehlt werden');
    return C.rules({mode: 'campaign', months: Number(match[1])});
  }
  function start(state, selection) {
    const contract = parseSelection(selection);
    const next = S.createSession({...dependencies, contract, state});
    current = next;
    return next.snapshot();
  }
  function apply(state, command) {
    if (!current) return E.transition(state, command); // Nur alte, unversionierte Spielstaende.
    // Ein externer Zustand darf die gesicherte Sitzung nicht still ersetzen.
    if (JSON.stringify(current.snapshot()) !== JSON.stringify(state))
      throw Error('Spielstand und Endspiel-Sitzung sind nicht synchron');
    const result = current.apply(command);
    return {state: result.state, status: result.status};
  }
  function finish() {
    if (!current) throw Error('Alte Partie hat keinen Endspielvertrag');
    return current.finish(true);
  }
  function importSession(text) {
    const next = S.importSession(text, dependencies);
    current = next; // Erst nach vollstaendiger Validierung austauschen.
    return next.snapshot();
  }
  function exportSession() {
    if (!current) throw Error('Alte Partie ohne Endspielvertrag: neue Partie starten');
    return current.exportSession();
  }
  function exportArchive() {
    if (!current) throw Error('Kein Abschlussarchiv vorhanden');
    return current.exportArchive();
  }
  function archive() {
    if (!current || current.status() !== 'finished') return null;
    return JSON.parse(current.exportArchive());
  }
  function detach() { current = null; }
  function status() { return current ? current.status() : 'legacy'; }
  function contract() { return current ? current.contract() : null; }
  window.PPPEndstateLive = Object.freeze({
    start, apply, finish, importSession, exportSession, exportArchive,
    archive, detach, status, contract, parseSelection
  });
})();
