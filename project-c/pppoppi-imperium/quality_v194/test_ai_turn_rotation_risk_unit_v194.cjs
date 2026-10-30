'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compareFirm, countOutcomes, verifyMetrics, analyze } = require('./test_ai_turn_rotation_risk_v194.cjs');

const fixed = {
  id: 'A1', startNetCent: 1000, finalNetCent: 900, finalCashCent: 1000,
  finalDebtCent: 100, liquidNetChangeCent: -100, finalFields: 1,
  rescueCount: 0, maximumNetDrawdownCent: 150, monthsBelowProfileBuffer: 2
};
const rotated = {
  ...fixed, finalNetCent: 800, finalCashCent: 1050, finalDebtCent: 250,
  liquidNetChangeCent: -200, finalFields: 2, rescueCount: 1,
  maximumNetDrawdownCent: 300, monthsBelowProfileBuffer: 4
};

test('field gain may coincide with worse liquidity, debt and drawdown', () => {
  const result = compareFirm(fixed, rotated);
  assert.deepEqual(result, {
    id: 'A1', deltaFields: 1, deltaLiquidNetCent: -100,
    deltaFinalCashCent: 50, deltaDebtCent: 150, deltaRescues: 1,
    deltaDrawdownCent: 150, deltaMonthsBelowBuffer: 2
  });
  assert.deepEqual(countOutcomes([result]), {
    comparisons: 1, moreFields: 1, fewerFields: 0,
    worseLiquidity: 1, betterLiquidity: 0, moreDebt: 1, moreRescues: 1,
    higherDrawdown: 1, moreMonthsBelowBuffer: 1,
    moreFieldsButWorseLiquidity: 1, moreFieldsAndMoreDebt: 1
  });
});

test('reject inconsistent cash/debt and fabricated net changes', () => {
  assert.throws(() => compareFirm(fixed, { ...rotated, finalCashCent: 1100 }),
    /cash minus debt identity/);
  assert.throws(() => compareFirm(fixed, { ...rotated, liquidNetChangeCent: 0 }),
    /net change identity/);
  assert.throws(() => compareFirm(fixed, { ...rotated, startNetCent: 2000,
    liquidNetChangeCent: -1200 }), /different starting liquidity/);
});

test('reject unsafe amounts and invalid report structure', () => {
  assert.throws(() => compareFirm(fixed, { ...rotated, finalDebtCent: Number.MAX_SAFE_INTEGER + 1 }),
    /unsafe or missing/);
  assert.throws(() => compareFirm(fixed, { ...rotated, rescueCount: -1 }),
    /negative rescueCount/);
  assert.throws(() => analyze({ schema: 'incorrect', rows: [], comparisons: [] }));
});

test('reject equally shifted group totals and inconsistent field distributions', () => {
  const firms = [fixed, { ...fixed, id: 'A2', finalFields: 0 },
    { ...fixed, id: 'A3', finalFields: 2 }];
  const metrics = {
    totalFields: 3, minimumFields: 0, maximumFields: 2, fieldRange: 2,
    zeroFieldFirms: 1, totalLiquidNetChangeCent: -300,
    minimumLiquidNetChangeCent: -100
  };
  assert.deepEqual(verifyMetrics({ firms, metrics }), metrics);
  assert.throws(() => verifyMetrics({ firms, metrics: { ...metrics, totalFields: 4 } }),
    /aggregate metric mismatch: totalFields/);
  assert.throws(() => verifyMetrics({ firms, metrics: { ...metrics, zeroFieldFirms: 0 } }),
    /aggregate metric mismatch: zeroFieldFirms/);
  assert.throws(() => verifyMetrics({ firms, metrics: { ...metrics,
    totalLiquidNetChangeCent: -299 } }), /aggregate metric mismatch: totalLiquidNetChangeCent/);
  assert.throws(() => verifyMetrics({ firms: [firms[0], firms[0], firms[2]], metrics }),
    /invalid company IDs/);
});
