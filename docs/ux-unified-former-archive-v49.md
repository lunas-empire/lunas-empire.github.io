# Luna v49 – Einheitliches Ehemaligen-Archiv

Datum: 15.10.2026. Änderungsumfang: ausschließlich Luna-Staging.

## Nutzerwunsch
Im Menü **Allianz → Mitglieder → Archiv** und ebenso unter **Ränge & Archiv** gehören historische Zugfahrer **in dieselbe Liste** wie die sonstigen ehemaligen Mitglieder, nicht in eigene Unterbereiche. „Zugfahrt“ erscheint lediglich als Informationszeile direkt beim Namen.

## Umsetzung
- Eine gemeinsame, alphabetisch sortierte Archivliste: reale ehemalige Mitglieder mit weiterhin anklickbarer Spielerakte und ehemalige Zugfahrer als read-only Listenzeile im gleichen Stil.
- Historische Zeile zeigt genau **Zugfahrt · Anzahl × · Original-Fahrtdaten**, keine getrennte Zugliste, Kacheln, Bilder oder ausgedachte Profile.
- In der Verwaltung ebenfalls **eine** Liste und gemeinsame Seitenbegrenzung („Weitere Spieler“), statt einer separaten Sektion „Ehemalige aus Zugliste“.
- Bestehende IDs/Ränge bleiben unberührt; die neun bestätigten ehemaligen Namensvarianten und elf Zugfahrten stammen nur aus der geschützten Zugmanager-API bzw. dem v48-Prüfsummenabgleich; keine Server-/D1-Änderung.
- Die Wortmarke „Zugfahrt“ wird in allen 15 Offizierssprachen übersetzt. Keine historischen Quellnamen im öffentlichen Quelltext.

## Prüfungen
Neue Regressionstests für gemischte alphabetische Reihenfolge, Listenstruktur statt getrenntem Archiv, 15-Sprachen-Labels, Pagination ohne verlorene Fahrten und Daten-/Identitätsschutz. Gesamttests, Lint, Release-Stempelung und Live-Version erst nach Veröffentlichung verifizieren.

## Grenzen
R4/R5-Live-Datenprüfung der tatsächlichen neun historischen Namen/elf Fahrten bleibt aus; ohne verfügbare Zug-API werden keine Einträge erfunden. Cloudflare Worker/D1 und RZSN-Home bleiben unverändert.
