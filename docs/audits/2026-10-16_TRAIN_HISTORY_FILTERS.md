# Train history filters — 2026-10-16 (v52.1)

## Scope

- The shared past train and Dice Game section starts collapsed. Its summary opens the full history.
- Member and exact date filters combine with AND. Matching occurs across all past entries before the 20-row page limit. The member search is case-insensitive, normalizes Unicode compatibility characters, and ignores zero-width noise. It checks train driver and original names, Dice winner names, and canonical member names only when an explicit member ID exists.
- Search input focus and values, the open state, and the current filter survive pagination, editor opening, and navigation back to the train tab. Reset restores the full history.
- Dice wins remain separate from completed train rides and do not alter ride statistics. Future and unresolved entries retain their existing classifications.
- New controls and feedback have translations for all 15 officer locales and a stacked layout at narrow widths.

## QA

- Targeted unit and synthetic R4/R5 DOM tests passed for 25+ matching entries, pagination after filtering, exact date plus member, zero results, Wednesday Dice history, original and canonical names, Unicode and zero-width input, reset, open state, editor opening, navigation, and unchanged statistics.
- `node scripts/validate.js --content-only` and direct `node --check` on all 129 project JavaScript files passed.
- The 70 test files were run individually because this sandbox rejects the child-process spawn used by `npm test`. 69 files passed. `native-vs-profile-links.test.js` still fails in its unrelated R5 access scenarios on repeated runs; no access logic was changed here.
- `npm run lint` could not run its child-process syntax checks because the sandbox returns `EPERM`. The content validation and direct syntax checks above completed.
- `node tests/p0-browser-qa.mjs` could not start Chrome DevTools in this environment, so browser QA remains unverified here.
- `git diff --check` passed.

## Limits

Filtering uses explicit stored names and member IDs. It does not infer an identity from a similar spelling. The filter state is in memory for the current officer session and resets on logout.

## Outside-Sandbox Verifizierung auf dem autorisierten Desktop (16.10.2026)

Der separate Remote-Desktop-Shell kann die in der Codex-Workspace-Sandbox gesperrten Unterprozesse ausführen. Von dort tatsächlich gemessen:

- `npm run lint`: **PASS**, 344 Übersetzungsschlüssel × 15 Offizierssprachen.
- `node --test tests/native-train-history-filters.test.js tests/native-train-timeline-v52.test.js`: **7/7 PASS** vor Ergänzung weiterer Sicherheitschecks; das spätere kombinierte Sprachtestset wird separat geprüft.
- `npm test`: **237/239 PASS** (zwei R5-/Website-Owner-Zugriffstests aus `native-vs-profile-links.test.js` schlagen wegen asynchronem DOM-Race fehl). Dieselbe unveränderte Testdatei im Luna-v52-Baseline-Repository reproduzierte die bereits bekannte R5-Problematik mit **5/7** PASS im Einzelaufruf. Dieser Bereich wurde im Filter-Patch nicht verändert.
- `node tests/p0-browser-qa.mjs`: **PASS** – Chrome R4 und Edge R5, jeweils 320/375/390/430 px, Dark/Light, private Fake-OCR-Prüfungen und Zugbearbeitung (keine echten Logins).
- `git diff --check`: PASS. Die Git-Permissionsperre betraf nur den Codex-Sandbox-Index; Commit/Push können aus der autorisierten Remote-Desktop-Shell erfolgen.

Die obigen Messungen ersetzen die Sandbox-Blockermeldungen für diese Prüfungen. Ein fachliches vollständiges R5-Cookie-E2E ist weiterhin separat offen.
