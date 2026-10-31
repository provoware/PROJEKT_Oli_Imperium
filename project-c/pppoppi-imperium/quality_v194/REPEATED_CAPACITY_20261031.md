# WIR-02/WIR-03 – zwei echte Kapazitaetsengpaesse in einer 11-Monats-Kette (31.10.2026)

## Ziel, Abgrenzung und Basis
Aufbauend auf [Entwurf #144](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/144), Ausgangs-HEAD `533a071ab174c121fb1142b3ab0ea05ecde99bd6`. Dessen abschliessende Fachpruefung [#41160874995](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41160874995) ist **SUCCESS**; die integrierte Vorrelease-Sperre [#41160874989](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41160874989) ist weiterhin **FAIL/BLOCKED**. Dies ist ein neuer, separater Entwurfszweig; keine Aenderung an Spielkern, `main`, PR #141 oder geschuetzten Originalquellen.

Die neue Pruefung verwendet ausschliesslich echte Aktionen des unveraenderten Spielkerns, keine eingesetzten Anfangsbestands-, Kassen-, Nachfrage- oder Streckenwerte. Zwei Firmen kaufen je ein eigenes Berliner Feld, foerdern je 100 Barrel und nutzen eigene Raffinerien. Je Firma werden 40 Barrel Rohware in zwei verschiedenen Monaten (20+20) transportiert und in vier Chargen zu insgesamt 36 Barrel Fertigware verarbeitet.

## Verbindlicher Ablauf
| Monat | Tatsächliche Aktion / erwartetes Ergebnis |
| --- | --- |
| M1 | Feldkauf, Bohrung, Foerderung, Infrastruktur und je 20 Barrel Rohtransport |
| M2 | Je zwei Raffineriechargen und 18 Barrel Fertigware |
| M3 | Zweiter echter Rohtransport von je 20 Barrel (regional maximal 30 Barrel/Monat); **erster Engpass:** je 18 Barrel angefordert; je 9 angenommen und 9 erstattet; gemeinsames Limit 18 |
| M4 | Gegebenenfalls reale Feldschaeden mit bezahlter Reparatur/Feuerwehr beheben; je zwei weitere echte Raffineriechargen |
| M5 | Je 18 weitere Barrel Fertigware zum Lager; erste je 9 Barrel am Aussenmarkt verkauft |
| M6 | **Zweiter unabhaengiger Engpass:** erneut je 18 angefordert, je 9 angenommen und 9 erstattet; gemeinsames Limit 18 |
| M8 | Automatische Streckensperre, je 9 Barrel voll erstattet; je 9 zuvor angelieferte Barrel verkauft |
| M9 | Eine echte kostenpflichtige Reparatur; je 9 Barrel erneut versendet, keine zweite Reparatur |
| M11 | Je 9 weitere Barrel verkauft; kumuliert je 27 Barrel Aussenmarktverkauf |

**Physische Schlussbilanz je Firma:** 100 Barrel Foerderung = 60 Feldlager + 9 regionales Fertigwarenlager + 27 Aussenmarktverkauf + 4 Raffinerieschwund. Zwei echte Engpassabrechnungen muessen getrennte, monatsgebundene Fracht- und Rueckerstattungsbelege besitzen; bei jeder Buchung gilt Kasse = Anfangskasse + Journal. Doppelte Auftraege werden ohne Zustandsaenderung abgewiesen.

## Automatisierter Nachweis
- Test: `project-c/pppoppi-imperium/quality_v194/test_repeated_capacity_v194.cjs`
- GitHub-Pruefablauf: `.github/workflows/prerelease-repeated-capacity.yml`
- Erwartet: zwei deterministische 11-Monats-Durchlaeufe, 22 simulierte Monate, 44 Firmen-Monatsbilanzen, 42 JSON-Rundlaeufe, 16 Duplikatsperren, 20 erkannte Datenmanipulationen, zwei Fremdaktionssperren und zwei echte Reparaturzahlungen.
- JSON-Ausgabe wird durch GitHub maschinell auf alle Zaehler, Engpassmonate, Verkaufsmenge und Sperrstatus geprueft und als Artefakt aufbewahrt.

**Status bei Erstellung: PENDING.** Erst ein erfolgreich abgeschlossener GitHub-Test auf dem letzten Code- und Dokumentations-HEAD berechtigt zur Kennzeichnung des neuen Teilnachweises als PASS. Syntaxpruefung allein ist kein fachlicher Beweis.

## Verbleibende Pflichten und Grenzen
WIR-02/WIR-03 bleiben **BLOCKED**: Der Test prueft nur zwei wiederholte Engpassmonate und einen begrenzten 11-Monats-Ablauf, keine vollstaendige Endpartie, keine unabhaengige Gewinn-/Anlagen-/Rohstoffbewertung, keinen Kubuntu-Praxistest, keinen historischen C64-Vergleich und keine Rechtefreigabe der Archivmedien. Der Browser-Dateiimport wird von diesem Test nicht beruehrt. Die drei persoenlichen Endabnahmen bleiben bis nach vollstaendig gruenen technischen Pflichtgates und eingefrorenem Kandidaten zurueckgestellt.

## Naechste drei Arbeitsschritte
1. GitHub-Fachpruefung auf dem finalen HEAD auswerten, moegliche Fehler beheben und den JSON-Nachweis verlinken.
2. Wiederholte Engpaesse mit wechselnden Marktpreisen und begrenzter Nachfrage pruefen, einschliesslich kumulierter Umsatz- und Kassenabgleiche.
3. Wirtschaftliche Gewinn-/Vermoegensbewertung und vollstaendige Endspielverlaeufe unabhaengig weiterentwickeln; Rechte/C64-Referenz offen halten.

**DRAFT – kein Merge, kein Release, keine vorgezogene persoenliche Endabnahme.**

## Fehlerkorrektur der Erstpruefung
Der erste GitHub-Lauf [#41165242177](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41165242177) endete mit **FAIL**: Die Testaktion versuchte 40 Barrel Rohtransport in einem Monat, obwohl der unveraenderte Spielkern je Rohstrecke maximal 30 Barrel/Monat zulaesst. Die Testabfolge wurde korrigiert: je 20 Barrel in M1 und M3, ohne Kapazitaetsgrenzen zu umgehen. Die neue CI muss erneut erfolgreich sein; kein PASS aus diesem Fehlversuch.

Der zweite GitHub-Lauf [#41165297209](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41165297209) endete **FAIL** mit `Anlage gestört`: Ein reguläres Spielereignis hatte vor M4 ein Feld beschädigt. Der Test verwendet deshalb vor der zweiten Verarbeitung bei Bedarf die echten kostenpflichtigen Aktionen `FIRE_EXPERT` und `REPAIR`; weder Schaden noch Kontostand werden direkt überschrieben. Neuer GitHub-Lauf erforderlich.
