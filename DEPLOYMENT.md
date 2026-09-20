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
