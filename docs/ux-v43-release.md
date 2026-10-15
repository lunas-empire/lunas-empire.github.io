# Luna v43 – Release evidence and quality gates
Date: 15 October 2026. Scope: **Luna staging only** (lunas-empire/lunas-empire.github.io). RZSN production, Cloudflare Worker/D1, screenshot tracker and private data are not modified.

## UI corrections
- Removed the **visible** daily officer chat draft, VS support chat report, VS in-game-mail draft and donations weekly mail panel, plus their jump buttons, nested disclosure boxes, copy handlers and counter handlers. Underlying source data and calculation helpers remain unchanged in the repo for future design, but are not part of active UI.
- Kept VS metrics, donations calculations, review/evidence paths, private member records, profile comparison, train, tasks, role checks, and audit logs intact.
- Added all-15-language integrity tests with 748 officer terms, 344 public dictionary keys, 15×14 synthetic admin panel renders, 90 public browser route views, private name/rank protections and guide-title fit fix.
- Added focused test that verifies no chat/mail report draft controls appear in the officer dashboard, VS, donations.

## QA and deployment
Local QA completed before publishing:
- Version base: 2026-10-15.43; `npm run release:assets` stamped 51 JavaScript modules.
- Tests: **204/204 passed** (including all 15×14 synthetic officer-panel checks, all-locale dictionary and ranks, and report-removal regressions).
- `npm run lint`: **passed**, 344 public translation keys × 15 languages; JavaScript syntax and encrypted admin separation.
- `git diff --check`: **passed**.
- GitHub code commit and live Pages HTTP evidence: add only after successful deployment.
- Browser locale audit: 90/90 public routes loaded, 210/210 synthetic admin panels rendered, 15/15 guide-overflow recheck clean. Original browser samples used a local synthetic R4 fixture and are not authenticated.
- Read `docs/i18n-v43-audit.md` for full test scope and remaining translation quality risk.

## Honest quality gate
A visually more professional interface and a large number of green tests are not proof of a 9.5/10 user experience, faithful screenshot/identity mapping or native linguistic excellence. Still needed: real authorized R4/R5 end-to-end proof review, backend security plus D1 backup/restore and permission testing, physical mobile iOS Safari/VoiceOver, independent native-language and officer usability acceptance, final visual component consolidation. Never overwrite protected records or publish to rzsn-home.
