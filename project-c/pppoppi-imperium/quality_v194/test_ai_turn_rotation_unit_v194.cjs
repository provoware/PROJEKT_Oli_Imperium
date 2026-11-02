'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { orderFor, fieldMetrics } = require('./test_ai_turn_rotation_v194.cjs');

test('three monthly rotations cover each AI exactly once in each slot', () => {
  for (const direction of [-1, 1]) {
    const months = [1, 2, 3].map(month => orderFor(0, direction, month));
    assert.equal(new Set(months.map(x => x[0])).size, 3);
    assert.equal(new Set(months.map(x => x[1])).size, 3);
    assert.equal(new Set(months.map(x => x[2])).size, 3);
    assert.deepEqual(orderFor(0, direction, 4), months[0]);
  }
  assert.deepEqual(orderFor(0, 0, 1), ['A1', 'A2', 'A3']);
  assert.deepEqual(orderFor(1, 0, 12), ['A2', 'A3', 'A1']);
  assert.deepEqual(orderFor(2, 0, 12), ['A3', 'A1', 'A2']);
});

test('reject invalid rotation parameters', () => {
  assert.throws(() => orderFor(-1, 1, 1), /offset/);
  assert.throws(() => orderFor(3, 1, 1), /offset/);
  assert.throws(() => orderFor(0, 2, 1), /direction/);
  assert.throws(() => orderFor(0, 1, 0), /month/);
});

test('field distribution and liquid net are separate, exact-cent metrics', () => {
  const firms = [
    {id:'A1',finalFields:3,liquidNetChangeCent:100},
    {id:'A2',finalFields:1,liquidNetChangeCent:-250},
    {id:'A3',finalFields:0,liquidNetChangeCent:70}
  ];
  assert.deepEqual(fieldMetrics(firms), {
    totalFields:4,minimumFields:0,maximumFields:3,fieldRange:3,
    zeroFieldFirms:1,totalLiquidNetChangeCent:-80,minimumLiquidNetChangeCent:-250
  });
  assert.throws(() => fieldMetrics([...firms.slice(0,2),firms[0]]));
  assert.throws(() => fieldMetrics([...firms.slice(0,2),{...firms[2],finalFields:-1}]), /negative/);
  assert.throws(() => fieldMetrics([...firms.slice(0,2),{...firms[2],liquidNetChangeCent:0.1}]), /unsafe/);
});
