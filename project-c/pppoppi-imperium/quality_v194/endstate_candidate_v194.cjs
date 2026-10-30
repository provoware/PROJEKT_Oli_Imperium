'use strict';
// Isolierter, NICHT eingebundener Entwurf fuer die eigenstaendige PPPOPPI-Adaption.
// Keine C64-Originalregel, kein stilles Update bestehender Spielstaende.
const ARCHIVE_SCHEMA = 'pppoppi.endstate.archive.proposal/1';
const ENGINE_SCHEMA = 'pppoppi.berlin.save/0.8.2';
const MODES = new Set(['free', 'campaign']);
const safe = (n) => Number.isSafeInteger(n) && n >= 0;
function rules(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      !MODES.has(input.mode)) throw Error('Spielmodus explizit festlegen');
  const keys = Object.keys(input).sort().join(',');
  if (input.mode === 'free') {
    if (keys !== 'mode') throw Error('Freies Spiel kennt keine Laufzeit');
    return Object.freeze({mode: 'free', version: ARCHIVE_SCHEMA});
  }
  if (keys !== 'mode,months' || !Number.isInteger(input.months) ||
      input.months < 12 || input.months > 240)
    throw Error('Kampagnenlaufzeit explizit zwischen 12 und 240 Monaten waehlen');
  return Object.freeze({mode: 'campaign', months: input.months, version: ARCHIVE_SCHEMA});
}
function assertState(s) {
  if (!s || s.schema !== ENGINE_SCHEMA || !['TURN', 'REPORT', 'RESCUE'].includes(s.phase) ||
      !safe(s.month) || s.month < 1 || !Array.isArray(s.companies) ||
      !s.claims || typeof s.claims !== 'object')
    throw Error('Unbekannter oder ungueltiger Ausgangsspielstand');
}
function score(s, f, regions) {
  if (!safe(f.cashCent) || !safe(f.debtCent) || !Array.isArray(f.obligations))
    throw Error('Ungueltige Geldwerte');
  let value = BigInt(f.cashCent) - BigInt(f.debtCent);
  for (const o of f.obligations) {
    if (!safe(o.dueCent) || !safe(o.paidCent) || o.paidCent > o.dueCent)
      throw Error('Ungueltige offene Rechnung');
    // Bereits in debtCent erfasste Tilgung nicht doppelt abziehen.
    if (o.kind !== 'TILGUNG') value -= BigInt(o.dueCent - o.paidCent);
  }
  for (const c of Object.values(s.claims)) {
    if (c.owner !== f.id) continue;
    const region = regions.find(r => r.id === c.region);
    if (!region || !safe(region.buy)) throw Error('Fehlender Feldwert');
    // 60 % des Kaufpreises entsprechen dem vorhandenen RESCUE_SALE-Ansatz.
    value += (BigInt(region.buy) * 60n + 50n) / 100n;
  }
  return value;
}
function freezeDeep(x) {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    for (const v of Object.values(x)) freezeDeep(v);
    Object.freeze(x);
  }
  return x;
}
function evaluate(state, contract, regions, options = {}) {
  assertState(state);
  if (!contract || contract.version !== ARCHIVE_SCHEMA || !MODES.has(contract.mode))
    throw Error('Unbekannter Endregelvertrag');
  if (!Array.isArray(regions) || !Array.isArray(state.companies) ||
      new Set(state.companies.map(f => f.id)).size !== state.companies.length)
    throw Error('Firmen- oder Regionendaten ungueltig');
  if (state.phase === 'RESCUE') return {status: 'blocked', reason: 'rescue-open'};
  if (contract.mode === 'free') {
    if (options.confirmEnd !== true) return {status: 'ongoing'};
  } else {
    if (!Number.isInteger(contract.months) || contract.months < 12 || contract.months > 240)
      throw Error('Kampagnenvertrag beschaedigt');
    if (state.month > contract.months) throw Error('Kampagnenende ueberschritten');
    if (state.month < contract.months || state.phase !== 'REPORT') return {status: 'ongoing'};
  }
  const rows = contract.mode === 'free' ? [] : state.companies.map(f => ({
    companyId: f.id, scoreCent: score(state, f, regions).toString()
  })).sort((a,b) => {
    const av = BigInt(a.scoreCent), bv = BigInt(b.scoreCent);
    return av === bv ? a.companyId.localeCompare(b.companyId) : av > bv ? -1 : 1;
  });
  let rank = 0;
  for (let i = 0; i < rows.length; i++) {
    if (i === 0 || rows[i].scoreCent !== rows[i-1].scoreCent) rank = i + 1;
    rows[i].rank = rank;
  }
  const archive = freezeDeep({
    schema: ARCHIVE_SCHEMA, sourceSchema: ENGINE_SCHEMA,
    sourceRuleset: state.ruleset, mode: contract.mode,
    durationMonths: contract.mode === 'campaign' ? contract.months : null,
    endMonth: state.month,
    reason: contract.mode === 'free' ? 'voluntary-end' : 'campaign-duration',
    winnerIds: rows.filter(r => r.rank === 1).map(r => r.companyId),
    ranking: rows,
    snapshot: JSON.parse(JSON.stringify(state))
  });
  return {status: 'finished', archive};
}
function guardArchived(archive, transition, state, command) {
  if (archive?.schema === ARCHIVE_SCHEMA) throw Error('Archivierte Partie ist unveraenderbar');
  return transition(state, command);
}
module.exports = {ARCHIVE_SCHEMA, ENGINE_SCHEMA, rules, evaluate, guardArchived};
