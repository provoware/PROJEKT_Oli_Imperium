# Vorrelease-Teilpaket: Dialogkopf nach Bohrstufe 3 bei echtem Zoom · 02.11.2026

**Spiel:** PPPOPPI IMPERIUM V1.9.4 · **Entwurf:** [PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **Ausgangs-HEAD:** `d4626457516a5f968462a1d1341806b2804bcced` · **keine Freigabe**.

## Reproduzierbarer Ausgangsbefund

[Browser-Gesamtprüfung #41473770623](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41473770623) auf `10576a684f1532dbaab28177c51f984928cd89b6`: zwei native Zoomjobs **FAIL** nach Bohrstufe 3. `#closeBtn` war trotz echtem Tab-Fokus außerhalb des 800×600-Browserfensters (rectTop=-1012, rectBottom=-975, viewportHeight=343). Der schmale Technikdialog hatte `.dhead{position:static}` und verlor dadurch seinen Schließen-Knopf beim Scrollen. Der dritte FAIL im selben Lauf betraf `#startGame`: `:focus-visible` war wahr, aber der berechnete CSS-Ring fehlte.

## Korrektur und unabhängige Diagnose

- Nur im manifestgeprüften **abgeleiteten** Technikaufbau: schmalen Dialogkopf kompakt und `position:sticky` halten, mit 84px Scrollabstand für Tastaturziele. Szenennavigation und KI-Bedienelement bleiben im normalen Dokumentfluss.
- Der vorhandene echte 175/200-%-Chromium-Bohrtest verlangt nun ausdrücklich einen klebenden Dialogkopf **und** anschließend die bereits strengen Tab-, Fokusring-, Sichtbarkeits-, Verdeckungs- und Enter-Prüfungen für `#closeBtn`. Keine künstliche Fokussetzung oder programmatisches Scrollen.
- Bei fehlendem CSS-Fokusring werden zusätzlich tatsächliche `outlineStyle`, `outlineWidth`, `outlineColor`, `boxShadow` und aktives Element ausgegeben. Die harte Sperre bleibt unverändert.
- Keine Änderung an den 110 manifestgeschützten Spielquellen, Spielregeln oder Spielständen.

## Prüfstatus

- [Rohrnetz-/Feuerwehr-CI #41483219789](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41483219789) auf Ausgangs-HEAD `d4626457516a5f968462a1d1341806b2804bcced`: **PASS** (Syntax, zehn Negativtests, Browserkampagne).
- Neuer Browser-Gesamtlauf mit beiden nativen Zoomjobs auf dem **neuen Commit: PENDING**; ein tatsächlicher Browser-PASS wird erst nach grüner GitHub-CI behauptet.
- **Zusätzlicher Fokusfehler `#startGame`: BLOCKED** bis zur Auswertung der neuen CSS-Diagnose und Korrektur der Ursache. Die CSS-Fokusprüfung bleibt streng.

**Gesamtmatrix unverändert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Kein Merge, kein Release; persönliche Endabnahme erst nach vollständig grünem, eingefrorenem Kandidaten.

**Nächste Schritte:** (1) Native 175/200-%-Bohrtests und vollständigen Browser-Rundlauf auf neuem HEAD auswerten; (2) falls der Dialogkopf weitere Ziele überdeckt, echte Tastaturgeometrie gezielt korrigieren; (3) CSS-Diagnose für `#startGame` auswerten und die eigentliche Ursache beheben.
