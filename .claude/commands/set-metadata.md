---
description: set metadata in the data catalogue desk
---

# set metadata

Run `npm run catalog -- set-metadata <asset> [--owner= --classification= --purpose= --retention= --security= --description=] --actor=`. Add `--json` for structured data.

Present the records in plain language. Name missing evidence and stale dates. Never infer source-data accuracy from a catalogue entry.

Names are case insensitive. When ambiguous, show the candidates and let the operator choose the id. Writes require --actor with the responsible operator. Nothing sends, deletes or changes a source system.
