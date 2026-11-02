'use strict';
// PR #27 / SIC-01: filename validation in the derived technical import handler.
// Does not touch original sources, users' saves, or the browser filesystem.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {renderPatched} = require('./build.cjs');
const source = renderPatched('src/neo_bridge.js');
const start = source.indexOf('function assertSafeImportFile(file){');
const end = source.indexOf('\nasync function importGame(file)', start);
assert.ok(start >= 0 && end > start, 'Der sichere Dateiimport muss im Technikaufbau vorhanden sein');
const fn = vm.runInNewContext('(' + source.slice(start, end).trim() + ')');
const startImport = source.indexOf('async function importGame(file)', end);
const firstCheck = source.indexOf('assertSafeImportFile(file)', startImport);
const firstRead = source.indexOf('await file.text()', startImport);
assert.ok(startImport >= 0 && firstCheck > startImport && firstRead > firstCheck,
  'Dateiname muss VOR dem Lesen des Dateiinhalts geprueft werden');

let passed = 0;
function valid(name, extra={}) {
  assert.doesNotThrow(() => fn({name, size:42, ...extra}), String(name));
  passed++;
}
function blocked(name, extra={}) {
  assert.throws(() => fn({name, size:42, ...extra}), /Unzulässiger Dateiname/, String(name));
  passed++;
}
valid('PPPOPPI-IMPERIUM-M1.json');
valid('Spielstand_Änderung.json');
valid('save.JSON');
valid('backup.json', {webkitRelativePath: ''});
blocked('../save.json');
blocked('private/secret.json');
blocked('/etc/passwd.json');
blocked('C:\\private\\save.json');
blocked('file://private.json');
blocked('https://domain.invalid/a.json');
blocked('save%2fsecret.json');
blocked('save%2e%2e.json');
blocked('.hidden.json');
blocked('save..json');
blocked('save?.json');
blocked('save#x.json');
blocked('evil\u202ename.json');
blocked('evil\u2215name.json');
blocked('evil\x00name.json');
blocked('evil\nname.json');
blocked('bad.txt');
blocked('');
blocked('a'.repeat(181)+'.json');
blocked('valid.json', {webkitRelativePath:'nested/valid.json'});
console.log('ERGEBNIS', passed, '/', passed, 'Dateinamen-, Traversal- und Import-Vorpruefungen bestanden');
