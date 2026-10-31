'use strict';
// FIN/WIR/BAL: unabhängige finanzielle Grenzen; kein unbestätigter C64- oder Bilanzwert.
// Die 110 geprüften Spielquellen und echte Nutzer-Spielstände bleiben unverändert.
const test = require('node:test');
const assert = require('node:assert/strict');
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const clone = x => JSON.parse(JSON.stringify(x));
const amount = (value, label) => {
  assert.ok(Number.isSafeInteger(value) && value >= 0, label + ' unzulässig');
  return value;
};
const checkedAdd = (left, right, label) => {
  const result = left + right;
  assert.ok(Number.isSafeInteger(result), label + ' Überlauf');
  return result;
};
// Diese Ansicht ist eine technische Bestandsaufnahme, KEINE Bilanz.
function boundaries(state, companyId) {
  assert.ok(state && Array.isArray(state.companies), 'Firmen fehlen');
  const firm = state.companies.find(x => x.id === companyId);
  assert.ok(firm && Array.isArray(firm.obligations), 'Firma/Rechnungen fehlen');
  const cash = amount(firm.cashCent, 'Kasse');
  const debt = amount(firm.debtCent, 'Kreditschuld');
  let unpaidOperating = 0, unpaidPrincipal = 0;
  for (const invoice of firm.obligations) {
    assert.ok(invoice && typeof invoice.kind === 'string' && invoice.kind.length > 0,
      'Rechnungsart fehlt');
    const due = amount(invoice.dueCent, 'Rechnungssoll');
    const paid = amount(invoice.paidCent, 'Rechnungszahlung');
    assert.ok(paid <= due, 'Überzahlung in Rechnung');
    const remaining = due - paid;
    if (invoice.kind === 'TILGUNG') {
      // Die noch offene Tilgung ist bereits Teil von debtCent: NICHT nochmals abziehen.
      unpaidPrincipal = checkedAdd(unpaidPrincipal, remaining, 'Tilgung');
    } else {
      unpaidOperating = checkedAdd(unpaidOperating, remaining, 'Sonstige Rechnung');
    }
  }
  assert.ok(unpaidPrincipal <= debt, 'Ausstehende Tilgung übersteigt Kreditschuld');
  const knownObligations = checkedAdd(debt, unpaidOperating, 'Verpflichtungen');
  const moneyAfterKnownObligations = cash - knownObligations;
  const cashMinusDebt = cash - debt;
  assert.ok(Number.isSafeInteger(moneyAfterKnownObligations) &&
    Number.isSafeInteger(cashMinusDebt), 'Netto-Geldposition Überlauf');

  const claims = Object.values(state.claims || {}).filter(c => c.owner === companyId);
  let rawInventory = 0, preparedRaw = 0;
  for (const c of claims) {
    rawInventory = checkedAdd(rawInventory, amount(c.inventoryMilli, 'Rohöllager'), 'Rohöllager');
    preparedRaw = checkedAdd(preparedRaw, amount(c.preparedMilli, 'Bereitstellung'), 'Bereitstellung');
  }
  const plants = Object.values(state.refinery?.plants?.[companyId] || {});
  let refinedProduct = 0, builtPlants = 0;
  for (const p of plants) {
    refinedProduct = checkedAdd(refinedProduct,
      amount(p.productMilli, 'Raffinerieprodukt'), 'Raffinerieprodukt');
    if (p.built) builtPlants++;
  }
  return {
    companyId, cashCent: cash, loanPrincipalCent: debt,
    unpaidPrincipalAlreadyInLoanCent: unpaidPrincipal,
    unpaidOtherInvoicesCent: unpaidOperating,
    knownMonetaryObligationsCent: knownObligations,
    cashMinusLoanCent: cashMinusDebt,
    moneyAfterKnownObligationsCent: moneyAfterKnownObligations,
    physicalButUnvalued: {
      ownedClaims: claims.length, refineryPlants: builtPlants,
      rawInventoryMilli: rawInventory, rawPreparedMilli: preparedRaw,
      refinedProductMilli: refinedProduct
    },
    // Niemals auf 0 setzen: "unbekannt" ist keine Null-Bewertung.
    receivablesCent: null, totalAssetsCent: null,
    accountingProfitCent: null, totalEquityCent: null,
    scope: 'technical-monetary-snapshot-only',
    releaseGate: 'BLOCKED'
  };
}
const fresh = () => E.fresh({humans: 2, ais: 0, seed: 'FIN-WIR-20261031'});
function move(s, type, id, extra={}) {
  const original = clone(s);
  const r = E.transition(s, {
    type, companyId: id, requestId: 'FIN-'+(++move.serial), ...extra
  });
  assert.equal(r.duplicate, false);
  assert.deepEqual(s, original, 'Spielkern hat Eingabe verändert');
  E.validate(r.state);
  return r.state;
}
move.serial = 0;

test('echter Feldkauf: Kassenabfluss, Besitz und unbewertete Anlage getrennt', () => {
  let s = fresh();
  const initial = boundaries(s, 'H1');
  assert.equal(initial.cashCent, E.CFG.startCash);
  assert.equal(initial.moneyAfterKnownObligationsCent, E.CFG.startCash);
  assert.equal(initial.totalAssetsCent, null);
  s = move(s, 'SURVEY', 'H1', {claimId:'BERLIN-1'});
  s = move(s, 'BUY', 'H1', {claimId:'BERLIN-1'});
  const after = boundaries(s, 'H1');
  assert.ok(after.cashCent < initial.cashCent);
  assert.equal(after.loanPrincipalCent, 0);
  assert.equal(after.physicalButUnvalued.ownedClaims, 1);
  assert.equal(after.accountingProfitCent, null, 'Kauf darf nicht als Gewinn/Verlust geschätzt werden');
  assert.equal(after.totalEquityCent, null);
  s = move(s, 'END_TURN', 'H1');
  s = move(s, 'END_TURN', 'H2');
  assert.equal(s.phase, 'REPORT');
  assert.equal(s.reports.length, 1);
  assert.equal(boundaries(s, 'H1').cashCent,
    s.lastReport.companies.find(f => f.id === 'H1').cashCent);
});

test('Kreditaufnahme erhöht Kasse und Kreditschuld gleich, nicht die Netto-Geldposition', () => {
  const s = fresh();
  const before = boundaries(s, 'H1');
  const loan = E.CFG.credit;
  s.companies[0].cashCent += loan;
  s.companies[0].debtCent += loan; // ausschließlich isolierte Rechen-Gegenprobe
  const after = boundaries(s, 'H1');
  assert.equal(after.cashCent - before.cashCent, loan);
  assert.equal(after.loanPrincipalCent - before.loanPrincipalCent, loan);
  assert.equal(after.moneyAfterKnownObligationsCent, before.moneyAfterKnownObligationsCent);
  assert.equal(after.accountingProfitCent, null);
});

test('offene Tilgungsrechnung zählt nicht ein zweites Mal als Schuld', () => {
  const s = fresh();
  const f = s.companies[0];
  f.debtCent = 6000;
  f.obligations.push(
    {id:'T1', kind:'TILGUNG', priority:3, dueCent:2000, paidCent:0},
    {id:'Z1', kind:'ZINS', priority:3, dueCent:1000, paidCent:200}
  );
  const a = boundaries(s, 'H1');
  assert.equal(a.unpaidPrincipalAlreadyInLoanCent, 2000);
  assert.equal(a.unpaidOtherInvoicesCent, 800);
  assert.equal(a.knownMonetaryObligationsCent, 6800);
  assert.equal(a.cashMinusLoanCent - a.moneyAfterKnownObligationsCent, 800);
});

test('reale Monatsabrechnung: Rechnungen und Kasse sind getrennt', () => {
  let s = fresh();
  s = move(s, 'END_TURN', 'H1');
  s = move(s, 'END_TURN', 'H2');
  const a = boundaries(s, 'H1');
  assert.equal(a.loanPrincipalCent, 0);
  assert.equal(a.unpaidOtherInvoicesCent, 0);
  assert.equal(a.knownMonetaryObligationsCent, 0);
  assert.equal(a.cashCent, E.CFG.startCash - E.CFG.wage);
});

test('korrupte Rechnungen, falsche Schulden und Überlauf werden zurückgewiesen', () => {
  const s = fresh();
  const bad = clone(s);
  bad.companies[0].obligations.push({
    id:'X',kind:'ZINS',priority:3,dueCent:200,paidCent:201
  });
  assert.throws(() => boundaries(bad, 'H1'), /Überzahlung/);
  const badDebt = clone(s);
  badDebt.companies[0].debtCent = -1;
  assert.throws(() => boundaries(badDebt, 'H1'), /Kreditschuld/);
  const badDouble = clone(s);
  badDouble.companies[0].obligations.push({
    id:'T',kind:'TILGUNG',priority:3,dueCent:1000,paidCent:0
  });
  assert.throws(() => boundaries(badDouble, 'H1'), /Tilgung übersteigt/);
  const overflow = clone(s);
  overflow.companies[0].debtCent = Number.MAX_SAFE_INTEGER;
  overflow.companies[0].obligations.push({
    id:'Z',kind:'ZINS',priority:3,dueCent:2,paidCent:0
  });
  assert.throws(() => boundaries(overflow, 'H1'), /Überlauf/);
});

test('Vorratsmengen bleiben auch bei positivem Marktpreis ohne erfundene Bewertung', () => {
  const s = fresh();
  const c = s.claims['BERLIN-1'];
  c.owner = 'H1';
  c.inventoryMilli = 10000;
  c.preparedMilli = 5000;
  const plant = s.refinery.plants.H1.BERLIN;
  plant.built = true;
  plant.productMilli = 9000;
  const a = boundaries(s, 'H1');
  assert.deepEqual(a.physicalButUnvalued, {
    ownedClaims: 1, refineryPlants: 1,
    rawInventoryMilli: 10000, rawPreparedMilli: 5000,
    refinedProductMilli: 9000
  });
  assert.equal(a.totalAssetsCent, null);
  assert.equal(a.totalEquityCent, null);
  assert.equal(a.accountingProfitCent, null);
  assert.equal(a.releaseGate, 'BLOCKED');
});
module.exports = {boundaries};
