---
description: review in the data catalogue desk
---

# review

Run `npm run catalog -- review <asset> --next-due=YYYY-MM-DD --evidence= --actor=`. Add `--json` for structured data.

Read the full asset first. Confirm the owner, classifications and evidence reference. Ask the operator for the next review date. It is local policy, not a legal deadline. Never certify source data from metadata alone.

Names are case insensitive. When ambiguous, show the candidates and let the operator choose the id. Writes require --actor with the responsible operator. Nothing sends, deletes or changes a source system.
