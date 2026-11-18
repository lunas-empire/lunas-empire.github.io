# Deployment workflow

## Staging / Demo
- Site: https://lunas-empire.github.io/
- Git remote: `origin`
- Purpose: development checks, QA, demos and member approval.
- A normal `git push` from this checkout targets staging.

## Production
- Site: https://rzsn-home.github.io/
- Git remote: `production`
- Publish only after an explicit final approval.
- A local pre-push hook blocks accidental pushes to `production`.
- Production releases should first pass `npm run lint` and `npm test`.

The production safety hook is local to this computer and is intentionally not stored in the public repository.

## Commander Center
"Commander Center" means the single GitHub Pages `/admin/` route. On `lunas-empire.github.io` (and localhost previews), `/admin/#overview` mounts the existing `/assets/native-admin.js` UI once, retaining its memory-only bearer session, full officer features and existing API access across shell tab switches. `/admin/#review` lazily embeds only the existing staging Worker source-bound publication-review UI, retaining its iframe when hidden. That UI owns archived screenshot/SHA/row evidence, officer decisions and separate apply, using its existing partitioned HttpOnly cookie and same-origin guards; it may require a second R4/R5 login. No review proxy, copied modules or relaxed CORS. Private data and credentials are never published in the Pages repository.

`/admin/#review` opens manual reviews; `/admin/#wissen` opens the existing encrypted wiki with its separate wiki password. Decrypted wiki return links reload `/admin/#overview` or `/admin/#review`. Other hosts retain the encrypted wiki entry without loading the staging Worker. Do not run `build:admin` for shell changes: it regenerates encrypted data and requires private source material and a password. Publish this shell only with `git push origin main`; never use the production remote for staging.

## LW Import: local implementation, release gate still closed (2026-11-04)

The existing native member context now includes **LW Import**. CSV upload uses the
same memory-only officer session and existing API base; the filename is cleared
after reading and never transmitted. Server validation creates a private preview,
not an applied snapshot. Reopen batches, inspect source fields and SHA, explicitly
select reviewed rows and approve with a reason. After the server receipt, the UI
fetches the batch separately and checks the selected member mappings again.
Original CSV download is authenticated, byte/SHA-checked and neutrally named.

LW Import identity cases use the existing native review list, filters,
`/api/identity-options?include_former=1` and `/api/reviews/:id/resolve`. CSV fields
are the source evidence; no screenshot is claimed. Identity approval is separate
from snapshot application. The existing `/api/reviews/pending` source queues are
also connected to the native review panel and can open cases through the existing
API. Unavailable queues display unavailable, never a fabricated zero count.

`assets/native-admin.js` extends `showPerson()` after value cards and before VS.
Six selectable KPIs have independent SVG scales, accessible exact-value lists,
NULL gaps, neutral decreases, no first-snapshot delta and explicit report date,
member ID, batch, source row and SHA provenance. VIP/profession/coordinates and
T1–T4 remain compact folds. Existing profile, VS, aliases, trains, donation and
absence sections remain. `assets/hub.css` uses current Luna tokens and responsive
grids; no extra shell, backend, database, starter or framework was introduced.

Local QA used synthetic data only: four focused DOM/interaction tests, existing
language smoke test, actual Chrome 155 through the available Playwright browser,
and 320/375/390/414/768/1440 CSS-pixel layouts. Profile KPI switching, native CSV
preview/explicit apply/reread, and source-specific native review approval worked
with intercepted synthetic API responses. The 320px review field overflow found
during QA was corrected and rechecked inside the card. This is desktop Chrome
with mobile viewports, not physical iPhone Chrome or an authenticated live import.
Synthetic UI screenshots are in the backend checkout's `.playwright-mcp/` as
`lw-import-native-profile-390.png` and `lw-import-native-profile-1440.png`; they are
UI QA evidence, never evidence of a real CSV row.

All 64 frontend JavaScript files parse. Content validation passes 344 keys across
15 languages. The standard lint/default test launchers encounter sandbox child
process EPERM. The in-process suite and focused checks are used to distinguish
code failures from that environmental block; the source-credit check's Git child
process also remains blocked (final suite: 286 passed, one EPERM failure), while a direct scan of all 122 tracked public text
files passes the same attribution rules. Existing development-only jsdom/Undici
audit findings remain (one moderate, one high; no fix reported). Runtime imports
and public assets do not include those development dependencies.

No deployment, migration, remote import, commit or push occurred in this run.
`assets/config.js` still points to the existing Pages API bridge. The Worker
configuration names staging, but the bridge upstream and production isolation
could not be established because the available Cloudflare account API returned
403. A new complete private backup and its integrity checks are mandatory before
any remote write. An earlier verified backup is only an offline reference. The
private report remains outside Git. Restore access, verify isolation, back up,
migrate/deploy the matching staging Worker, then repeat authenticated R4/R5
preview/review/apply/profile rereads before reporting an actual server import.
Existing untracked approved design files were not edited.


## 2026-11-11 20:55 CET — P0 pending completion proof; local fix only

P0 #1 remains released. Read-only GitHub API checks confirmed Luna main
ab3d97bded196f762e9ae33f592295b5a57490fe and RZSN-Home main
ab63e620493672ce74ab9a39f4bad833ad44d533. Both hosted config.js files contain
2026.11.11-train-vip-review; both native-admin.js files contain data-pending-open
and data-native-vip-date. No commit, push, deployment, migration or live data write
was performed. Existing dirty/untracked work in both repositories was preserved.

A concrete remaining defect was reproduced: completeReview removed a case after
any HTTP 200, without validating the receipt or independently reading the saved
decision. Five new regression cases failed before the fix. The local change in
assets/native-admin.js now validates ok/review_id/status/kind, then reads the
approved/dismissed review list and checks the exact case, status, audit action,
reason, evidence SHA and chosen permanent member ID or numeric value. Uncertain
results remain visible; the retry reads status without reposting the decision.
Busy, R4/R5 and session-generation guards prevent duplicate or stale-session work.
The existing closed-review API returns the full status list: this adds one read
per completion and is not a live rows-read optimization. No backend code changed.

Tests changed in this run: existing tests/native-pending-reviews.test.js (already
untracked before this run) and tests/native-review-mobile.test.js (its mock now
returns the real receipt/readback contract). The focused 27 tests pass, including
R1/R3/no-write inspection, source-filter focus, exact case reveal beyond filters
and pagination, open retry/doubleclick, stale/logout, invalid completion receipts,
readback failure/retry, manual permanent-ID selection and verified zero vs NULL.

Eight additional in-memory integration scenarios passed: actual hosted module
graphs from both sites executed in JSDOM/VM at innerWidth 390 and 1280, each with
the hosted implementation and with the local fix plus hosted dependencies. The
existing SQLite :memory: Worker fixture handled real Worker.fetch HTTP requests
and a real synthetic native R4 login. Source inspection, filter focus, exact case
reveal, no initial image, explicit synthetic PNG upload, evidence SHA verification,
manual permanent-ID choice, one approval POST, receipt and independent Worker GET
all passed. Source member_id and points remained NULL; no player or global
Unknown alias was created; three audit records accompanied the identity decision.
Hosted code issued zero completion readbacks; the local fix issued one.
JSDOM does not render layout: these are DOM/HTTP integration checks, not Chrome
visual checks or a private live session. Isolated small-fixture counts including
auth: GET pending 7 SQL statements; new donation open 13. These are not D1
meta.rows_read measurements or proof of a production daily budget.

Final checks: Worker full suite 669 total / 663 pass / 0 fail / 6 skip;
npm run check passed. Frontend full suite 361 total / 360 pass / 1 failure:
the existing source-credit test cannot spawn Git (EPERM). A direct equivalent
scan of all 122 tracked public text files passed with zero violations.
Content validation passed 344 translation keys in 15 languages; affected JS
syntax and git diff --check in both repositories passed (existing CRLF warnings).

Both live Workers returned 401 Authentication required for anonymous session,
pending GET and open POST with empty JSON. The browser inventory reported an
unreachable browser host/native pipe; Playwright failed to start its driver with
WinError 5. Consequently no existing officer session or real Chrome layout check
was available. Wrangler versions list also failed on esbuild spawn EPERM; the
Worker versions supplied in the task were not independently refreshed here.

P0 #2 has synthetic end-to-end storage/audit/readback evidence, but the new fix
is LOCAL ONLY and private live pending QA remains UNPROVED. Release blockers:
restore browser/process access, verify an authorized R4/R5 session and genuine
source evidence, pass the existing release gates; before any real data write,
obtain a fresh private backup and safe independent readback. Do not repeat P0 #1
or claim that genuine pending cases were resolved. Keep production history.

Appending the requested private RZSN_WEITERARBEIT.md was denied by filesystem
permissions outside the writable workspace. Its existing contents were preserved;
this existing deployment document holds the current handoff instead.


---

## Update 2026-11-11 ca. 21:00 CET: P0 frontend fix subsequently deployed to both sites

This supersedes the "LOCAL ONLY" deployment status in the preceding 20:55 CET section. The Codex process itself did not push, but the authorized orchestrating session subsequently performed the targeted release after all safety checks.

- **Luna:** deployed on `main` as `835b79e9eea4e8729bf00c2ce4abb6c65045bb3c` (parent `ab3d97bded196f762e9ae33f592295b5a57490fe`). Verified actual `/assets/native-admin.js`, `/assets/config.js`, `/index.html` and `/service-worker.js` from Pages with new receipt/readback code and version `2026.11.11-p0-review-readback`.
- **RZSN-Home:** deployed as an authorized fast-forward `e8928c88b24288772c578ad931ab1c76721c1ad3` on its own production parent `ab63e620493672ce74ab9a39f4bad833ad44d533`. Targeted public files only; production-specific unrelated commits preserved. Production GitHub identity safely restored after push. Same actual site asset readback verified.
- **Tests:** Codex 18 pending + 9 mobile/source-review focused tests passed; 8 synthetic authenticated Worker/SQLite + hosted-JS integration variants passed. Worker suite 663 pass, 6 skip, no failures. Full native suite also executed independently on unrestricted Desktop outside Codex sandbox: **361/361 PASS**; the sandbox's one Git spawn `EPERM` was environmental, with equivalent 122-file direct public source scan passing.
- Public changes were confined to the existing officer UI and release-stamping files. No new database migration, no Cloudflare Worker deployment and **no private D1 write or manual member correction** in this P0 session.
- **Still unverified:** an actual signed-in R4/R5 session resolving a genuine pending source observation in the live alliance D1 and a real Chrome/iPhone visual run. Do not mistake synthetic integration tests or publicly deployed assets for a completed real member-data review. Existing protected /api/session, /api/reviews/pending, /api/reviews/open continue requiring authentication.

The private authoritative continuation summary is `C:\Users\Besitzer\Documents\Hias\Privat\dev\RZSN_WEITERARBEIT.md`, updated through Remote Desktop Commander after Codex's sandbox could not write outside its workspace.
