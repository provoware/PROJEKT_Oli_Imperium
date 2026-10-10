import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function token(name) {
  const match = css.match(new RegExp('--' + name + '\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;'));
  assert.ok(match, 'Farbtoken fehlt: ' + name);
  return match[1];
}
function luminance(color) {
  const hex = color.replace('#', '');
  const rgb = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(first, second) {
  const [brighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (brighter + 0.05) / (darker + 0.05);
}

describe('C0 – automatisch prüfbare Grundkontraste und Tastaturhinweise', () => {
  const pairs = [
    ['Standardtext auf Seitenhintergrund', token('text'), token('bg')],
    ['Standardtext in Inhaltspanels', token('text'), token('panel')],
    ['Lesbare Zusatzinformationen', token('muted'), token('panel')],
    ['Quellenlinks auf Seitenhintergrund', token('accent'), token('bg')],
    ['Warnhinweis im Inhaltspanel', token('warning'), token('panel')],
  ];
  for (const [label, foreground, background] of pairs) {
    it(label + ': mindestens WCAG AA 4,5:1', () => {
      assert.ok(contrast(foreground, background) >= 4.5,
        label + ': Kontrast ' + contrast(foreground, background).toFixed(2));
    });
  }

  it('Buttons besitzen mindestens AA-Kontrast', () => {
    const buttonRule = css.match(/button\s*\{([^}]*)\}/s);
    assert.ok(buttonRule);
    const background = buttonRule[1].match(/background:\s*(#[0-9a-fA-F]{6})/);
    assert.ok(background, 'Button-Hintergrund muss ausdrücklich gesetzt sein.');
    assert.ok(contrast(token('text'), background[1]) >= 4.5);
  });
  it('Tastaturfokus ist sichtbar und von der Hintergrundfarbe unterscheidbar', () => {
    assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px\s+solid\s+var\(--warning\)/s);
    assert.ok(contrast(token('warning'), token('bg')) >= 3);
  });
  it('Buttons haben Mindesthöhe 44 Pixel und schmale Ansicht nutzt eine Spalte', () => {
    assert.match(css, /button\s*\{[^}]*min-height:\s*44px/s);
    assert.match(css, /@media\s*\(max-width:\s*750px\)/);
    assert.match(css, /\.layout\s*\{\s*grid-template-columns:\s*1fr/);
    assert.match(html, /name="viewport"\s+content="width=device-width, initial-scale=1"/);
  });
});
