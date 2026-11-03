# Luna v44 – OCR-Arbeitsablauf und Sprachqualität (15.10.2026)

**Geltung: ausschließlich Luna-Staging.** RZSN-Home, privater Worker, D1 und echte Screenshotdaten bleiben unverändert.

## Umgesetzt
1. **OCR nacheinander prüfen:** Nach erfolgreicher, ausdrücklich bestätigter Korrektur wird der nächste noch gefilterte Fall geöffnet und per Tastatur fokussiert. Ist die Liste leer, wird der Abschlussstatus fokussiert. Suche und Filter bleiben erhalten.
2. **Fehler ohne Rechteverlust:** Schlägt die Speicherung fehl, werden die vorherigen Disabled-Zustände der Buttons unverändert wiederhergestellt. Ein Fall ohne Originalbild kann nicht plötzlich freigegeben werden. Es gibt weiterhin keine automatische OCR-Bestätigung.
3. **Mobil kompakter:** Vollbreite Suche, drei optionale Filter unter einem lokalisierten Filter-Aufklapper, doppelten Belegstatistik-Text entfernt; kleine Platzhalter nur für Fälle ohne Originalbild. Nach belegter Bildzuordnung aktualisiert sich der Bildstatus.
4. **15-Sprachen-Terminologie:** Korrigierte Schild-Erinnerungen, die fälschlich „Verpflichtung unterschreiben“ bedeuteten; offene OCR-Prüffälle wurden fälschlich als Software-Testfälle bezeichnet. Semantische Korrekturen in 13 zusätzlichen Sprachen für Review-Zähler, zusammengesetzte VS-Hinweise, Power, Kills, Offiziersränge. Deutsch/Englisch weiter Referenz. Private Spielernamen, Beträge und Quellbelege werden nie automatisch übersetzt.
5. **Berichtsentwürfe:** In v43 entfernte Chat- und Mailberichte bleiben ausgeblendet. Keine Erweiterung von Desert Storm/Städte-Tracking.

## Prüfumfang
Vorher v43: 204/204 Tests, 344 öffentliche Dictionary-Keys in 15 Sprachen, 90 öffentliche Sprachrouten, 210 synthetische Admin-Ansichten. V44: neue Golden-Tests für alle 15 Sprachen sowie OCR-Fehler-/Focus-/Filter-/Bildstatus-Regressionen. Vollständige Testzahlen nach Asset-Versionierung und Live-Prüfung nachtragen.

Lokaler, synthetischer R4-Browsertest bei 390px: OCR-Fälle geladen; kein Dokument-X-Überlauf; Fälle ohne Originalbild können nicht freigegeben werden. Nicht als echte Cloudflare-Authentifizierung ausgeben. Ein zusätzliches eigenes CDP-Testskript setzte andere Sprachen nicht wirksam über die Website-Sprachsteuerung (die Anzeige blieb de); daher ist es KEIN Browser-Nachweis für die übrigen Sprachen. Die lokalen Wörterbuch- und DOM-Tests sichern die überarbeiteten Übersetzungen ab.

## Offene Abnahme (maximal 5)
1. Echte R4/R5-Offiziere: VS, Spenden und OCR-Originalbilder pro Spieler und Zeitstempel prüfen, sichern, neu laden, Admin-Log verifizieren.
2. Authentifizierung/Registry/D1-Backups im getrennten Worker sicherheitstechnisch prüfen.
3. Echtes iPhone Safari/Touch/VoiceOver in 320–430px inklusive arabischer Rechts-nach-links-Ansichten.
4. Muttersprachliche Redaktion sämtlicher langer Guides/Formulare für alle 15 Sprachen.
5. Neuen Offizieren Aufgaben, Zug, VS, OCR und Spielerakte ohne Anleitung vorführen lassen; verbleibende visuelle Inkonsistenzen anhand realer Nutzerbeobachtung konsolidieren.

**Wichtig:** Auch mit grünen Tests keine allgemeine 9,5/10-Bewertung, solange diese fünf Nachweise fehlen.

## Versionsnachweis
**Verifiziert:** Luna v44 Version 2026-10-15.44; Code-Commit 27cc2cd43dfdaade3916ef49f402e822cfa873f9 auf main. GitHub Pages HTML und assets/config.js lieferten jeweils HTTP 200 und die neue Versionsnummer; Remote-main zeigte denselben Code-Commit. Nach atomarer Asset-Stempelung (51 JS-Module) bestanden npm test **209/209**, npm run lint (344 Übersetzungsschlüssel × 15 Sprachen, Syntax und verschlüsselte Admin-Trennung) sowie git diff --check. Keine produktiven RZSN-Änderungen. Der folgende Dokumentationscommit ändert keine Anwendungsmodule.
