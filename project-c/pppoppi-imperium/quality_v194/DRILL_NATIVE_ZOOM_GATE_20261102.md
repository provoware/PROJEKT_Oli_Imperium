# BED-03 – Bohrdruckregler bei echtem 175/200-%-Zoom (02.11.2026)

**Spiel:** PPPOPPI IMPERIUM V1.9.4-Pruefschicht / V1.9.3-Kern.
**PR:** https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155
**Ausgangs-HEAD:** `8cd074a4aac8d33e907989e12186963d5fa5ac64`.
**Implementierungs-Commits:** `82a3c6409a52797aaced5cdc7c544a55b6c6ec5f`, `a9c9889bcf861e110b34e696909937395165123d`, `d32edc7b3b09683e4659fb181c654cf1e73a45ba`.
**Status:** technisches Teilpaket; keine Gesamtfreigabe.

## Befund und Wirkung

Der echte 175/200-%-Chromium-Test kontrollierte beim Bohrdruckregler bisher nur
Tab-Erreichbarkeit und `:focus-visible`. Die neue strenge Pruefung von
berechnetem CSS-Fokusring, sichtbarer Trefferflaeche, Verdeckung und
Fokusverlust war im nativen Zoompfad noch nicht verdrahtet. Ein schwer
bedienbarer Regler konnte deshalb als bestanden gelten.

## Aenderungen

- `test_browser_native_zoom_drill_v194.py`: Vor Home und Pfeiltasten
  `assert_pressure_keyboard_ready` statt der beiden schwachen Einzelchecks.
  Der bestehende Helfer prueft echten Tab-Fokus, sichtbaren CSS-Ring,
  Geometrie, Verdeckung und Fokus unmittelbar vor der Eingabe.
- Nach Home und Pfeiltastenfolge wird der echte Reglerfokus erneut geprueft.
  Keine synthetische Fokussetzung, kein Mausklick, kein kuenstliches Scrollen.
- Drei isolierte Strukturregressionen sichern den Aufruf vor der Tasteneingabe,
  das Verbot von Klick-/Fokus-Abkuerzungen und die Fokusnachkontrolle.
- Die beiden unabhaengigen nativen Zoom-Jobs fuehren die Strukturregressionen
  vor der Chromium-Installation aus; danach bleibt der echte Browserlauf Pflicht.
- Unveraendert: 110 geschuetzte Originaldateien, Spielregeln, Speicherformat,
  andere Repositories, main, Vorrelease-Sperre.

## Pruefvertrag (Stand vor dem neuen CI-Abschluss)

| Pflicht | Test | Status |
|---|---|---|
| Strenger Gate vor Home/Pfeilen | drei isolierte AST-Vertragstests | PENDING |
| Echte 175/200-%-Zoomstufen | `test_browser_native_zoom_drill_v194.py` | PENDING |
| 800x600, drei Bohrstufen, Zustand und Export | derselbe Chromium-Pfad | PENDING |
| Unabhaengige Browser-Regressionen | bestehende CI | PENDING |
| Technische Gesamtfreigabe | `prerelease/check.mjs --technical` | BLOCKED |

Die bereits erfolgreichen GitHub-Pruefungen auf dem Ausgangs-HEAD belegen
nicht den neuen HEAD. PASS wird nur nach tatsaechlich abgeschlossenem
GitHub-Job eingetragen. Fehlgeschlagene Schutzpruefungen nicht abschwaechen.

**Gesamtmatrix unveraendert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED
= 52. Weitere dynamische Minispielphasen, Leistungsgrenzen, Archivierung,
Vermoegensbewertung, Medienrechte und C64-Originalvergleich bleiben offen.

## Naechste drei Schritte

1. Beide nativen Zoom-Jobs auf dem neuen HEAD inklusive drei
   Strukturregressionen und echtem Chromium auswerten; FAIL gezielt beheben.
2. Uebrige Browser-CI und die harte Freigabesperre kontrollieren;
   PASS/FAIL/BLOCKED mit echten Lauf-Links nachtragen.
3. Weitere unbelegte Minispielphasen inklusive Spielzustand, Speicherung
   und Wiederherstellung bei 800x600 und echtem Zoom absichern.

Persoenliche Sicht-/Kubuntu-Abnahme erst am eingefrorenen Kandidaten.
**Kein Merge, kein Release ohne ausdrueckliche Nutzerfreigabe.**
