# Luna v45 – VS-Wochensumme aus Tageswerten, 15.10.2026

## Fachentscheidung
Keine zusätzliche VS-Wochenranking-Aufnahme, keine neue Wochenbeleg-Pflicht. Das Capture-Skript der Zentrale sammelt bereits ausschließlich sechs Tagesranglisten (Mo–Sa). Einzelne Originalbelege zu jedem Tageswert bleiben erhalten. Historische Wochen-Rohwerte/Bilder werden nicht gelöscht, aber nicht mehr als verpflichtende Wochenpunktquelle verwendet.

## Frontend (Luna-only)
- VS: Wochensumme wird aus exakt sechs bestätigten, sicheren ganzzahligen Tageswerten abgeleitet. Fehlende, inferred und doppelte Tage verhindern eine bestätigte Wochensumme; eine nachweisliche Null bleibt gültig.
- Bei 1–5 bestätigten Tagen nur als Teilstand (x/6 Tage bestätigt) anzeigen, kein fingierter vollständiger Wochenwert.
- Keine gesonderte Wochen-Screenshot-Schaltfläche; einzelne Tages-Screenshots weiterhin pro Spieler/Tag verlinkt.
- Spielerakte und Wochenentwicklung: gleiche Tages-Summenregel, Vergleiche nur bei zwei vollständig bestätigten und finalisierten Wochen.
- Spenden, D1-Bestände und RZSN-Produktion nicht verändert.

## Private Backend-Quelländerung, noch NICHT auf Worker deployed
- vs-intel.mjs, api.mjs und train-manager.mjs lesen künftige Wochenwerte aus sechs Tageswerten; vollständige vs. partielle Werte getrennt, historisches Wochenranking nicht überschrieben.
- Cloudflare Wrangler auf Desktop nicht angemeldet, daher derzeit kein Deployment. Bis dahin berechnet Luna im Frontend unabhängig vom Worker korrekt; Backend-Zugempfehlung und API-Objekte können noch den alten Wert enthalten.
- Kein Schemawechsel, keine DB-Mutation. Private Branch-Arbeit getrennt prüfen.
## Qualität / Grenzen
- Automatisierte Tests einschließlich unbekannt/inferred, legitimes 0, doppelte Tage, bewusst falscher importierter Wochenrank-Wert, keine Wochenbeleg-Schaltfläche; Endzahlen erst nach Lauf eintragen.
- Echtes R4/R5-D1-Login, Originalbildvergleich, Cloudflare-Staging-Smoke, iPhone Safari und 15-Langtext-Muttersprachprüfung offen.
## Fünf Schritte
1. Frontend v45 mit Tests/Lint/Live Pages nachweisen.
2. Privates Backend kontrolliert deployen, erst nach autorisiertem Cloudflare-Login; VS-/Profil-/Train-APIs überprüfen.
3. Mindestens 6/6-, 5/6- und echter Null-Fall mit Originaltagesbildern und Admin-Audit abnehmen.
4. Unsichere OCR-Zeilen anhand ihrer Tagesbilder prüfen; niemals fälschlich zu 0 machen.
5. Reales iPhone/RTL/15 Sprachen visuell prüfen.

## Tatsächlicher Release-Nachweis
- **Luna v45 / 2026-10-15.45** auf GitHub Pages live. Frontend-Code-Commit `64d6231e0e431ed3f91e430b6b6df06d9e90d608` auf main, Assets HTML, `assets/config.js`, `assets/native-vs-overview.js` jeweils HTTP 200, neue Wochenableitung im ausgelieferten Modul vorhanden.
- `npm test` **210/210**, `npm run lint` **grün**, `git diff --check` **grün**, `npm run release:assets` hat 51 Module versioniert.
- Backend-Quellstand auf eigenem privaten Branch [`feat/vs-daily-sum-source-20261015`](https://github.com/lunas-empire/last-war/tree/feat/vs-daily-sum-source-20261015), Commit `2cc9ae9dba14de5c96721d03e21a7578e5d91325`, **144/144 Tests und Syntaxprüfung grün**. Worker ausdrücklich **noch nicht deployed**, Wrangler-Authentifizierung auf Desktop fehlt. API / Zugempfehlungen erst nach separater Bereitstellung als umgestellt bewerten.
- Keine Änderung an RZSN-Produktion, bestehenden D1-Datensätzen oder gespeicherten historischen Wochenscreenshots; nur die zusätzliche Wochenbeleg-Pflicht der Oberfläche ist weggefallen.
