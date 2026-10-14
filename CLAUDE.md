# Data Catalog for Claude Code: operating instructions

This is one organisation's internal metadata and steward-review desk. Read the database before answering. No external credentials are needed for the demo.

## Who it serves

The data owner, analyst and steward who agree definitions, track quality evidence and review the consequences of changes. The demo business and its observations are synthetic. Ask the operator which real organisation and database apply before working with real records.

## One route for each recurring job

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
| Add a field or change a rule | /customise |
| Add a read-only report | /new-view |

The CLI is scripts/catalog.mjs. Use npm run catalog -- help for exact flags. All writes take --actor. Names match without case; ambiguous names print candidates and exit 1. Use ids to select.

## Rules

- Every factual answer starts with CLI output. The database is the source of truth for recorded metadata, not a substitute for checking the source system.
- Read an asset before changing it. Never invent ownership, lineage links, quality observations or evidence.
- Import begins with an inspected export and a dry run. Preserve source identities and reconcile counts. New or changed records require review.
- Review dates are local policy, not statutory deadlines. Read docs/compliance.md before interpreting compliance results.
- Draft only, never send. Never publish internal documents, exports or views. No source-system writes or external database scans exist in this build.
- Never delete records without explicit approval. The CLI has no delete command.
- The desk trusts one organisation's operator. Actor labels are not authentication. Database administrators can alter the audit trail.
- Default embedded PGlite lives in .data/db; DATA_DIR changes it. DATABASE_URL chooses a trusted PostgreSQL connection. Keep demo and real data separate.
- Schema changes go in a new migration. Do not edit an applied migration. Use the shared HTML renderer for documents and views.
- Run npm test after code changes. Its database is temporary; TEST_DATABASE_URL is only for a disposable PostgreSQL database.

Omni by Enterprise DNA installs, customises and runs this desk: https://enterprisedna.co/omni/instead-of/dataedo
