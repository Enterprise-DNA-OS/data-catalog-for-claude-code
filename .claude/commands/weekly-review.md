---
description: weekly review in the data catalogue desk
---

# weekly review

Run `npm run catalog -- weekly-review `. Add `--json` for structured data.

Read review-queue, quality and issues, then compliance. Summarise overdue decisions, named owners, quality evidence and the next actions. Never claim a live scan was run.

Names are case insensitive. When ambiguous, show the candidates and let the operator choose the id. Writes require --actor with the responsible operator. Nothing sends, deletes or changes a source system.
