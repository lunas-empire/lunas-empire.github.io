# Last-War-inspired UI pass — Luna staging only (2026-10-10)

## Implemented
- Consistent steel-blue dark and neutral light themes, gunmetal panel surfaces, subtle inset accents. Gold represents progress/rewards; cyan for actionable UI; crimson for RZSN identity.
- Local inline SVG icon vocabulary for bottom/top nav, guide topics and mission types. No remote sprite, emoji or generated background art.
- Compact RZSN Command Center HUD on Today only: server identifier from GUIDE_CONFIG, VS daily minimum from ALLIANCE_CONFIG, deduplicated available-task progress, server ST from live state.serverMinute. Numbers are never fabricated/synced from the game. No account power/points inferred.
- Missions use context-appropriate icon and completed glyph. Existing checkboxes, original storage keys, unavailable actions and guide links are preserved.
- Season 1 week 1–8 visual chapter rail with past/current/future states, without removing timeline or weekly content.
- Guide section and tables adopt matching restrained surfaces and original gameplay screenshots remain intact.
- New HUD/UI copy for all 15 languages; accessible labels, right-to-left Arabic, focus, reduced-motion and 320px iPhone safe areas.
- Version 2026-10-10.6; asset import map and service worker regenerated.

## Independent checks
- `npm run lint`: 344 translation keys ×15 passed.
- `npm test`: 96 of 96 passed, including legacy checklist and new UI invariants.
- `git diff --check`: passed.
- Actual Chrome emulation via Playwright on authorized Windows desktop at 320/390/768/1200px, Dark/Light, Today/Daily/Season/Guides: 32 scenarios, 0 runtime errors, 0 page overflow.
- RZSN production was explicitly not deployed; this commit is for `lunas-empire.github.io` staging pending user approval.

## Intentional limits
- Site is an independent companion to Last War and uses only available local state; the HUD shows the alliance's VS target, not the player's actual VS points.
- Screenshots from existing guides remain sourced/attributed; game illustrations were not generated.
