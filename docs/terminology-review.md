# Member terminology review — 2026-10-01

Scope: Today, Tasks, VS, Season, guide library, research guide, profession skill rows and train guide. The glossary has 142 concepts across all 15 public languages. Game names, translated explanations and event phases are treated separately. The checklists' IDs and storage keys are unchanged.

## Findings and decisions

- Arms Race is the event; Hero Advancement is one of its phases. German UI now shows **Wettrüsten · Helden verbessern**, rather than an unexplained English phase. English retains **Arms Race · Hero Advancement**. Japanese uses 軍拡競争 · 英雄強化 and Korean uses 군비경쟁 · 영웅 강화.
- Recruitment and Hero EXP can score in the hero phase of Arms Race. Skill Medals and Hero Shards belong to the VS hero-day scoring, and are not presented as Arms Race scoring actions. Whole instructions were rewritten in all 15 languages, including the warning not to wait for an Arms Race window for shards/medals.
- Ordinary nouns such as radar tasks, hero shards, skill medals, stamina, speedups, resource chests and train rating have native explanations. Drone chip chests and drone component chests remain distinct.
- Named buildings, research trees, season events and profession skills use a native explanation and, where necessary, the English reference in parentheses. These explanations are **not asserted to be the official localized client strings**.
- 43 compound/proper-name labels are deliberately protected against partial substitutions. For example Secret Mobile Squad Tasks must never become a malformed mix of English and a translated Squad. Their existing localized paragraphs continue to explain the action.
- Proper names (Kimberly, Mason, DVA, Tesla, Loki, Operation KABUM), rarity codes (UR, SSR, SR), leadership ranks (R4/R5), server 2261 and numeric rules are preserved.
- No public publisher-maintained terminology database covering all 15 languages was found. The official site establishes the product/publisher but does not document the event vocabulary. Machine-translated fan pages and unrelated real-world arms-race definitions are not accepted as proof of a client label.

## Language evidence

| Language | Evidence obtained | Treatment |
|---|---|---|
| English | Player guides with in-game screenshots and scoring tables | Canonical reference names; distinguish event and phase |
| German | User's client confirmation; German event/season guides | Wettrüsten confirmed; other names are native explanations with references where needed |
| Japanese | Game8; native-language player guides | 軍拡競争 / 英雄強化 corroborated; other labels remain explanations unless individually evidenced |
| Korean | Player page stating that phase labels were checked against the client; Korean player guides | 군비경쟁 / 영웅 강화 corroborated; conflicting older 영웅 증가 not adopted |
| French | French alliance guide | Course à l’armement corroborated as community usage; no official-client claim |
| Italian | Italian guide | Corsa agli armamenti corroborated as community usage; no official-client claim |
| Indonesian | Indonesian guide | Perlombaan Senjata corroborated as community usage; no official-client claim |
| Portuguese | Portuguese player article | Corrida Armamentista corroborated as community usage; no official-client claim |
| Dutch | Localized guides, no independently verified client strings | Native descriptions; retain references for named features |
| Thai | Localized guide pages, no independently verified client strings | Native descriptions; Arms Race reference retained |
| Ukrainian | No reliable exact localized client lexicon found | Native descriptions; Arms Race reference retained |
| Arabic | No reliable exact localized client lexicon found | Native descriptions; Arms Race reference retained; RTL retained |
| Swedish | No reliable exact localized client lexicon found | Native descriptions; Arms Race reference retained |
| Khmer | No reliable exact localized client lexicon found | Native descriptions; Arms Race reference retained |
| Filipino | English reference usage found; no reliable exact localized client lexicon | Clear Filipino explanations; retain game references |

## Sources examined

- Official product site: https://www.lastwar.com/de/main.html
- Arms Race, phases, screenshots and scoring: https://www.lastwartutorial.com/arms-race/
- German VS terms: https://lastwar-tutorial.com/allianz-duell/
- German Season 1 terms: https://lastwar-tutorial.com/season-1/
- English Season 1 buildings/resources/event names and screenshots: https://www.lastwartutorial.com/season-1-the-crimson-plague/
- Profession skill reference: https://extremesecrecy.github.io/lastwar-research-trees/guides/profession_hall.html
- Japanese hero-phase guidance: https://game8.jp/lastwar-survival/622848
- Japanese event/phase overview: https://www.higuma-game.online/lastwar-gunnkaku-kyousou/
- Korean client-label comparison: https://hoppershaven.com/last-war-survival/
- Korean player guide (older terminology, used to identify conflict): https://engcode.tistory.com/87
- French alliance event guide: https://teamsnvr.fr/arms-race
- Italian event vocabulary: https://lastwarguide.net/it/eventi/corsa-agli-armamenti
- Indonesian vocabulary: https://lastwar-tutorial.com/id/einheiten-ausbilden-heilen/
- Portuguese player vocabulary: https://seletronic.com.br/last-war-dicas-avancadas-do-jogo/
- Dutch localized vocabulary (not official-client evidence): https://theriagames.com/nl/guide/last-war-survival-skill-medal-guide/
- Thai localized vocabulary (not official-client evidence): https://theriagames.com/th/guide/last-war-survival-arms-race-guide/

## Release and checks

Versioned entry, module import map and styles avoid the previously reproduced old-service-worker/new-HTML mismatch. `npm run release:assets` regenerates the URLs from BUILD_VERSION_BASE. The regression check seeds old module responses and verifies that every release module misses those cache keys. Daily and weekly checklist persistence continues to be checked by the member workflow test.

The automated checks validate coverage, encoding, glossary use across renderers, event/phase distinction, whole-instruction overrides, references, storage and release URL consistency. They do not certify linguistic fluency or exact client labels in all languages. Native-client screenshots remain necessary for a complete official-label match in languages marked without a reliable client lexicon above.
