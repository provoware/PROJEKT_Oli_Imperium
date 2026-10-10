#!/usr/bin/env node
/**
 * Echte Chrome-Tastaturbedienung via Chrome DevTools Protocol.
 *
 * Benötigt nur Node.js >=22, Chrome/Chromium und lokalen HTTP-Server.
 * Kein Playwright, keine Cloud, keine Tests historischer C64-Eingaben.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_TO_TEST = process.env.OLI_C0_URL ?? 'http://127.0.0.1:8768/prototype/';
const BROWSER = process.env.OLI_CHROME ?? process.env.CHROME_BIN ?? 'google-chrome';
const timeoutMs = 25000;
const deadline = Date.now() + timeoutMs;
const profile = mkdtempSync(join(tmpdir(), 'oli-c0-keyboard-'));
let browser;
let ws;
const pending = new Map();
let sequence = 0;
let progress = 0;
let stderr = '';

function assert(condition, description) {
  if (!condition) throw new Error(description);
  progress += 1;
}

async function until(fn, message) {
  while (Date.now() < deadline) {
    try {
      const result = await fn();
      if (result) return result;
    } catch {
      // Chrome may not yet have opened the debugging port.
    }
    await sleep(100);
  }
  throw new Error('Zeitüberschreitung: ' + message + ' · ' + stderr.slice(-350));
}
function command(method, params = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error('Chrome-Diagnoseverbindung nicht aktiv: ' + method));
  }
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Chrome antwortet nicht: ' + method));
    }, 8000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error('Browser-Auswertung fehlgeschlagen: ' +
      (result.exceptionDetails.text ?? expression));
  }
  return result.result?.value;
}
async function press(key) {
  const code = key === 'Tab' ? 'Tab' : 'Enter';
  const virtualKey = key === 'Tab' ? 9 : 13;
  const args = { type: 'keyDown', key, code, windowsVirtualKeyCode: virtualKey,
    nativeVirtualKeyCode: virtualKey };
  await command('Input.dispatchKeyEvent', args);
  await command('Input.dispatchKeyEvent', { ...args, type: 'keyUp' });
  await sleep(45);
}
async function main() {
  if (!URL_TO_TEST.startsWith('http://127.0.0.1:')) {
    throw new Error('Nur der eigene lokale HTTP-Server ist erlaubt.');
  }
  browser = spawn(BROWSER, [
    '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
    '--user-data-dir=' + profile, '--window-size=1280,800', URL_TO_TEST,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  browser.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-5000); });
  browser.on('error', error => { stderr = error.message; });

  const port = await until(() => {
    try {
      const first = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      return /^\d+$/.test(first) ? Number(first) : null;
    } catch { return null; }
  }, 'Chrome-Diagnoseport');

  const tab = await until(async () => {
    const response = await fetch('http://127.0.0.1:' + port + '/json/list');
    const tabs = await response.json();
    return tabs.find(x => x.type === 'page' &&
      x.url.startsWith(URL_TO_TEST) && x.webSocketDebuggerUrl);
  }, 'Browserseite');

  ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const call = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(call.timer);
    if (message.error) call.reject(new Error(JSON.stringify(message.error)));
    else call.resolve(message.result ?? {});
  });
  await until(() => ws.readyState === WebSocket.OPEN, 'Diagnoseverbindung');
  await command('Runtime.enable');

  await until(async () => evaluate(
    "document.querySelector('#pilot-status')?.textContent.includes('Testbasis bereit')"
  ), 'HTML-Testbasis geladen');
  assert(await evaluate("document.activeElement?.tagName === 'BODY'"),
    'Erster Tastaturfokus beginnt vor den Bedienelementen');
  const order = [
    "document.activeElement?.matches('a.skip-link')",
    "document.activeElement?.id === 'reload-contract'",
    "document.activeElement?.closest('#pilot-controls') !== null",
    "document.activeElement?.id === 'download-trace'",
    "document.activeElement?.id === 'download-comparison'",
    "document.activeElement?.closest('aside.side-panel') !== null",
  ];
  for (const [index, expected] of order.entries()) {
    await press('Tab');
    assert(await evaluate(expected), 'Echter TAB-Schritt ' + (index + 1) +
      ' beachtet Bedien- und Lesereihenfolge');
    assert(await evaluate("getComputedStyle(document.activeElement).outlineStyle !== 'none'"),
      'Sichtbarer Fokusrahmen bei TAB ' + (index + 1));
  }
  // Shift+Tab zurück bis zum technischen Navigationsbutton.
  for (let i = 0; i < 3; i += 1) {
    await command('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Tab', code: 'Tab',
      windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8,
    });
    await command('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Tab', code: 'Tab',
      windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8,
    });
  }
  assert(await evaluate("document.activeElement?.closest('#pilot-controls') !== null"),
    'Umschalt+Tab führt zum Navigationsbutton zurück');
  await press('Enter');
  assert(await evaluate("document.querySelector('#pilot-view h2')?.textContent.includes('Weltkarte')"),
    'Eingabetaste aktiviert echte Navigation zur Weltkarte');
  assert(await evaluate("document.activeElement === document.querySelector('#pilot-view h2')"),
    'Nach Enter Fokus auf neuer Bildschirmüberschrift');
  assert(await evaluate("document.querySelector('#pilot-trace-list')?.textContent.includes('Schritt 1')"),
    'Echte Tastaturaktion wird im Testprotokoll erfasst');

  await command('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await sleep(150);
  const mobile = await evaluate(`(() => {
    const main = document.querySelector('main.main-panel').getBoundingClientRect();
    const sidebar = document.querySelector('aside.side-panel').getBoundingClientRect();
    const first = document.querySelector('#pilot-controls button').getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      mainY: main.top, sidebarY: sidebar.top, firstY: first.top,
    };
  })()`);
  assert(mobile.viewport <= 400 && mobile.overflow <= 2,
    'Reale Chrome-Mobilansicht ohne horizontalen Überlauf');
  assert(mobile.mainY < mobile.sidebarY,
    'Mobiler Pilot sichtbar vor der Forschungsseitenleiste');
  assert(mobile.firstY >= 0 && mobile.firstY < 844,
    'Mobiler Navigationsbutton ohne tiefes Scrollen erreichbar');

  console.log('CHROME_C0_KEYBOARD_PASS – ' + progress +
    ' echte Tastatur-, Fokus- und Mobilprüfungen.');
}

try {
  await main();
} catch (error) {
  console.error('CHROME_C0_KEYBOARD_FAIL – ' + error.message);
  process.exitCode = 1;
} finally {
  for (const call of pending.values()) {
    clearTimeout(call.timer);
    call.reject(new Error('Chromium geschlossen.'));
  }
  pending.clear();
  if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  if (browser) browser.kill('SIGKILL');
  rmSync(profile, { recursive: true, force: true });
}
