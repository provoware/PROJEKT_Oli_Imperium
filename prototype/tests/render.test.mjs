import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPilotCard } from '../navigation.mjs';
import { renderLoadFailure, renderLoadingState, renderPilotControls, renderPilotScreen } from '../ui/render.mjs';

const contract = JSON.parse(readFileSync(new URL('../../data/contract.json', import.meta.url), 'utf8'));

class TestElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.handlers = {};
    this._text = '';
    this.tabIndex = null;
  }
  set textContent(text) {
    this.children = [];
    this._text = String(text);
  }
  get textContent() {
    return this._text + this.children.map((child) => child.textContent).join('');
  }
  append(...nodes) { this.children.push(...nodes); }
  addEventListener(name, callback) { this.handlers[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  click() { this.handlers.click?.(); }
}
const fakeDocument = {
  createElement: (tag) => new TestElement(tag),
  createDocumentFragment: () => new TestElement('#fragment'),
};
function findByTag(node, tag) {
  return [node, ...node.children.flatMap((child) => findByTag(child, tag))]
    .filter((item) => item.tagName === tag);
}

describe('HTML-Ansicht: Trennung von Forschungsdaten, Texten und DOM', () => {
  it('zeigt offene Originalfragen und Regelstatus anstatt behaupteter Originaltreue', () => {
    const screen = renderPilotScreen(fakeDocument, getPilotCard(contract, 'SCREEN-001'));
    assert.match(screen.textContent, /KEIN Original-Screenshot/);
    assert.match(screen.textContent, /REGEL-002/);
    assert.match(screen.textContent, /Q-001/);
    assert.match(screen.textContent, /nicht nachgewiesen/);
    assert.equal(findByTag(screen, 'h2').length, 1);
  });

  it('setzt unvertrauenswürdige Titel als reinen Text statt ausführbare Elemente ein', () => {
    const data = structuredClone(contract);
    data.screens[0].title = '<script>alert(1)</script>';
    const screen = renderPilotScreen(fakeDocument, getPilotCard(data, 'SCREEN-001'));
    assert.match(screen.textContent, /<script>alert\(1\)<\/script>/);
    assert.equal(findByTag(screen, 'script').length, 0);
  });

  it('übernimmt nur https-Quellen und verwirft gefährliche Verknüpfungen', () => {
    // Rendererschutz isoliert prüfen: Der vorgeschaltete Datenwächter
    // blockiert solche Quelllinks bereits beim Laden.
    const card = getPilotCard(contract, 'SCREEN-001');
    card.sources = card.sources.map((source, index) => index === 0
      ? { ...source, url: 'javascript:alert(1)' } : source);
    const screen = renderPilotScreen(fakeDocument, card);
    const anchors = findByTag(screen, 'a');
    assert.ok(anchors.length > 0);
    assert.ok(anchors.every((item) => item.href.startsWith('https://')));
    assert.match(screen.textContent, /Quellenlink ungültig/);
  });

  it('baut echte Buttons mit nutzbarer Aktion und ignoriert unbekannte Aktionen', () => {
    const selected = [];
    const buttons = renderPilotControls(fakeDocument, ['to-map', 'bogus', 'to-office'],
      (action) => selected.push(action));
    const children = findByTag(buttons, 'button');
    assert.equal(children.length, 2);
    assert.match(children[0].textContent, /Entwurf/);
    children[0].click();
    children[1].click();
    assert.deepEqual(selected, ['to-map', 'to-office']);
  });

  it('zeigt beim Laden ausschließlich einen nicht-interaktiven Status an', () => {
    const loading = renderLoadingState(fakeDocument);
    assert.equal(loading.tagName, 'p');
    assert.match(loading.textContent, /nicht verfügbar/);
    assert.equal(findByTag(loading, 'button').length, 0);
  });
  it('zeigt bei fehlenden Daten verständlichen Text an', () => {
    const message = renderLoadFailure(fakeDocument);
    assert.equal(message.tagName, 'p');
    assert.match(message.textContent, /nicht geladen/);
  });
});
