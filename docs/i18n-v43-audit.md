# Luna v43 – 15-language localization audit (15 October 2026)

## Scope / methodology
Locales exactly: de, en, uk, ja, fr, it, id, ar, ko, sv, pt, nl, th, km, fil. German is the source language; game proper nouns and Last War ranks R1–R5 are immutable. Personal member names, comments, OCR texts, and numbers are never sent to online translation and cannot be rewritten in private API records.

1. Browser Chrome/CDP public **90 combinations**: each of 15 languages × 6 destinations (Today, Tasks, VS, Season, Guides, Admin login) at emulated mobile width 390 px; checked document lang, visible text, text-node Unicode replacement characters U+FFFD, suspected German UI words, scrollWidth/overflow. Results stored privately on Zentrale, not in the GitHub repository.
2. Initial 390px guide-category tiles: genuine localized-label width overflow seen in uk (1 element), fr (5), id (1), nl (1). Fixed text min-width and overflow-wrap in the existing guide tile, not global overflow masking. Rechecked Guides in **15/15 languages**: zero overflowing elements on sampled screens.
3. Actual synthetic officer-DOM test: **15 locales × 14 panels = 210 panel render checks**, no crash, no damaged Unicode, no unapproved chat/mail report controls. Synthetic R4 data, not a genuine Cloudflare session.
4. Translation integrity test: **344 public dictionary keys × 15**, **748 officer exact-match entries per non-German language**, all public/guide/HUD/overview/season resource tables plus private exact/dynamic/fragment dictionaries. Tests require nonempty content, equal keys, preserved {placeholders}, no Unicode replacement/control bytes or unsafe inserted markup.
5. Dynamic private values: tests preserve private member names, player metric values, dates and partial/unknown state; English-authored VS labels and count sentences checked in all 13 non-English/non-German languages.
6. Manual spot-check images: Arabic RTL, French, Japanese, Khmer, Ukrainian and other samples; retain valid gaming terms rather than blindly translating player IDs or Last War names.

## Per-locale results

| Locale | Six public route render checks | Synthetic 14 admin panels | Guide-overflow after repair | Unicode / broken placeholders |
|---|---:|---:|---|---|
| de | 6/6 | 14/14 | no | no |
| en | 6/6 | 14/14 | no | no |
| uk | 6/6 | 14/14 | no | no |
| ja | 6/6 | 14/14 | no | no |
| fr | 6/6 | 14/14 | no | no |
| it | 6/6 | 14/14 | no | no |
| id | 6/6 | 14/14 | no | no |
| ar | 6/6 | 14/14 | no | no |
| ko | 6/6 | 14/14 | no | no |
| sv | 6/6 | 14/14 | no | no |
| pt | 6/6 | 14/14 | no | no |
| nl | 6/6 | 14/14 | no | no |
| th | 6/6 | 14/14 | no | no |
| km | 6/6 | 14/14 | no | no |
| fil | 6/6 | 14/14 | no | no |

## Specific corrections
- R1–R5 had genuine localization corruption in Arabic (R → ص), Korean (R등급4), Thai (R → ร) for some dynamic strings. All 15×5 rank identifiers now remain literal R1–R5, including rank-label and name/rank combinations; regression test protects this.
- The player power metric must read **Power** in English (not generic **Strength**). A composited source-freshness sentence (`Stärke YYYY-MM-DD · VS YYYY-WNN · ...`) is localized in the UI while leaving the captured date/week and private values untouched. Existing live synthetic reconciliation tests protect this behavior.
- Officer UI dynamic VS count sentences and untranslated English-authored labels have complete, language-specific fallback coverage; member-generated text remains untouched.
- Public guide-category tiles now wrap long localized labels at narrow widths without obscuring or clipping them.
- Internal report draft strings are no longer rendered; original report data/code stays available for an eventual redesign without cluttering the officer experience.

## Remaining limitations – do not declare 100% linguistic perfection
Automated coverage verifies *completeness, renderability, scripts, placeholder integrity, and selected localized wording*, not natural grammar or native cultural fluency for every long guide paragraph. The 90 browser routes were mobile-width samples; other route subchapters, expanded admin forms, RTL screen readers, non-390 widths, physical iPhone/Safari, and true role-authenticated OCR operations require deeper acceptance. Manually review DE/EN and engage native readers for uk/ja/fr/it/id/ar/ko/sv/pt/nl/th/km/fil before assigning 9.5/10 translation quality.
