# Last War contrast refinement — Luna staging (2026-10-10)

Based on the user's direct in-game alliance UI screenshot, improve readability without changing functionality.

- Season roadmap summary stays charcoal with cream/gold secondary caption (previously dark brown in light mode).
- The three pale timeline preview tiles now explicitly use dark navy labels and medium-dark metadata in **both** light and dark themes, instead of inherited white text.
- Current week chapter tile uses navy text for both large label and small caption against warm gold.
- Light theme inactive chapter tiles have distinct silver-blue backgrounds and dark readable text; no similar-on-similar gray.
- The position marker always uses a bright gold background with dark text.
- Past timeline cards use an opaque readable surface, not the former faded 64% opacity.

**QA:** Playwright Chrome light and dark across Season (expanded), Today, Daily, VS and Guides: 10 combinations; 0 JavaScript errors or horizontal overflows. Confirmed text colors through computed styles. `npm run lint` 344 keys ×15 languages, `npm test` 98/98 passed. Version 2026-10-10.8.

Luna staging only; RZSN production is unchanged pending explicit user approval.
