# Command Center audit and implementation backlog — 2026-10-13

## Verified architecture
- Staging GitHub Pages repository: `lunas-empire/lunas-empire.github.io`, default branch `main`.
- `command-center/index.html` redirects to `https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/`.
- `admin/` is a separate, locally decrypted static leadership wiki; **not** the live Command Center application.
- Screenshot/OCR scripts and historical VS data live in the private `lunas-empire/last-war-vs-tracker` repository.
- Cloudflare Worker source/deployment repository **not yet identified or inspected**. Do not claim fixes to the Worker until its source and deployment are verified.
- Production `rzsn-home.github.io` must not be changed without explicit user approval.

## Implementation order

### P0 — establish the real source and safe deployment
- [ ] Locate the Cloudflare Worker project source, migrations, tests, and deployment config.
- [ ] Verify Worker staging binding, database/storage, and authorization model.
- [ ] Confirm the deployed staging version against the source commit; preserve data and secrets.
- [ ] Create a dedicated feature branch/preview; run tests before staging release.

### P1 — OCR review and screenshot evidence
- [ ] Investigate why UI reports **128 Meldungen**: distinguish screenshot count, OCR rows, warnings, duplicates, and unresolved review cases; use truthful separate counters.
- [ ] For every unresolved OCR result show original screenshot, crop/highlight of the affected row, parsed values, and confidence/issue.
- [ ] Allow editing player match, VS day, score, rank, power, kills, donations; validate changes before save.
- [ ] Provide accept/reject/skip with reviewer, timestamp, reason and undo/correction history.
- [ ] Deduplicate repeated overlapping screenshots and prevent duplicate imports.
- [ ] Missing readings must remain null/unknown rather than zero; never silently create members from low-confidence OCR.
- [ ] Verify existing W39–W41 analyses and preserve raw captures.

### P1 — member administration and audit
- [ ] Allow authorized manual R1–R5 rank changes.
- [ ] Record actor identity, UTC timestamp, entity/member ID, action, before/after values, reason and source (manual/OCR/import).
- [ ] Make audit history immutable to ordinary admins, searchable/filterable, and accessible only to authorized roles.
- [ ] Include alias/name matching and review workflow for renamed members.
- [ ] Protect sensitive admin endpoints server-side; frontend hiding is not authorization.

### P2 — quality and usability
- [ ] Member timeline for VS, strength, kills, daily/weekly donations.
- [ ] Mobile-friendly admin screens and visible save/error states.
- [ ] Import dry-run, idempotency, transaction rollback and backup/restore drill.
- [ ] Unit tests for OCR parsing, overlapping screenshots, score thresholds (3.6M), and audit events.
- [ ] Accessibility/contrast and locale terminology QA.

## Acceptance criteria
1. Every review item links to the exact source image and can be corrected without losing the original OCR result.
2. Counts reconcile: images processed, rows parsed, duplicate rows, review cases and accepted records are separate.
3. A rank change from R2 to R3 records both values, actor and time and survives reload.
4. Reimporting identical images produces no duplicate scores or audit noise.
5. Production stays untouched until user explicitly approves the staging result.

## Codex execution prompt
Inspect the real Cloudflare Worker source before coding. Work in a nonproduction branch. Implement P1 in small testable changes, prioritizing truthful OCR counts, screenshot-backed manual review and immutable rank-change auditing. Preserve historical data and secrets. Run existing tests plus targeted regression tests. Deploy only to staging after verification; do not push or deploy to RZSN-Home without explicit approval. Document blockers with concrete file paths and evidence; do not invent completed work.
