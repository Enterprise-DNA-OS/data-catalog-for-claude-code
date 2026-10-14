---
description: import in the data catalogue desk
---

# import

Run `npm run catalog -- import dataedo --file=export.xlsx|tables.csv [--sheet=Tables --columns-sheet=Columns --columns-file=columns.csv --header-row=1 --map=map.json --dry-run] --actor=`. Add `--json` for structured data.

Read docs/replace-dataedo.md first. Inspect the actual workbook headings and choose the supported asset and column sheets. Preview with --dry-run, reconcile counts, then import within the operator brief. Explain unmapped records. Never mark imported metadata reviewed.

Names are case insensitive. When ambiguous, show the candidates and let the operator choose the id. Writes require --actor with the responsible operator. Nothing sends, deletes or changes a source system.
