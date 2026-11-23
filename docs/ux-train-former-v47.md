# Luna v47 – ehemalige Zugfahrer

Der Nutzer bestätigte, dass alle neun unterschiedlichen Namen aus elf historischen, noch unverbundenen Zugfahrten ehemalige Mitglieder sind.

Frontend: Mitgliederverwaltung > Archiv zeigt einen separaten, read-only historischen Zuglistenbereich inklusive Namen und Fahrdaten. Keine neue Mitglieds-ID, kein erfundener Rang oder Messwert, keine Aktivierung. Identische Namen vorhandener Mitglieder werden nicht dupliziert. Beschriftungen in allen 15 UI-Sprachen.

Backend: getrennte private Draft-PR #2 im Repo lunas-empire/last-war liefert archivedFormerTrainDrivers und counts.historical_former. Noch kein Cloudflare Worker-Deployment; ohne das bleiben die zusätzlichen historischen Zeilen auf der Live-Seite unsichtbar.

Nächste Schritte: sicheren Backend-Deployment-Stand und D1-Backup verifizieren, Staging-Worker freigeben, anschließend echte R4/R5-Abnahme. Carl Friedrich und Carl freidrich nicht automatisch verschmelzen.
