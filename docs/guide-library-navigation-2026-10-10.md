# RZSN Guide Library Navigation (2026-10-10)

The member-facing Guides screen now uses a **topic-first, search-first** browsing flow instead of long ungrouped disclosures and broad legacy chips.

## Homepage
- Search is always available.
- "Important now" links directly to the current server-day VS guide and the first guide for the active Season 1 week (where applicable).
- Five plain categories display their guide counts: Alliance & Events (7), Squads & Power (7), VS & Points (8), Season 1 (18), Shops & Resources (2).
- No 42-item guide list is expanded by default. No additional nested menu is required.

## Categories and source of truth
- A guide is rendered **only once**; its category is given by assets/guide-library-nav.js.
- Alliance & Events includes train, general trial, zombie siege, marshal, rally combat, desert storm, alliance research.
- Squads & Power includes squad formation, drone chips, UR gear, waterfall, minister buffs, Tech and T10. The existing Quick Reference remains as an optional disclosure there.
- VS has each weekday plus Secret Missions.
- Season 1 holds all 18 season library guides, grouped into six expandable week groups. The current week is first and open.
- Shops & Resources includes shop priorities and the Black Market.

## Deep links, search and accessibility
- Original \`#guides/{id}\` and \`#guides/{id}/{section}\` routes still work; selecting a deep link opens its category and, if needed, its season week.
- Search spans every category, matches native title and body content plus alternate key terms, and puts title matches first.
- Category selection is button-driven and exposes a visible return control; no route or checklist storage keys changed.
- Focus follows the selected category for keyboard and screen reader users.
- The category interface is translated for all 15 supported languages, including right-to-left Arabic.
- The old broad filtering choices ('Account', 'Tech', etc.) are intentionally removed from the visible UI.

## QA
- Separate DOM navigation tests verify all five category buttons, single-category visibility, search, empty results, direct links, season-week expansion, Arabic language change and localStorage persistence.
- Existing original Guide/VS/Season tests continue to run.
