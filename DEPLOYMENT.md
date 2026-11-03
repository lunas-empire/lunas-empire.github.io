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
