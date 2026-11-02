'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {calculate,KEYS}=require('./valuation_explicit_v194.cjs');
const all=()=>Object.fromEntries(KEYS.map(x=>[x,0]));
test('fehlende Vorratsbewertung erzwingt NOT_COMPUTABLE',()=>{
 const o=all();delete o.inventoryCent;
 const v=calculate(o);assert.equal(v.status,'NOT_COMPUTABLE');
 assert.deepEqual(v.missing,['inventoryCent']);assert.equal(v.accountingProfitCent,null);
 assert.equal(v.totalEquityCent,null);
});
test('fehlende Forderung darf nicht mit Null ersetzt werden',()=>{
 const o=all();o.receivablesCent=null;
 assert.equal(calculate(o).totalAssetsCent,null);
});
test('vollständig belegte Beträge liefern Gewinn und Eigenkapital getrennt',()=>{
 const o=all();Object.assign(o,{cashCent:8000,receivablesCent:3000,
 inventoryCent:5000,fixedAssetsCent:10000,loanPrincipalCent:6000,
 unpaidOtherInvoicesCent:1000,revenueCent:11000,materialExpenseCent:2000,
 operatingExpenseCent:3000,interestExpenseCent:400,
 contractPenaltyExpenseCent:100,depreciationExpenseCent:500});
 const v=calculate(o);assert.equal(v.totalAssetsCent,26000);
 assert.equal(v.totalLiabilitiesCent,7000);assert.equal(v.totalEquityCent,19000);
 assert.equal(v.accountingProfitCent,5000);assert.equal(v.releaseGate,'BLOCKED');
});
test('Kreditaufnahme ist gewinnneutral und eigenkapitalneutral',()=>{
 const o=all();const b=calculate(o);
 o.cashCent=5000;o.loanPrincipalCent=5000;
 const a=calculate(o);assert.equal(a.totalEquityCent,b.totalEquityCent);
 assert.equal(a.accountingProfitCent,b.accountingProfitCent);
});
test('Tilgung nicht doppelt: bereits im Kreditkapital enthalten',()=>{
 const o=all();o.loanPrincipalCent=2000;o.unpaidOtherInvoicesCent=300;
 assert.equal(calculate(o).totalLiabilitiesCent,2300);
});
test('negative, gebrochene und überlaufende Eingaben werden abgelehnt',()=>{
 for(const x of [-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'100',true])
 {const o=all();o.cashCent=x;assert.throws(()=>calculate(o),/Cent-Wert/);}
 const o=all();o.cashCent=Number.MAX_SAFE_INTEGER;o.inventoryCent=1;
 assert.throws(()=>calculate(o),/Berechnungsüberlauf/);
});
test('negatives Betriebsergebnis und negatives Eigenkapital bleiben sichtbar',()=>{
 const o=all();o.loanPrincipalCent=150;o.operatingExpenseCent=200;
 const v=calculate(o);assert.equal(v.totalEquityCent,-150);
 assert.equal(v.accountingProfitCent,-200);
});
test('unbekannte Regeln sind keine Freigabe',()=>{
 const o=all();const v=calculate(o);
 assert.equal(v.scope,'pppoppi-adaptation/explicit-valuations-only');
 assert.equal(v.releaseGate,'BLOCKED');
});
