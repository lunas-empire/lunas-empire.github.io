# Luna staging: deep functional UX audit

Date: 2026-10-15. Branch: `audit/luna-v42-ux-20261015`. Scope: local frontend only. This review used source inspection and synthetic DOM/API tests. It did not use an authenticated R4/R5 session or real member images.

## Focused changes

| Finding | Before | After | Evidence |
| --- | --- | --- | --- |
| OCR case search had only a placeholder (P2 accessibility). | The field lost its only visible description when an officer typed. | A visible `Spieler oder Fall suchen` label now names the field. It uses an existing translated string. | `native-review-mobile.test.js` checks the associated label. |
| Private OCR image enlargement required a pointer (P1 accessibility). | A click handler targeted a bare image, which could not receive keyboard focus. The preview container also claimed to be an image while displaying loading and error text. | Loaded evidence and manually selected profile captures now put the image in a native button labeled `Originalbild ansehen`. The container announces loading and error text as status. The same in-memory Blob URL opens only on explicit activation. | `native-review-mobile.test.js` checks the button and confirms no window opens before activation. The existing protected-review and profile-capture tests also pass. |

Changed files: `assets/native-admin.js` and `tests/native-review-mobile.test.js`. No API path, permission gate, screenshot selection, correction payload, or report text changed. Existing untranslated player data remains untouched.

## Workflow review and limits

- OCR review already sorts cases with attached images first, exposes a missing-image filter, and keeps missing evidence from approval. Replacement and profile-capture linking require explicit review and confirmation. The nested replacement disclosure remains a second step inside a case; simplifying it needs authenticated officer observation and coordination with the concurrent CSS work.
- The VS and donation code and tests distinguish unknown values from zero. Exact player and day evidence paths are covered by synthetic tests, including protection against an unrelated top-three screenshot. Synthetic responses cannot establish that live imports map each original screenshot to the right player.
- Report copy occurs only on click, respects the alliance-mail character limit, and selects text for manual copying if clipboard access fails. The member dossier has a retry path when loading fails. These were inspected and covered by existing tests; no speculative rewrite was made.
- The More area still adds a navigation step to OCR review and other administration. Changing navigation or removing disclosures would require representative R4/R5 task observation across mobile widths. The local DOM tests alone do not justify that change.

## Validation

- `node --test --test-isolation=none tests/native-review-mobile.test.js`: **2/2 passed**.
- `npm test`: **180/180 passed** when run with permission for Node test workers. The first sandboxed attempt stopped before test execution with `spawn EPERM`.
- `npm run lint` in the working tree: **failed** on duplicate HTML IDs in an existing untracked Chrome extension fixture under `qa/ux-rc/chrome-qa`. The first sandboxed attempt stopped at Node's child-process check. A temporary copy of tracked files, including these JS/test edits and excluding untracked QA artifacts, passed the same `npm run lint` command: 344 keys across 15 languages, task references, syntax, and encrypted admin separation.
- `node --check` for both changed JS files and `git diff --check`: **passed**. These checks do not replace authenticated browser QA.

## Still required before claiming 9.5/10 in any category

1. Use real R4 and R5 staging accounts to verify access boundaries and complete OCR review: open the original, compare player identity and value, correct or dismiss, reload, and inspect the audit record.
2. Repeat with real VS day/week and donation evidence for named members. Check exact source image, capture time, crop, hash, and identity. Confirm missing images and unknown values stay unknown after reload. No fallback image or inferred zero is acceptable.
3. Check image upload/replacement and profile-capture selection with real protected images, including failure and retry states. Confirm that R4/R5 rights match the backend response.
4. Exercise report editing/copying and the member dossier with officers on narrow iPhone Safari and desktop, in both themes and relevant languages. Confirm focus, zoomed evidence, loading/error recovery, and translations with actual users.
5. Review current Worker/D1 security and data state in its authorized environment. This local frontend review provides no evidence about production permissions or mutations.

No overall quality score is assigned from synthetic tests or source inspection.
