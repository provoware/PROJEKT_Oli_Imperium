# Teilweise Textüberdeckungen bei echtem Browserzoom – 27.10.2026

**Projekt:** PPPOPPI IMPERIUM, V1.9.4-Prüfschicht über unverändertem V1.9.3-Spielkern. **Kein Vorrelease-Kandidat, kein Merge, kein Release.**

**Basis:** [Entwurfs-PR #83](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/83) bei `22bfa10bfd7133b46421fbf39dcbd338d42a8562`; [Entwurfs-PR #84](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/84), isolierter Zweig `automation/prerelease-partial-text-zoom-20261027-1131`. Der geprüfte `main`-Stand vor der Änderung war `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Problem und technische Änderung

Der bisherige Fließtexttest prüfte pro Absatz nur Mittelpunkte ganzer Textrechtecke. Eine **teilweise** Überdeckung einzelner Wörter konnte dadurch unerkannt bleiben. Der Test `quality_v194/test_browser_native_zoom_flow_v194.py` kontrolliert nun zusätzlich jedes sichtbare Wort über drei horizontale Stichpunkte (25/50/75 % des Wortrechtecks) mit `elementFromPoint`. Eine künstlich erzeugte **Teilüberdeckung** wird als Negativkontrolle ausdrücklich erkannt. Pro Phase werden **vier** um 75 ms getrennte Momentaufnahmen geprüft, statt zwei.

Prüfbereich: sichtbare `p`, `li`, `label`, `blockquote`, `figcaption` in allen 39 registrierten Spielszenen sowie Wirtschaftsbericht, Rohrnetz und Feuerwehr. Ausgangsfenster 800×600, echter Chromium-Tab-Zoom per `chrome.tabs.setZoom/getZoom` auf 175 % und 200 %. Wirtschaftszustand, JavaScript-Fehler und externe HTTP-Anfragen bleiben Teil der vorhandenen Prüfung. Die 110 manifestgeschützten Originaldateien wurden nicht verändert.

**Prüfbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_flow_v194.py`

## Tatsächlich ausgeführte GitHub-Prüfungen

- **Code-HEAD:** `52aa1fd488b9e185d6180311cd361b95e58d9cb9`.
- [Browser-CI #40489364393 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40489364393): gesamter Chromium-Rundlauf erfolgreich, einschließlich der neuen Negativkontrolle und aller Wortstichproben.
- [Quell-/Fachprüfung #40489364408 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40489364408).
- [Pflichtmatrix #40489364377 – erwartetes Gesamtgate BLOCKED](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40489364377): offene Release-Pflichten verhindern die Freigabe.

| Messgröße | 175 % | 200 % |
|---|---:|---:|
| Registrierte Szenen | 39 | 39 |
| Zeitlich getrennte Momentaufnahmen | 196 | 196 |
| Fließtext-Messungen | 624 | 624 |
| Wort-Treffpunkte (keine einzelnen Wörter) | 15.576 | 15.684 |
| Beobachtungen laufender Animationen | 512 | 363 |
| Teilweise verdeckte Textbereiche | 0 | 0 |
| Vollständig verdeckte Wortbereiche | 0 | 0 |
| Abgeschnittene/vollständig verdeckte/unmessbare Fließtexte | 0 | 0 |

**Positiv-/Negativkontrollen:** freier Text erkannt; künstlich teilweise verdeckte Wörter erkannt; künstlich vollständig verdeckter und abgeschnittener Text erkannt. Keine erfundenen oder nur simulierten CI-Ergebnisse.

## Grenzen und offene Pflichten

Die vier Momentaufnahmen sind **keine vollständige Animationsprüfung**. Die Wortprobe erfasst nur drei horizontale Punkte je Wortrechteck, keine pixelgenaue Sichtbarkeit und keine beliebigen Zwischenzeiten. Animationszählungen sind Momentaufnahmen, kein durchgehender Verlauf. Szenen werden über die vorhandene Schnittstelle geöffnet; noch nicht alle Dialog-/Fehleraktionen sind per Tastatur durchgespielt. Vollständige reguläre Sieg- und Niederlagenpartien, Ressourcen-/Rechteprüfung und technische Gesamtfreigabe bleiben offen. **BED-03 und BAR-01 bleiben BLOCKED; 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.**

### Nächste drei Pflichtarbeiten

1. Animationsverläufe vollständig und zeitlich reproduzierbar prüfen, auch Textüberdeckungen zwischen den vier Messpunkten.
2. Verbleibende Dialog- und Fehleraktionen mit Tab/Enter/Escape bei echtem Zoom prüfen.
3. Reguläre Endpartien inklusive Spielstand-Neustart und eindeutiger Sieg-/Niederlagenzustände nachweisen.

**Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach allen eigenständig möglichen Technikprüfungen und eingefrorenem Kandidaten. Release ausschließlich mit ausdrücklicher Nutzerfreigabe.**
