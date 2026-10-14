# Governance checks and their limits

Sources checked 14 October 2026. This desk records evidence for a human steward. A clean result means these record checks passed. It does not certify legal compliance, source-data accuracy or effective security controls. No fixed legal retention period is invented.

| Rule | Record check | Basis |
|---|---|---|
| GOV01 | Active asset has an owner and a known classification | Local governance policy, not legislation |
| NZ08 | Personal or sensitive asset, or asset containing such a field, has a recorded review, a future/current review date and no pending metadata changes | Practical evidence control informed by NZ Privacy Principle 8 |
| NZ09 | Such an asset has a purpose and retention rationale | Practical evidence control informed by NZ Privacy Principle 9 |
| GOV02 | Such an asset has a security review reference | Local governance policy, not an assessment of the actual controls |

[NZ Privacy Principle 8](https://www.privacy.org.nz/privacy-principles/8/) requires reasonable steps to ensure personal information is accurate, up to date, complete, relevant and not misleading before use or disclosure. Recording a review of a catalogue description does not establish that the underlying customer records meet that duty. The steward must examine the source and record the evidence reference.

[NZ Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) says personal information must not be kept longer than necessary for its lawful purposes. This build flags missing retention rationale; it cannot decide the necessary period, enforce destruction in a source system or resolve another legal retention duty. Review dates are chosen by the operator as local policy, not represented as statutory deadlines.

Review requires an owner, description, classification, evidence and a future next-review date. For personal or sensitive records it also requires purpose, retention rationale and security evidence. Field, term-link, metadata and import changes invalidate the review. Immutable review snapshots keep the asset, field and linked-term definitions seen at that point. Quality observations and audit rows are append-only for ordinary writes. Database administrators can still alter them. Actor names and evidence references are operator supplied, not authenticated signatures.

The commands use one trusted organisation database. Public permissions are revoked and row-level security has no public policies. Deploy using a database owner connection for the internal desk, never an anonymous browser client. Separate organisations need separate databases. Access roles, backups and private report delivery are installation decisions. Exports and drafts contain internal metadata and must stay private. Do not import raw customer values or secrets into descriptions. Australian or other legal requirements need separate scoped rules before relying on this for that jurisdiction.
