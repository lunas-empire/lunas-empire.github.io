# Member aliases in native Officer profiles · v53

## Scope

The member profile now has a collapsed **Frühere Spielernamen** section below the identity. Its count and exact alias spellings come from `GET /api/member/:member_id/aliases`. Alias text is escaped and excluded from localization. The member's current name, imported source, train history, and other profile modules are unchanged.

R4 and R5 can open a small confirmation form. It requires the exact historical spelling, a source or reason of at least eight characters, and an explicit source-check acknowledgement. The form sends only `{alias,reason}` to `POST /api/member/:member_id/aliases` using the existing in-memory bearer token. R3 can read the list but gets no edit controls. A successful POST is followed by an authoritative GET, updating only the alias section. A 409 or other failed POST preserves the draft and shows a specific message. If the POST succeeds but the follow-up GET fails, the UI says the name was saved while the list needs reopening; it never labels an unconfirmed draft as saved. Cancel clears the draft.

All new fixed interface strings have exact translations for the 15 Officer languages. The disclosure and controls use native HTML, live status text, keyboard focus, and wrapping rules for narrow screens. No fuzzy name suggestions or new root navigation were added.

## Verification

- Synthetic API tests in `tests/native-member-aliases.test.js` cover R3 read-only access, R4/R5 success, pending state, source acknowledgement, Cancel, 409 conflict, idempotent replay, HTML injection, and translations.
- Targeted profile, translation, mobile, and registry tests: **11/11 passed** using `node --test --experimental-test-isolation=none ...`.
- Full suite before the v53 asset stamp: **240/241 passed** using process-free Node test isolation. The intermittent failure was the existing R5 legacy-account test in `tests/native-vs-profile-links.test.js`. Running that file with the unchanged v52 `assets/native-admin.js` also failed in the adjacent site-owner case, confirming an inherited timing issue. After the stamp, a second full run passed **239/241**: the same R5 case and a clipped-screenshot review case failed. The latter passed **3/3** when its file was rerun alone. Do not count the full suite as green.
- `npm run lint` was attempted, but this sandbox denies the validator's nested `spawnSync(node --check)` with `EPERM` (`admin/app.js`, status `null`). The content and syntax checks are run separately below.
- The existing `tests/p0-browser-qa.mjs` now checks R4/Chrome and R5/Edge alias forms at 320, 375, 390, and 430 px in dark and light themes with a synthetic API. Execution was attempted twice, but Chrome DevTools did not start in this sandbox; browser smoke remains unverified here.
- `npm run release:assets` stamped **2026-10-16.53** after tests, updating the local import map and service-worker cache. No deployment or push was performed. The public `rzsn-home` site was not changed.
