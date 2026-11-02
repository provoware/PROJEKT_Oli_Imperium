# Spielende: Regelentscheidung und technische Grenzfaelle

**Stand: 26.10.2026 – Vorrelease weiterhin gesperrt.** Dieses Dokument betrifft nur die eigenstaendige PPPOPPI-Adaption (Projekt C), **nicht** die historischen C64-Regeln. Die 110 geschuetzten Quelldateien bleiben unveraendert.

## Gesicherter Ausgangsbefund

- Basis: [Entwurfs-PR #66](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/66), HEAD `e025616bf3089b53a7b22f1de3cb241629d948f5`; `main` bei der Vorpruefung `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Der unveraenderte V0.8.2-Kern akzeptiert `TURN`, `RESCUE`, `REPORT`, aber keinen Sieg- oder Niederlagenzustand. Das technische Monatslimit ist **100000**. Es ist **keine** Spielregel fuer ein regulaeres Ende.
- Ein 240-Monats-Lauf mit zwei Menschen und echten Sanierungen beweist Spielbarkeit ueber diesen Zeitraum, nicht den Abschluss einer Partie. Siehe `ENDSTATE_AUDIT_20261026.md`.

## Vorschlag fuer den fachlichen Regelvertrag (noch NICHT implementiert oder freigegeben)

**Modus A – Freies Wirtschaftsspiel:** Kein automatischer Sieger. Die Partie kann freiwillig beendet werden. Eine bewusste Aktion `PARTIE_BEENDEN` muss mit Sicherheitsabfrage, Abschlussbericht und anschliessend unveraenderbarem Archivstand definiert werden. Dies ist keine Niederlage.

**Modus B – Zeitlich begrenzte Kampagne:** Die Laufzeit wird beim Start gewaehlt und im Spielstand festgehalten. Bei Ablauf erfolgt eine nachvollziehbare Endabrechnung. Ein Gleichstand wird als solcher ausgewiesen, statt heimlich einen Sieger zu bestimmen. Die Wertung darf nicht allein Bargeld betrachten, sondern muss Verbindlichkeiten, Anlagenwerte und offene Forderungen fachlich definiert beruecksichtigen. **Laufzeit, Bewertungsformel und Gleichstandsregeln sind noch offene fachliche Entscheidungen; es gibt hier bewusst keine erfundenen Zahlen.**

**Insolvenz:** Eine erfolgreiche Sanierung setzt die Partie fort. Ob wiederholte Insolvenz zum Ausscheiden fuehrt, muss getrennt entschieden werden; der bisherige `RESTART` ist kein automatischer Niederlagenbeweis. Bei mehreren Firmen sind Ausscheiden einer Firma und Ende der gesamten Partie zu unterscheiden.

## Verbindliche technische Bedingungen vor einer Implementierung

1. Die neuen Endzustandswerte, Endgrund, Wertung, Gewinner und Regelversion muessen eindeutig im **neuen** Spielstandschema definiert sein; bestehende `0.8.2`-Spielstaende werden nicht stillschweigend umgedeutet.
2. Abschlusstransitionen muessen **idempotent** sein: derselbe Befehl darf keine zweite Buchung erzeugen. Im Endzustand sind Wirtschaftsaktionen gesperrt; Export und lesende Auswertung bleiben moeglich.
3. Mehrere Menschen/KI-Firmen, Rettung im letzten Monat, Gleichstand, Abbruch, doppelter Abschluss, Altspielstandimport und Wiederherstellung muessen mit echten Browserpartien geprueft werden.
4. Abschlussbericht und Speicherdatei muessen nach Browser-Neustart dieselbe Rangfolge und dieselben Geldwerte ergeben. Kein automatisches Freigeben von `VER-01` oder `VER-02` durch einen isolierten Engine-Test.
5. Die Spielregelentscheidung wird als Projekt-C-Adaption dokumentiert. Historische Originaltreue bleibt bis zum unabhaengigen Originalvergleich ungeprueft.

## Dieses Pflichtpaket: reproduzierbare Grenzfallregression

`node project-c/pppoppi-imperium/quality_v194/test_endstate_boundaries_v194.cjs`

Der neue Test prueft einen unzulaessigen Spielerzug ohne Datenveraenderung, eine doppelte Befehlskennung ohne Doppelbuchung, den JSON-Rundlauf am Monatsbericht sowie einen **explizit synthetischen** letzten zulaessigen Monat 100000. Ein weiterer Monatswechsel muss kontrolliert scheitern und den letzten gueltigen Stand erhalten. Eine erfundene `FINISHED`-Phase muss die aktuelle Validierung ablehnen. Der Test ist kein natuerlicher Langzeitlauf und keine Endzustandsimplementierung.

## Pflichtmatrix / offene Arbeit

- `VER-01` **BLOCKED**: Kein regelkonformer Sieg-/Endpfad.
- `VER-02` **BLOCKED**: Insolvenz und Rettung vorhanden, Niederlage/Ausscheiden noch nicht spezifiziert.
- `FEH-02` **BLOCKED**: Monatslimit technisch geprueft, fachlich gueltiger letzter Spielmonat offen.
- `SPE-02`, `SPE-03`, `BED-02`, `BED-03` bleiben ebenfalls ohne Gesamtnachweis gesperrt.
- Gesamtmatrix unveraendert: **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED**.

## Naechste drei Pflichtschritte

1. CI auf dem finalen Zweig-HEAD kontrollieren und etwaige Fehler korrigieren.
2. Endregelvertrag fuer Projekt C mit expliziten Zahlen, Bewertungsformel und Versionierung vervollstaendigen; erst dann die Spielende-Logik in der getrennten Technikfassung implementieren.
3. Danach Browser-Endpartien, Speicherung/Wiederherstellung, 800x600, echten Zoom und alle Tastaturwege pruefen.

**Kein Merge, kein Release. Persoenliche Sichtpruefung und Kubuntu-Endabnahme erst nach allen technischen Pflichtgates und eingefrorenem Kandidaten.**
