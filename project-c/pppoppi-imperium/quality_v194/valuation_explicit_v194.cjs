'use strict';
// Opt-in evaluation for the PPPOPPI adaptation, NOT the historic C64 engine.
// All monetary amounts are safe integers (Cent); absent valuations never become zero.
const KEYS=['cashCent','receivablesCent','inventoryCent','fixedAssetsCent',
  'loanPrincipalCent','unpaidOtherInvoicesCent','revenueCent',
  'materialExpenseCent','operatingExpenseCent','interestExpenseCent',
  'contractPenaltyExpenseCent','depreciationExpenseCent'];
const ASSETS=['cashCent','receivablesCent','inventoryCent','fixedAssetsCent'];
const LIABILITIES=['loanPrincipalCent','unpaidOtherInvoicesCent'];
const EXPENSES=['materialExpenseCent','operatingExpenseCent',
  'interestExpenseCent','contractPenaltyExpenseCent','depreciationExpenseCent'];
function calculate(input) {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw Error('Eingabe muss ein Objekt sein');
  const data={};
  const missing=[];
  for(const key of KEYS){
    const value=input[key];
    if(value===undefined || value===null){missing.push(key);continue;}
    if(!Number.isSafeInteger(value)||value<0)throw Error('Unzulässiger Cent-Wert: '+key);
    data[key]=BigInt(value);
  }
  const scope='pppoppi-adaptation/explicit-valuations-only';
  if(missing.length)return {scope,status:'NOT_COMPUTABLE',missing,
    totalAssetsCent:null,totalLiabilitiesCent:null,totalEquityCent:null,accountingProfitCent:null};
  const sum=keys=>keys.reduce((s,k)=>s+data[k],0n);
  const assets=sum(ASSETS),liabilities=sum(LIABILITIES);
  const equity=assets-liabilities,profit=data.revenueCent-sum(EXPENSES);
  // BigInt prevents intermediate overflow; never return rounded unsafe JS numbers.
  const safe=(n,key)=>{if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER))
    throw Error('Berechnungsüberlauf: '+key);return Number(n);};
  return {scope,status:'CALCULATED_FROM_EXPLICIT_INPUTS',
    missing:[],totalAssetsCent:safe(assets,'Aktiva'),
    totalLiabilitiesCent:safe(liabilities,'Verbindlichkeiten'),
    totalEquityCent:safe(equity,'Eigenkapital'),
    accountingProfitCent:safe(profit,'Gewinn'),
    // This function does not infer valuation, payment timing or C64 rules.
    releaseGate:'BLOCKED'};
}
module.exports={calculate,KEYS};
