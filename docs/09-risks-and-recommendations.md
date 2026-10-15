# 09 — Risks, decisions and first-week checklist

Purpose: prioritize findings and make missing decisions explicit. Intended reader: engineering lead, PM, operations and new developers. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

**[Inferred]** Impact (H/M/L: high/medium/low) and effort are qualitative estimates for this small codebase; no production frequency, exploitability assessment or delivery estimate is available. “Finding” labels distinguish observed implementation from consequences. All recommended actions below are **[Inferred]** proposals, not implemented changes. Priority groups indicate a suggested order, subject to team decisions.

## Quick wins

| ID | Finding | Evidence (file:line) | Perspective (Arch/Dev/Product) | Impact (H/M/L) | Effort (H/M/L) | Recommended action |
|---|---|---|---|---|---|---|
| Q1 | **[Verified]** Three declared toolbar icons are missing; **[Unknown]** exact install outcome. | [manifest.json:20](../manifest.json#L20); tracked tree contains no icons | Dev/Product | H | L | Restore intended assets or deliberately remove icon declarations in a separate approved code change; smoke-test clean install. |
| Q2 | **[Verified]** Count fields enter `innerHTML` without validation; **[Inferred]** malformed strings introduce markup. | [popup.js:65](../popup.js#L65), [popup.js:77](../popup.js#L77); [synthetic test](tests/runtime.test.cjs) | Arch/Dev | H | L | Validate finite numeric counts and use text nodes or consistent escaping; keep a regression fixture. Do not claim demonstrated script execution. |
| Q3 | **[Verified]** Clear ignores resolved reply bodies; **[Inferred]** an error object can still show “Cleared.” | [popup.js:123](../popup.js#L123), [background.js:90](../background.js#L90) | Dev/Product | M | L | Check `success === true` and surface structured errors consistently. |
| Q4 | **[Verified]** Misleading “latest only” and “with confirmation” comments. | [background.js:3](../background.js#L3), [popup.js:120](../popup.js#L120) | Dev | L | L | Align comments with actual retention/reset semantics after PM intent is settled. |
| Q5 | **[Verified]** No language declaration, live status semantics or reduced-motion rule. | [popup.html:2](../popup.html#L2), [popup.html:19](../popup.html#L19), [popup.css:236](../popup.css#L236) | Product/Dev | M | L | Add language and status semantics, respect motion preferences, and test keyboard/screen-reader/zoom behavior. |
| Q6 | **[Verified]** `storage`/`tabs` permissions have no current calls; CSS is public to pages. | [manifest.json:9](../manifest.json#L9), [manifest.json:26](../manifest.json#L26), both JS files | Arch/Dev | L | L | Review required privileges/resources against Firefox behavior and remove unused declarations if confirmed unnecessary. |

## Medium-term

**[Inferred]** The user has requested configurable instance URLs and extension setup. Treat the [setup plan](11-instance-setup-plan.md) as the next feature brief; coordinate it with M1/M2 identity/selection fixes rather than assuming a configurable host resolves those defects.

| ID | Finding | Evidence (file:line) | Perspective (Arch/Dev/Product) | Impact (H/M/L) | Effort (H/M/L) | Recommended action |
|---|---|---|---|---|---|---|
| M0 | **[Verified]** Host literals exist in the manifest/listener; no instance setting or setup UI. | [manifest.json:11](../manifest.json#L11), [background.js:67](../background.js#L67), [popup.html](../popup.html) | Arch/Dev/Product | H | M | Implement the requested [instance setup plan](11-instance-setup-plan.md): validation, optional host access, local settings, first-run UI and safe switch/reset. |
| M1 | **[Verified]** Store key omits project/tab; **[Inferred]** different projects with equal MR numbers collide. | [background.js:13](../background.js#L13), [background.js:41](../background.js#L41); collision test | Arch/Product | H | M | Define identity using host/project/MR and decide tab/account scoping before changing message shape. |
| M2 | **[Verified]** Display/export choose object-last entry; **[Inferred]** ordinary numeric keys select highest ID rather than recent capture. | [popup.js:24](../popup.js#L24), [popup.js:94](../popup.js#L94); ordering test | Dev/Product | H | M | Define “latest” with PM; store an explicit selected key or timestamp and share selection logic across render/export. |
| M3 | **[Verified]** No payload schema checks; malformed arrays fail render and may escape Copy's error handler. | [background.js:34](../background.js#L34), [popup.js:45](../popup.js#L45), [popup.js:99](../popup.js#L99), [popup.js:111](../popup.js#L111) | Arch/Dev | H | M | Normalize a minimal summary model; validate arrays, element fields and nulls; wrap formatting and clipboard consistently. |
| M4 | **[Verified]** Whole response/map retained and sent; no eviction or size bounds. | [background.js:17](../background.js#L17), [background.js:26](../background.js#L26), [background.js:75](../background.js#L75) | Arch | M | M | Measure large responses, minimize retained fields, enforce body/entry limits and return only requested summaries. |
| M5 | **[Verified]** Clear does not invalidate pending captures or notify all contexts. | [background.js:24](../background.js#L24), [background.js:79](../background.js#L79); clear-race test | Arch/Product | M | M | Decide reset semantics; if required, use a capture generation token and broadcast updated state after clear. |
| M6 | **[Verified]** Endpoints are independently replaced without provenance or revisions. | [background.js:41](../background.js#L41), [popup.js:153](../popup.js#L153) | Arch/Product | M | M | Store provenance, capture time and revision; distinguish partial/stale data and ignore stale UI reads. |
| M7 | **[Verified]** Export does not escape Markdown content; **[Inferred]** upstream formatting can change structure. | [popup.js:97](../popup.js#L97), [popup.js:102](../popup.js#L102), [popup.js:108](../popup.js#L108) | Dev/Product | M | M | Define the export contract, escape appropriate contexts and test backticks, multiline messages and bracket/link syntax. |
| M8 | **[Verified]** No original tests/CI; documentation suite simulates browser APIs only. | Tracked tree; [manifest.json:13](../manifest.json#L13); [runtime harness](tests/runtime.test.cjs) | Dev | H | M | Establish supported Node/Firefox versions, promote useful tests to a maintained suite, and add clean-install/browser integration checks to CI. |

## Strategic

| ID | Finding | Evidence (file:line) | Perspective (Arch/Dev/Product) | Impact (H/M/L) | Effort (H/M/L) | Recommended action |
|---|---|---|---|---|---|---|
| S1 | **[Verified]** Single-host internal-page response integration; **[Unknown]** compatibility contract. | [background.js:1](../background.js#L1), [background.js:67](../background.js#L67), [manifest.json:2](../manifest.json#L2) | Arch/Product | H | H | Own a GitLab/browser support matrix and endpoint contract; evaluate a supported API only after deciding credentials, permissions and product scope. |
| S2 | **[Verified]** Full JSON in memory and clipboard summaries; **[Unknown]** privacy/retention policy. | [background.js:41](../background.js#L41), [popup.js:112](../popup.js#L112) | Arch/Product | H | M | Define data classification, minimization and export policy before durable storage or broad rollout. |
| S3 | **[Unknown]** Distribution, signing, release ownership and rollback are undocumented. | No release/CI configuration in inspected tracked tree; [manifest.json:4](../manifest.json#L4) declares only application version | Dev/Product | H | H | Establish release artifact validation, signing/distribution owner, version policy and rollback procedure. |

## Open questions by owner

**[Unknown]** Each question below requires organizational or live-system evidence absent from the inspected repository.

### Original author / engineering owner

- Why was a numeric MR-only key chosen? Was operation intentionally restricted to one project at a time?
- Where are the three original icon files, and has this exact checkout ever loaded successfully in Firefox?
- Which GitLab version and actual response fixtures were used during development?
- Are there tests, requirements, design records, a license or release artifacts outside this repository?
- Was `persistent: true` or the declared `storage`/`tabs` privilege required by a past behavior that should still be supported?

### Product manager

- Which “latest” semantics, personas, supported hosts and MR completeness guarantees are desired?
- Should missing endpoint data look different from zero commits/files?
- What should Clear promise when requests are still running, and should any other contexts update immediately?
- Is exported Markdown intended to preserve upstream formatting or neutralize it?
- Is the green dot meant to communicate capture activity, MR status, or simply decoration?

### Operations / security / release owner

- How does a new hire obtain host access and approved GitLab project permissions?
- Which Firefox versions, managed policies, distribution channel and signing process are approved?
- What captured fields are sensitive, and what clipboard/logging/retention restrictions apply?
- Who owns GitLab upgrades, endpoint compatibility checks, browser release checks and incident triage?

## First-week onboarding checklist

**[Inferred]** This proposed checklist builds familiarity before making behavior changes. Live steps require resolving the installation/access gaps described in [getting started](02-getting-started.md).

| Day | Outcome / checklist |
|---|---|
| 1 | Read the [overview](01-overview.md) and [setup guide](02-getting-started.md); run syntax checks and offline tests; record the source hash; report the missing icon assets. |
| 2 | Trace a synthetic capture through buffering, JSON parsing, memory assignment, notification, popup read and render using the [code guide](04-code-guide.md). Explain why no external database is involved. |
| 3 | Reproduce numeric-key ordering, project collision and the clear race in the harness. Review actual host access and sanitized endpoint shapes with the owner if available. |
| 4 | Review identity, “latest,” Clear and export requirements with PM/engineering. Pick a scoped issue such as validated count rendering; propose regression expectations before implementation. |
| 5 | With assets/access resolved, perform a Firefox smoke test covering capture, partial state, Copy/Clear and errors; record supported versions, update docs and submit the first focused change through the team's review process. |

Next: [10 — Glossary](10-glossary.md).
