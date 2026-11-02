'use strict';
// Reproduzierbarer Browser-Adapter aus exakt denselben drei geprueften CJS-Modulen.
// Kein eigener zweiter Spielkern, keine Aenderung der Originalquellen.
const fs = require('node:fs');
const path = require('node:path');

const MODULES = Object.freeze([
  'endstate_candidate_v194.cjs',
  'endstate_archive_io_v194.cjs',
  'endstate_session_v194.cjs'
]);

function bundleSource() {
  const source = MODULES.map(name => fs.readFileSync(path.join(__dirname, name), 'utf8'));
  const text = [
    '(function(root) {',
    "'use strict';",
    'const candidate = (() => { const module = {exports: {}};',
    source[0],
    'return module.exports; })();',
    'const io = (() => { const module = {exports: {}};',
    "const require = name => { if (name === './endstate_candidate_v194.cjs') return candidate; throw Error('Unbekannte Browser-Abhaengigkeit: ' + name); };",
    source[1],
    'return module.exports; })();',
    'const session = (() => { const module = {exports: {}};',
    source[2],
    'return module.exports; })();',
    'root.PPPEndstate = Object.freeze({candidate, io, session});',
    '})(window);',
    ''
  ].join('\n');
  // Vor dem Kopieren in die Technikfassung Syntaxfehler erkennen.
  new Function(text);
  return text;
}
module.exports = {MODULES, bundleSource};
