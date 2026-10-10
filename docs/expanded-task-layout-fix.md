# Expanded task details layout fix — 2026-10-10

The prior tactical UI stylesheet set `.task-detail[open]{display:contents}`. On mobile, an expanded task summary and detail body were mistakenly inserted into the narrow mission-label grid column. This created one-character-per-line wrapping, overlapping text and unusable controls in the VS view.

The correction keeps the parent CSS grid but renders opened `details` as an independent full-width row below the task label (`grid-column:1/-1;grid-row:2`). The detail button, description, optional guide link and unavailable control now have their own normal width, padding and frame. Task content and storage/checkbox behavior are unchanged.

## Verification
- Real Chrome Playwright: 4 widths (320, 390, 768, 1200) × 2 themes × 4 routes (VS, Daily, Today, Season), opening first three tasks in each: 32 passes, no runtime errors or horizontal overflow. On 320px, paragraph widths were greater than 229px rather than collapsing into one-letter columns.
- `npm run lint`: 344 translation keys ×15, pass.
- `npm test`: 99/99 pass, including new layout regression test.
- Version 2026-10-10.10.
