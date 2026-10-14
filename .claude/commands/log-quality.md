---
description: log quality in the data catalogue desk
---

# log quality

Run `npm run catalog -- log-quality <asset> --rule= --on=YYYY-MM-DD --examined= --failed= --evidence= --actor=`. Add `--json` for structured data.

Only record observations and links backed by evidence supplied by the operator. Do not invent a scan, lineage edge, rule result or evidence reference.

Names are case insensitive. When ambiguous, show the candidates and let the operator choose the id. Writes require --actor with the responsible operator. Nothing sends, deletes or changes a source system.
