# Zugplanung v52: Pilotfeedback

## Ursache

Die bisherige Ansicht zeigte `train-manager.history` ungefiltert als „Vergangene Züge“. Diese API enthält absichtlich auch geplante und zukünftige Einträge. Dice-Gewinner aus `diceHistory()` standen daneben in einem eigenen, eingeklappten Archiv. Deshalb waren Mittwochseinträge schwer zu finden und zukünftige Fahrten wirkten bereits gefahren.

## Änderung

- `trainTimelineGroups()` prüft echte ISO-Kalendertage und trennt bestätigte vergangene Fahrten, Dice-Gewinner, weitere zukünftige Pläne und offene oder abgesagte Einträge. Gleiche Daten bleiben zwei klar benannte Aktionen. Die gemeinsame vergangene Timeline ist sofort offen, chronologisch und in 20er Schritten paginiert.
- Heute und die nächsten Kalendertermine bleiben oben. Weitere geplante Termine erscheinen in einem eigenen aufklappbaren Bereich; bereits sichtbare Kalendertermine werden dort nicht erneut als Fahrt gezeigt. Vergangene ungeklärte und abgesagte Einträge bleiben erreichbar und bearbeitbar.
- Dice-Gewinne bleiben eigene Aktionen und ändern weder `train-manager.counts` noch Fahrten- oder Fairnesswerte. Namen werden nicht aus Ähnlichkeit zugeordnet. Die Datenquelle und der Worker bleiben unverändert.
- Neue Beschriftungen und der Hinweis zur Fairness sind auf Deutsch und Englisch vorhanden. Die übrigen 13 Offizierssprachen haben ebenfalls eigene Übersetzungen für die neuen Begriffe; Spieler- und Originalnamen bleiben unübersetzt.

## Prüfung

`tests/native-train-timeline-v52.test.js` prüft Datumsgrenzen in Berlin, gemischte Status, Mittwoch-Dice ohne Fahrt, gleiche Daten, 20er Pagination und den angemeldeten DOM-Ablauf mit synthetischen Daten. Keine privaten Offiziersdaten oder Screenshots werden benötigt.

## v52 Release- und Qualitätsnachtrag

- Die getrennten Quelldaten `train-manager.history` und `train-dice` werden ausschließlich in der Anzeige chronologisch zusammengeführt; keine D1-Änderung, kein erfundener Zugfahrer, keine Änderung an Zugfahrten- oder Fairnesszählern.
- Der neue Zeitraumfilter berücksichtigt das Datum in Europa/Berlin, vollständige ISO-Kalendertage und den Status: vergangen nur tatsächlich `completed` bis einschließlich heute, zukünftige Termine ausschließlich im Plan, abgesagte und ungeklärte Einträge bleiben separat erreichbar. Dice-Gewinne erscheinen auch ohne zugehörige Zugfahrt, werden aber nicht als Fahrten gewertet.
- Die neuen Titel und Hinweise sind jetzt für alle 15 Offizierssprachen übersetzt. Der vollständige Sprach-/Syntaxcheck `npm run lint` meldet **344 Übersetzungsschlüssel × 15 Sprachen** erfolgreich. `tests/native-train-timeline-v52.test.js` plus Sprach-Audit: **10/10 Tests bestanden**, einschließlich Mittwoch-Dice, Navigation, vergangenen/geplanten/unbestätigten Zügen und Übersetzungen ohne deutschen Fallback.
- Headless-Browserprüfung `node tests/p0-browser-qa.mjs`: Chrome/R4 und Edge/R5 jeweils 320, 375, 390 und 430 px, Dark/Light, **PASS**. Keine echte Offizierssitzung oder D1-Mutation im Browser-Test.
- Gesamtwebsite `npm test` nach Änderungen: **235/236 bestanden**. Der verbleibende intermittierende Test `R5 explicitly links a legacy account and can disable access` in `native-vs-profile-links.test.js` schlug beim erneuten Lauf mit einem UI-Wartefehler fehl. Die unveränderte Luna-v51-Baseline zeigte bei Einzelaufruf derselben Testdatei ebenfalls wechselnde Fehler in den R5-Site-Owner-Tests. Das ist eine bestehende isolierte Test-/DOM-Asynchronitätsproblematik, keine durch v52 geänderte Funktion; offen als separate Testhärtung. Keine grünen Gesamttests vortäuschen.
- `npm run release:assets` stempelte **Luna v52** (`2026-10-16.52`) und aktualisierte Importmap + Service-Worker-Cache. `git diff --check` PASS. Kein Upload/Push privater Spielerbelege; die Veröffentlichung erfolgt ausschließlich im Staging-Frontend `lunas-empire.github.io`, niemals auf `rzsn-home.github.io` ohne eigene Freigabe.
