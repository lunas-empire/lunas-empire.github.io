# Luna Empire – UX-Audit und Staging Release Candidate
Datum: 2026-10-15. Scope: **ausschließlich** lunas-empire/lunas-empire.github.io. Produktion rzsn-home.github.io und Worker/D1 nicht geändert.

## Nachweise und Testmethode
Basis: Luna v40 `7971c27`. Live-Website mit echtem headless Chrome/CDP und emulierten Breiten 320, 375, 390, 768, 1365 px (Dark und Light; Routen Heute, Aufgaben, VS, Season, Guides, Admin-Login in definierter Matrix). Original-Bilder und Messwerte lokal in `qa/ux-rc/audit-*.png`, `browser-audit.json`. Vergleich mit lokalem RC in `after-*.png`, `browser-after.json`. Wichtig: erster CLI-Chrome-Screenshot war aufgrund der Headless-Minimalfensterbreite beschnitten, keine bestätigte Site-Überbreite. Browser-CDP zeigt keinen horizontalen **Dokument**-Overflow für geprüfte Kombinationen.

Admin **ohne** echten Offizierscode: Login live visuell überprüft. Dashboard über lokalen Browser mit ausdrücklich **synthetischer** API-Mock-Antwort unter `qa/ux-rc/synthetic-admin-*.png` bei 320/375/390/768/1365 und beiden Themen überprüft. Dies beweist Layout und Interaktionsstruktur, **nicht** Cloudflare-Authentifizierung, reale D1-Mutationen oder echte OCR-Beleg-Zuordnungen.

## Priorisierte Mängel und Entscheidungen

| Priorität | Problem/Ursache | Wirkung | Bearbeitung / verbleibendes Risiko |
|---|---|---|---|
| P1 | 320px Offiziersnavigation: fünffache, gleich breite Buttons drücken „Kommando“ auseinander | Label schwer lesbar | asymmetrisch gewichtete Nav-Spalten plus responsive Umbruch; mobil mit synthetischem Dashboard prüfen |
| P1 | Lange Zeilen in Offiziers-Alerts und VS/Spenden-Miniflächen erben globales `white-space:nowrap` | Einzelwerte/Beschreibungen optisch abgeschnitten | lokale `white-space:normal`-Regeln auf texttragenden Elementen; keine überlaufmaskierenden globalen Workarounds |
| P2 | Today-Kommando-Block wiederholt Titel/Season bereits aus Seitenkopf | visuelle Überladung über dem Tagesfokus | redundant dekorative HUD-Überschrift entfernt; drei Kennzahlen und lokalisiertes ARIA-Label erhalten |
| P2 | Same-day Fortschritt und VS-Tagesminimum doppelt | Nutzer muss identische Daten mehrfach lesen | Fortschritt nur im HUD; Details in Aufgabenroute, VS Minimum dort weiterhin erklärend |
| P2 | Daily officer report in Details innerhalb Details | 2-fache Aufklapphürde | auf genau eine Aufklappebene reduziert, Editier-/Kopierfunktionen erhalten |
| P2 | Anzahl Admin-Aufgaben an mehreren Stellen doppelt | redundanter Informationskopf | Microstat/Quick-Link-Duplikation entfernt; Aufgabenliste mit Anzahl bleibt |
| P1 **offen** | Private Originalbilder, realer OCR-Workflow, alle privilegierten Adminseiten | echte Daten-/Belegintegrität darf nicht inferiert werden | manueller R4/R5-Staging-Abnahmelauf erforderlich; weder Bildbelege erfunden noch bestätigt |
| P1 **offen** | Backend-Registry/Auth-Risiken aus Desktop-PROGRESS (letzter gelesener Stand 13.10.) | möglicher Sicherheits-/Datenkonsistenzblocker | Worker unverändert; aktuellen Backend-Status vor produktiver Freigabe separat prüfen |
| P2 **offen** | 15 Sprachen maschinell validiert, nicht muttersprachlich geprüft | einzelne Formulierungen können unnatürlich/unvollständig sein | nur Vollständigkeit und Syntax als bestanden bewerten |
| P3 **offen** | Historisch gewachsene Spielrahmen, CSS-Varianten und verschachtelte Guides | öffentliche und private Bereiche nicht vollständig aus einem Guss | kein riskanter Last-Minute-Rewrite; später komponentenweise konsolidieren |

## Umgesetzter Dateiumfang
- `assets/app.js`, `assets/overview.css`: öffentliche Today-Informationshierarchie.
- `assets/native-admin.js`: Bericht-Aufklappung, Dashboard-Dopplung.
- `assets/hub.css`: mobile Admin-Text- und Navigationsbreiten; UX-Schaden konkret im Browser beobachtet.
- `tests/overview-dom.test.js`, `tests/tactical-ui.test.js`, `tests/native-officer-ux.test.js`, `tests/native-mobile-wrap.test.js`: Regressionen für entfernte Dopplungen und Umbrüche.
- `assets/config.js`, `index.html`, `service-worker.js`: v41 Version und atomare Asset-Stempelung zur Vermeidung gemischter Offline-Caches.

## Release-Gates
Bis zum Nachweis als **offen** behandeln: letzter vollständiger `npm test`-Lauf; `npm run lint`; `git diff --check`; Build-/Asset-Stamp; Commit/Push nur Luna; GitHub Pages; Live-Smoke; iPhone Safari. Vorläufige Testergebnisse VOR dem Versionswechsel: 178/178 Node-Frontendtests; Validator 344 Keys × 15 Sprachen sowie JS-Syntax und verschlüsselter Admin-Tree.

Echte iPhone-Safari-Touch- und R4/R5-Login-Prüfung nicht durchgeführt. Privates Cloudflare-D1-Backend, OCR-Originale und RZSN-Produktion unangetastet. Es wurde weder eine Datenmigration noch eine Löschung ausgeführt.

## Vorläufige Qualitätsbewertung, vor persönlichem Officer-Login
Visual Design 7/10; UX 6.5/10; Mobile 7/10; Einheitlichkeit 6/10; Datenverständlichkeit 6.5/10; Funktionalität 7/10; Release-Reife 6/10. Diese Werte sind keine vollständige produktive Sicherheits- oder Benutzerabnahme.

## Fünf verbleibende Aufgaben nach Frontend-Staging-RC
1. Privates R4/R5-End-to-End: VS-/Spenden-Beleg je Spieler verifizieren, OCR bearbeiten, speichern, Reload, Rechte und Log.
2. Desktop-Worker-Sicherheits- und D1-Status erneut prüfen, ggf. nach Backup/Restore im separaten Backend-Repository korrigieren.
3. Reale iOS-Safari-Offiziersprobe auf 320/375/390 px, Dark/Light, Eingabe/Touch, korrekte Beleg-Galerie.
4. Übersetzungen Deutsch/Englisch und stichprobenartig alle 15 Sprachen redaktionell testen.
5. Guides, Archiv, Mitglieder und OCR nach echter Admin-Rückmeldung schrittweise visuell vereinheitlichen, ohne Feature-Rewrite.

## Versionsnachweis
**Ergänzen nach Commit und Live-Prüfung.** Ungeprüfte Änderungen niemals als veröffentlicht bezeichnen.
