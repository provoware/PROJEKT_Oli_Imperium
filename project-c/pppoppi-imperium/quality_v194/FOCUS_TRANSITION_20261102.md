# Vorrelease-Teilpaket: sichtbarer Tab-Fokusring ohne Übergangsverzögerung · 02.11.2026

**Spiel:** PPPOPPI IMPERIUM V1.9.4 (abgeleitete Offline-Technikvorschau). **Entwurf:** [PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Ausgangs-HEAD:** `e35b76bd7dba4b0664e26626013b18c5a976b3d1`. Kein Release.

## Reproduzierbarer Fehler und technische Ursache

[Browser-Gesamtprüfung #41492796482](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41492796482) ist auf dem Ausgangs-HEAD fehlgeschlagen: `test_browser_native_zoom_flow_v194.py` meldete beim echten Tab-Fokus auf `#startGame` `:focus-visible=true`, aber `outlineWidth=0px`, `boxShadow=none`. Der strenge Test hat die Enter-Aktivierung zu Recht verhindert.

Die Original-CSS-Regel `button:focus-visible` definiert eine 3px-Outline. Gleichzeitig animiert die spezifische Toolbar-Regel mit `transition:.16s` **alle** animierbaren Eigenschaften, also auch `outline-width`. Die CSS-Outline kann unmittelbar nach dem Tab-Fokus noch 0px breit sein. Dies erklärt den Messwert; die Ursache ist mit einem isolierten Chromium-Vergleich nachgestellt, die Wirkung im vollständigen Spiel muss CI erst bestätigen.

## Kleinste Korrektur

- Ausschließlich im manifestgeprüften **abgeleiteten Technikaufbau** ergänzt `build.cjs` eine zusätzliche CSS-Regel: `.toolbar button:focus-visible{transition-property:background-color,border-color}`.
- Der vorhandene 3px-Fokusring erscheint damit unmittelbar; Hintergrund- und Rahmenfarben können weiter animieren. Kein künstliches Fokussieren, kein Scroll-Trick und keine Abschwächung des Fokus-/Geometriegates.
- Eine neue Regression in `test_build_safety_v194.cjs` kontrolliert die genau einmalige Regel, die ursprüngliche Toolbar-Transition und die Unverändertheit der Original-HTML-Datei.
- Keine Änderung an den 110 manifestgeschützten Spielquellen, Spielregeln oder gespeicherten Spielständen.

## Prüfbelege und Grenzen

- **Vorheriger vollständiger GitHub-Browserlauf:** FAIL bei `#startGame` (Link oben); andere Jobs auf dem Ausgangs-HEAD teilweise PASS. Die integrierte Vorrelease-Sperre ist weiterhin bewusst rot.
- **Isolierter lokaler Chromium-Vergleich** mit der relevanten CSS-Kombination und echtem Tab: Original `transition-property=all` mit zunächst nur 2px berechneter Outline; mit neuer Fokusregel sofort 3px und `transition-property=background-color, border-color`. Das ist ein Ursachen-/Wirkungsbeleg, **kein vollständiger Spieltest**.
- **Geänderte Build- und Regressionstests auf GitHub:** noch durch neue GitHub-Actions am endgültigen HEAD zu prüfen. Status bis dahin **PENDING**, nicht PASS.
- Die beiden nativen 175/200-%-Browserpfade, 800×600, Bohrdialog und Spielstandintegrität bleiben verbindliche Prüfungen. Zusätzliche Quellnachweis- und Release-Sperrfehler dürfen nicht als bestanden umgedeutet werden.

**Vorrelease-Pflichtmatrix unverändert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Keine persönliche Sichtprüfung, kein Kubuntu-Endtest, kein Merge und kein Release.

**Nächste konkrete Pflichtarbeit:** (1) aktuelle GitHub-Jobs für Build-Sicherheit und beide nativen Zoompfade auswerten; (2) bei erneutem FAIL die berechneten CSS-Werte und reale Geometrie am endgültigen HEAD untersuchen; (3) anschließend die noch ungetesteten dynamischen Minispielphasen und vollständigen Bedienpfade prüfen.
