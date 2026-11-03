# Luna v46 – Historische Zugfahrer-Zuordnung sichtbar machen

Nur Luna-Staging. RZSN-Home/Cloudflare Worker/D1 bleiben unverändert.

## Problem
Historische Zugliste enthält gekürzte Spielernamen und alte Namen, die in der aktuellen Mitgliederdatenbank nicht eindeutig auflösbar sind. Der bisherige Train-Bereich versteckte diese Fälle in einer langen Zug-Historie und zeigte als KPI stattdessen historische Kalendertag-Lücken.

## Umsetzung
- Zugmanager-KPI zeigt **Noch zuordnen** anstelle der missverständlichen Historische-Lücken-Kennzahl.
- Eigener, einklappbarer Abschnitt **Fahrerzuordnung prüfen** zeigt abgeschlossene, unverbundene historische Fahrten nach dem vorhandenen Originalnamen gruppiert.
- Jede betroffene Fahrt ist über einen datierten, tastatur- und touchfähigen 44px-Button mit dem bereits vorhandenen Zugeditor verknüpft.
- Gruppiert nur gleiche Originalnamen nach Unicode-/Zero-Width-Bereinigung; **keine unsicheren Zusammenführungen** und keine automatischen Mitglieder-Änderungen.
- Die zugrundeliegenden Zugfahrten bleiben unverändert; Cloudflare/Backend speichert bestätigte R4/R5-Änderungen mit eigenem Zug-Audit.
- Ungeklärte früher ausgeschiedene Spieler müssen separat anhand einer historischen Mitgliederquelle bestätigt werden.

## Daten-/Backendstand
Das Backend-Korrekturpaket für verifizierte Kurzformen liegt getrennt im Backend-Repository als Draft PR. Auf dem privaten Backup vom 14.10. reduziert dessen Namensauflösung unverbundene 132 Fahrten von 54 auf 11. Aktuelle Live-D1-Zahlen wurden mangels Wrangler-Anmeldung **nicht** abgefragt; diese UI-Änderung beansprucht nicht, Backend- oder D1-Probleme live zu lösen.

## Testbedingungen
Nach finaler Versionierung `npm test`, `npm run lint`, `git diff --check` und HTML/JS Live-Versionsprüfung dokumentieren. Synthetische Tests: identische Originalnamen zusammenfassen, unterschiedliche reale Namen nicht verwechseln, verknüpfte/geplante Fahrten nicht als offene Zuordnung zählen. Keine echten Spielerwerte in Tests oder Git.
