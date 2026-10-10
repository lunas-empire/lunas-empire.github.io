# RZSN guide audit – 2026-10-10

Scope: local Git checkout synchronized with both GitHub remotes (base 1d0bce7). Review covers all 18 Season master topics, seven VS weekdays + Secret Missions, the four season-image text guides, and the standalone Tech, T10, Train and Black Market guides. The translated content is exposed in 15 public languages. No checklist storage keys are changed.

## Corrected, high-confidence issues

| Guide / area | Prior risk | Correction |
| --- | --- | --- |
| Wish Hero | Claimed one unlocked UR hero per 200 recruits | Precisely 10 shards of one **already unlocked** selected UR hero per 200 recruits, selection can change |
| Serum Collection | Suggested not spending everything despite weekly restock | Buy useful available UR offers before weekly stock refresh; daily puzzle grants serum and crystals |
| VS Wednesday | Presented Intercity Truck alongside Alliance Duel and Special Forces as a main priority | Alliance Duel reward unlocks -> Special Forces T10; Truck research only optional low-cost filler |
| Season Day 1 passes | Suggested paid pass purchases were essential | Weekly Diamond pass useful; real-money pass completely optional; F2P-friendly recommendation |
| Rewards / settlement | Blurred 49 active days and eight total weeks; counted Serum as converted resource | 7 active weeks, Week 8 settlement; only Immune Proteins, Mutant Crystals and Genetic Fragments named as Profession EXP conversion |
| Exclusive Weapon sources | Confused Black Market hero-named choice shards with universal EW shards | Named shards unlock (50 per weapon); universal shards upgrade already-active EW; Black Market sells named choice chests |
| Troop Type Boost | Missing VRI Level 30 construction prerequisite | Added VRI 30 gate; +1% each stat per level; max level 30 and temporary |
| Military Stronghold / City | Claimed every map tile is a city or stronghold | Only key capture territories; territories must be connected, resistances and R4/R5 coordination matter |

The reviewed corrections take precedence in translations across all 15 languages through `assets/guide-factcheck-copy.js`. It does not rewrite existing member checklists, historical data or localStorage keys.

## Reviewed and retained

- **T10**: HQ 30, Tech Center 30, one Barracks 30, and Special Forces Unit X; research the prerequisite path only, not every optional node. Verified across multiple 2026 resources.
- **Exclusive Weapons**: 5-star hero, 50 named shards to unlock; 70 from the optional battle pass gives the unlock plus Level 2.
- **Black Market**: four-week off-season event, 1 free + 2 discounted + 3 normal items, 8 daily refreshes, 90 Diamonds total if buying all, 50 named shards per unlock; Cash carries over. Cash/item price values are samples subject to patch/season.
- **Crimson Legion**: Week 2 Day 2, 18-day event, Tuesday/Friday attacks, around 30 waves, up to 20 reinforcing members.
- **City/Stronghold**: connected territory, R4/R5 coordination, two strongholds per day limit independent of city limit.
- **VS weekday routines**: continue to be RZSN-specific strategy rather than generic game-rule claims. Check actual server-time Arms Race window before spending.
- **Mason**, **Season virus/VRI**, **Profession**, **Weather**, **Purge**, **Outposts**, **War Declarations**, **Octagon**, **Builder Alliance**, **Train**: retained mechanics where no reliable contradictory evidence was found; server-specific numbers are not represented as universally verified.

## Still time-sensitive / verify against live game screen

1. Exact daily Arms Race windows and Season unlock dates can shift by server or patch. RZSN currently uses a manually configured anchor of 2026-09-21; changing this would affect the entire schedule and is not part of this audit.
2. Train five-refresh method, four-hour window and 50k rating are the alliance's practiced guidance, not documented here as globally verified developer rules.
3. Weather bonus percentages, profession skill labels, City durability values, and event reward odds should be rechecked when a new Season UI lands.
4. Translation automated checks establish coverage and syntax but do not replace review by native speakers of every language.

## Sources compared (all external)

- https://www.lastwartutorial.com/season-1-week-8/
- https://www.lastwartutorial.com/season-1-week-2/
- https://lastwar-tutorial.com/season-1/
- https://www.lastwarvault.com/guides/general/t10-troops-guide/
- https://www.lastwarvault.com/guides/tech-center/season-1/
- https://www.virgovixen.info/events/gene-collection/
- https://www.virgovixen.info/events/military-bases/
- https://cpt-hedge.com/guides/black-market
- https://cpt-hedge.com/guides/stores/black-market
- https://lastwar.wiki/decorations/tower-of-victory/
- https://www.lastwartutorial.com/season-1-the-crimson-plague/

Deployment: staging first; production only after the repository's explicit final approval process. Validation: `npm run lint`, `npm test`, `npm run release:assets`; review current diff for unrelated files.
