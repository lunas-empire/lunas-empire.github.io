# Luna v48 – ehemalige Zugfahrer im Allianz-Mitgliederarchiv

Die neun von der Allianzleitung als ehemals bestätigten historischen Namensvarianten (insgesamt elf Zugfahrten) werden unter **Allianz → Mitglieder → Archiv** dargestellt. Bisher war die neue Ansicht nur unter „Ränge & Archiv“ vorgesehen.

**Datenquelle:** Geschützte Zugmanager-API. Vorhandene private Backend-Klassifizierung wird bevorzugt. Bis das Cloudflare-Backend aktualisiert werden kann, erkennt eine exakte SHA-256-Prüfsummenliste diese ehemaligen Quellnamen aus der authentifizierten Zug-Historie, ohne sie als Klartext im öffentlichen Frontend-Quelltext zu speichern. Keine Fuzzy-Zuordnung und keine Erfindung von Mitglieder-ID, Rang, Power, Kills, VS- oder Spendenwerten. Aktiv gebliebene Spieler und bereits registrierte ehemalige Mitglieder werden nicht doppelt archiviert.

Die ursprünglichen Zugfahrten und Datumsbelege bleiben erhalten, ebenso sämtliche R1–R5-Spielergruppen. Historische Zuglisten-Einträge werden deutlich als „noch keine Spielerakte“ gekennzeichnet, mit Zahl der Fahrten und ihren Daten. Die neuen Bezeichnungen sind in 15 UI-Sprachen übersetzt. Der bisherige private Backend-Draft bleibt notwendig, um die gleiche Zuordnung später als serverseitige Wahrheit bereitzustellen. Ein Live-D1-Update wurde nicht durchgeführt.

Zusätzliche automatisierte Frontend-Regressionen und ein privater Test mit den realen bestätigten neun Namensvarianten/elf Fahrten prüfen die Anzeige. Eine autorisierte R4/R5-Live-Benutzerabnahme ist davon getrennt.
