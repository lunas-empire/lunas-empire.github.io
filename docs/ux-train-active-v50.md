# Luna v50 – Aktive Zugfahrer nicht im Ehemaligen-Archiv

## Korrektur
Die Allianzleitung hat zwei zuvor als historische Ehemalige behandelte Zugfahrer ausdrücklich als **aktuelle aktive Mitglieder** bestätigt. Der v48/v49-Archivabgleich klassifizierte ihre historischen Fahrten zu Unrecht als ehemalig.

- Beide geprüften SHA-256-Namensfingerabdrücke wurden aus der Former-Whitelist entfernt und als **explizit aktiv** gesperrt.
- Die Sperre wirkt sowohl beim Fallback auf archivierte Zug-Originalbilder/Fahrten als auch bei einem alten Worker-Response `archivedFormerTrainDrivers`.
- Stale `history[].former_archive` und `link_source='historical_former'` werden in der nur lokal aufgebauten Ansicht für diese beiden korrigiert. Kein Worker/D1-Schreibzugriff.
- Ihre Zugfahrten (17.07. und 13.06.) bleiben in der Zuggeschichte erhalten und sind bis zur sicheren Zuordnung zu bestätigten aktiven Mitglieds-IDs **offene Fahrerzuordnungen**, keine Former-Archivnachweise. Keine spekulative Zuordnung an ähnlich geschriebene Spieler.
- Durch die Korrektur bleiben im 14.10.-Backup rechnerisch noch sieben ehemalige Namensvarianten mit neun Fahrten übrig. Das ist eine Archiv-Quellenzählung, keine neue Live-D1-Bestätigung.
- RZSN-Home sowie private Mitarbeiterdaten, Spielerprofile, D1 und Worker-Liveversion unverändert.

## Verifikation
Regressionen prüfen explizit die Priorität „aktiv“ vor altem Worker-Archiv, erhaltene echte Former-Einträge und vorhandene registrierte aktive Mitglieder. Vor Deployment vollständige UI-Tests, 15-Sprachen-Validierung, Asset-Stempelung und aktuelle Pages-Version prüfen.

## Noch offen
Die exakten aktiven Account-IDs für die zwei historischen Kurzformen müssen über Mitgliederdaten und einen Originalbeleg bestätigt werden, damit die beiden Fahrten in den echten Spielerprofilen gezählt werden. Private Backend-Draft-PR muss dieselbe „aktiv statt former“-Korrektur enthalten und erst nach Cloudflare-Sicherheitsabnahme deployed werden.
