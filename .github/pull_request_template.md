## What does this PR do?

<!-- One or two sentences. Link the task/issue: "Closes #12" -->

## How did you test it?

- [ ] `pytest` passes (backend changes)
- [ ] `npm run build` and `npm run lint` pass (frontend changes)
- [ ] Tried it locally:

## Checklist

- [ ] No secrets, `.env` files or service-role keys in the diff
- [ ] If I changed an API contract: updated `backend/app/schemas/contracts.py`, `frontend/src/types/contracts.ts` and `data/mock/`
- [ ] If I changed the database: added a NEW migration file (never edited an old one)
