# Data Catalog for Claude Code

Know who owns a definition, what depends on it and when it was last checked. Your data catalogue, glossary and steward-review evidence in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT code. Install it and keep the records. | Enterprise DNA maps your Dataedo export, adds your rules and builds the screens or connections you need. | Omni by Enterprise DNA installs, connects and operates your version. |
| Your machine and database. | Your preferred stack. One setup fee, then a retainer. | One setup fee, then a monthly retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=dataedo).

## Start with synthetic records

Node 20 or later. No server or account required for the local demo.

```bash
npm install
npm run demo
npm run catalog -- weekly-review
npm run catalog -- impact Customers --json
npm run view
npm run docs
npm test
```

Works with Claude Code, Codex, OpenCode or Cursor. Read CLAUDE.md and AGENTS.md. Slash recipes live in .claude/commands, and every result comes from the same CLI.

The default is embedded PGlite in .data/db. DATA_DIR chooses another local directory. DATABASE_URL selects PostgreSQL. Keep real records separate from the demo. Use a trusted database owner connection, not a browser or anonymous client. Public permissions are revoked and row-level security has no public policies. This is one organisation's internal desk, not a hosted multi-tenant portal.

## What your team does each week

| Job | Command |
|---|---|
| assets | /assets |
| fields | /fields |
| glossary | /glossary |
| review queue | /review-queue |
| owner workload | /owner-workload |
| definition gaps | /definition-gaps |
| sensitive register | /sensitive-register |
| lineage | /lineage |
| issues | /issues |
| quality | /quality |
| attention | /attention |
| compliance | /compliance |
| history | /history |
| unlinked terms | /unlinked-terms |
| asset | /asset |
| impact | /impact |
| weekly review | /weekly-review |
| add | /add |
| describe field | /describe-field |
| add field | /add-field |
| set metadata | /set-metadata |
| define term | /define-term |
| link term | /link-term |
| link lineage | /link-lineage |
| review | /review |
| raise issue | /raise-issue |
| resolve issue | /resolve-issue |
| log quality | /log-quality |
| import | /import |
| export | /export |
| draft review | /draft-review |
| Customise fields and review rules | /customise |
| Add a report | /new-view |

The five core rituals are the steward review queue, glossary maintenance, change-impact assessment, quality evidence review and the Monday review. Use npm run catalog -- help for exact syntax. Options take --name=value. Add --json for machine output. Partial ids and names are accepted; ambiguous matches print candidates and exit 1.

## Ten questions for your own records

These questions run today using the commands shown. Dataedo also offers ownership, lineage and quality reporting. This is not a claim that its dashboard cannot answer similar questions. The benefit is owning and changing the combined checks for your business.

- Which overdue definitions belong to the same owner as a failed quality check? owner-workload, quality
- Which customer-data records lack a retention rationale? compliance
- Which reports are downstream of a customer register with unresolved issues? asset Customers, impact Customers
- Which personal-data fields still have no definition? fields, definition-gaps
- Which definitions changed after the last steward review? review-queue, asset
- Which business terms have no linked records? unlinked-terms
- Which owners carry the most overdue reviews and open actions? owner-workload
- Which recorded quality rules have the highest failure rate? quality
- Which unassigned archives need an owner before review? review-queue
- Which evidence and operator support the latest review decision? asset, history

## Your first hour: ten things to ask for

1. Put our name, logo and colours on the dictionary.
2. Show the assets without owners.
3. Find personal-data fields without definitions.
4. Show the reports downstream of Customers.
5. List our overdue reviews with open issues.
6. Show quality observations and their evidence.
7. Preview our Dataedo export and reconcile counts.
8. Draft the Monday steward review.
9. Add a business-criticality field through a migration.
10. Create a report grouping reviews by owner.

## Bring your Dataedo documentation

```bash
npm run catalog -- import dataedo --file=imports/dataedo.xlsx --sheet=Tables --columns-sheet=Columns --map=examples/import-map.json --actor="Migration operator" --dry-run
npm run catalog -- import dataedo --file=imports/dataedo.xlsx --sheet=Tables --columns-sheet=Columns --map=examples/import-map.json --actor="Migration operator"
```

Dataedo exports configurable Excel workbooks. Inspect your selected sheets and headings, then map them once. CSV sheets saved from Excel are also supported. The importer handles asset and field definitions, preserves source rows, rejects missing parents and duplicate identities, rolls back the whole file on failure and flags changed records for review. An identical repeat makes no changes. It does not migrate permissions, connector configuration, profiling samples, existing reviews or automatic lineage. See the [replacement guide](docs/replace-dataedo.md).

## Evidence you can inspect

An operator records quality observations with the number examined, the number failed, the observation date and an evidence reference. The system calculates failure rates. It does not scan a production database. Recorded lineage links support transitive impact questions and handle cycles. Unrecorded links remain unknown.

Reviews preserve the asset and field definitions seen at the time. Metadata changes invalidate the current review. The [governance checks](docs/compliance.md) flag missing ownership, classifications, accuracy-review evidence and retention rationale. They do not certify compliance. Evidence strings and actor names are operator supplied. History blocks ordinary updates and deletes, but administrators can change it.

## Read-only views and documents

brand.json sets your name, logo reference and colours. npm run view writes the steward desk and governance checks to views/. npm run docs writes data dictionaries, steward review records and change-impact briefs to docs-out/. Open the HTML privately or print it to PDF. Regenerate after records change. No buttons change records. [Why no front end](docs/why-no-front-end.md).

## What is built and what needs scoping

The base covers a catalogue desk over recorded metadata. It has no automatic source connectors, automatic lineage extraction, profiling engine, role-managed web portal or mobile application. These are separate implementation work for your version. Dataedo itself supports on-premises deployment and export; the choice is whether to license its product or maintain your own narrower desk. [Selection research](docs/research.md).

## Validation

npm test uses a temporary database and tests every CLI command, repeated migrations and seed, XLSX and CSV import, mapping, rollback, repeat detection, changed metadata, evidence snapshots, lineage cycles, draft isolation, complete exports and escaped HTML. The included GitHub workflow runs Node 20 and 22 on Linux and Windows and PostgreSQL 17. TEST_DATABASE_URL must only point to a disposable database.

MIT licence. Not affiliated with Dataedo or Anthropic. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=dataedo).
