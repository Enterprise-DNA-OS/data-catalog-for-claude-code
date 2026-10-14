# Replace the catalogue desk in Dataedo

Checked 14 October 2026. The free build handles asset and field documentation, business terms, steward reviews, manually recorded asset lineage, issues and quality evidence. It does not claim parity with Dataedo source connectors, automatic lineage extraction, profiling, permission groups or its web portal.

## Export from Dataedo

The [Dataedo Portal Excel export guide](https://docs.dataedo.com/data-catalog/building-catalog/sharing/exporting-documentation/excel-export-portal/) documents an Excel export with configurable scope and sheets. It requires a configured Dataedo Agent and edit permission. Open Export to Excel from an asset listing, choose the data sources in Scope, include Tables and Columns in Sheets, and include the source, namespace, object name, descriptions and data types. Download the completed workbook. The workbook contains a summary and separate object sheets. Keep the original as your migration evidence.

Dataedo lets you select properties, so headings and included sheets vary. Inspect the downloaded headings and edit examples/import-map.json to match. The supplied sample rows are synthetic, not a certified tenant export. Source, namespace and object name identify an asset. The field identity also includes its parent asset and field name. Keep these identities consistent across imports. Renamed assets require an explicit migration; they are not matched by guesswork.

## Import with one command

```bash
npm run catalog -- import dataedo --file=imports/dataedo.xlsx --sheet=Tables --columns-sheet=Columns --map=examples/import-map.json --actor="Migration operator" --dry-run
npm run catalog -- import dataedo --file=imports/dataedo.xlsx --sheet=Tables --columns-sheet=Columns --map=examples/import-map.json --actor="Migration operator"
```

Use --header-row=2 if the headings are on the second row. Select the actual sheet names in your workbook. Only the selected asset and column sheets are read. Empty sources or names, duplicate identities, unsupported object types and missing parents fail the whole import. A dry run executes the same validation and rolls every write back. An identical repeat adds no records or history. Changed source descriptions or field details set review_required and preserve the old values in history. Existing local ownership and classification stay intact.

For spreadsheets saved as UTF-8 CSV:

```bash
npm run catalog -- import dataedo --file=examples/dataedo-tables.csv --columns-file=examples/dataedo-columns.csv --actor="Migration operator" --dry-run
```

Quoted commas, quoted line breaks, BOM, CRLF and doubled quotes are supported. Source fields are preserved with each asset or field. Import tables and views together only when their source/schema/name combination is unique. Select an export containing only the supported table, view, report, file and dataset types.

## What maps

| Export property | Destination |
|---|---|
| Source, Schema, Name | Asset identity |
| Type | Table, view, report, file or dataset |
| Description | Asset description |
| Column parent, name, type, description | Field dictionary |
| Other exported properties | Original source row, not operational fields |

The import does not migrate terms, lineage, certifications, workflows, permissions, attachments, profiling samples, automatic connectors or change history. Bring these over with a reviewed mapping or use the supported commands to record them. No live source database is contacted. Quality observations are entered from evidence you already have; the CLI does not run checks against production data.

## Reconcile before switching

Compare source asset and field counts with the imported subset. Check descriptions, report names, duplicate names across namespaces and personal-data classifications. Assign owners, record retention rationale and security evidence, then run the review queue and compliance checks. Import does not mark records reviewed. Run both desks until the owners have accepted the mapping. Keep Dataedo for any automatic scanning, portal or source coverage you still depend on until the replacement has been scoped and verified.

One-command import follows export and mapping. A small catalogue can be assessed in a day; total migration time depends on the records and integrations. Enterprise DNA scopes these with you through Omni by Enterprise DNA, for one setup fee then a retainer.
