# Repository onboarding

Purpose: entry point and reading order for the repository documentation. Intended reader: every new team member. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

**[Verified]** GitLab Network Catcher 2.0 is a small browser extension: its persistent background script intercepts two merge request (MR) JSON response types on one configured GitLab host, saves parsed responses in memory, and supplies a toolbar popup that displays commits and changed files, copies a Markdown summary, and clears captured data. The executable entry points are declared in [manifest.json:13](../manifest.json#L13); capture is implemented in [background.js:7](../background.js#L7), and presentation/actions in [popup.js:8](../popup.js#L8). **[Inferred]** This supports developers or reviewers collecting change summaries; the repository does not document its intended audience.

## Evidence notation

- **[Verified]** means directly read in the checked-out source, inspected commit history, or the documentation checks explicitly identified below. A code citation describes implementation, not proof of a successful live deployment.
- **[Inferred]** means a conclusion or proposed action based on the cited evidence. Recommendations and platform setup instructions use this label when they extend beyond repository code.
- **[Unknown]** means the available repository/history cannot settle the point. Unknowns are retained rather than filled with assumed behavior.

**[Verified]** Source links use paths relative to these documents and `#L` line anchors; visible citations include the source line. These documents describe the source commit above. Documentation and its new test harness are additions made during this audit, not features present in that commit. See [verification results](verification.md).

**[Verified]** All instance addresses in documentation and its synthetic fixtures use `https://gitlab.example.com` as a placeholder. The private source hostname is intentionally omitted; this does not change the hard-coded application configuration. The new [instance setup plan](11-instance-setup-plan.md) specifies proposed work, not current functionality. The [project README](../README.md) introduces the repository and the [root gitignore](../.gitignore) excludes local artifacts.

## Reading order by role

| Reader | Suggested order |
|---|---|
| New developer | [Overview](01-overview.md) → [Getting started](02-getting-started.md) → [Code guide](04-code-guide.md) → [Data model](06-data-model.md) → [Integrations](07-api-and-integrations.md) |
| Architect | [Overview](01-overview.md) → [Architecture](03-architecture.md) → [Data model](06-data-model.md) → [Risks](09-risks-and-recommendations.md) |
| Product manager | [Product guide](05-product-guide.md) → [Risks and open questions](09-risks-and-recommendations.md) |
| Operations/security | [Operations](08-operations.md) → [Integrations](07-api-and-integrations.md) → [Risks](09-risks-and-recommendations.md) |
| Everyone | [Glossary](10-glossary.md); [verification and remaining gaps](verification.md) |
| Instance configuration work | [Proposed instance configuration and setup](11-instance-setup-plan.md) → [Risks](09-risks-and-recommendations.md) → [Developer guide](04-code-guide.md) |

## Scope and important limits

**[Verified]** All eleven requested topics apply and are included. The inspected pre-documentation tree contains only five application files; no README, tests, dependency manifest, lockfile, environment sample, Dockerfile, CI configuration, or infrastructure definition is tracked. Inventory evidence: [manifest.json](../manifest.json), [background.js](../background.js), [popup.html](../popup.html), [popup.js](../popup.js), [popup.css](../popup.css), and `git ls-tree -r --name-only 9b02e7d`.

**[Unknown]** A clean checkout's live Firefox installation and authenticated GitLab operation have not been demonstrated. **[Verified]** Three icon paths referenced by the manifest are missing. Follow [getting started](02-getting-started.md) for the installation attempt and independent offline checks; it identifies the unresolved asset gap. The source is unchanged by this documentation work.

**[Verified]** No deployment diagram is included because the repository contains no infrastructure or deployment definition. The architecture document instead diagrams the runtime browser containers. **[Unknown]** GitLab server internals, organizational access policy, production packaging/signing and supported browser versions are outside the available evidence. **[Inferred]** The requested configuration improvement is captured separately as a proposal; no other roadmap is assumed.

## Documentation support files

- [Runtime characterization tests](tests/runtime.test.cjs): **[Verified]** new documentation-only tests exercising the actual JavaScript in an isolated Node virtual machine with simulated browser APIs.
- [Documentation checker](tools/check-docs.cjs): **[Verified]** new checker for local Markdown links, source line bounds, evidence labels, required document metadata, diagram extraction, and index coverage.
- [Optional diagram renderer](tools/render-diagrams.mjs): **[Verified]** documentation-only rendering script; its tooling is separate from the extension runtime. See the [verification report](verification.md) for dependency requirements.
- **[Verified]** Eleven generated SVG copies are linked beside their Mermaid definitions in the architecture, code, product and data guides; [.gitignore](.gitignore) excludes temporary renderer tooling.
- [Verification report](verification.md): **[Verified]** records executed checks, diagram validation, and limitations.

Next: [01 — Overview](01-overview.md).
