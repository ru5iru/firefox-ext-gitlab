# GitLab Network Catcher

Purpose: introduce the project and direct contributors to setup and design documentation. Intended reader: users and developers. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

**[Verified]** A Firefox-oriented browser extension that observes merge request (MR) response data, displays titles, commits and changed files in a toolbar popup, copies a Markdown summary, and clears captured memory ([manifest.json:13](manifest.json#L13), [background.js:7](background.js#L7), [popup.js:8](popup.js#L8)).

## Current capabilities and setup

**[Verified]** The current source uses one hard-coded instance in its host permission and capture listener; it has no instance URL setting or setup screen ([manifest.json:11](manifest.json#L11), [background.js:67](background.js#L67), [popup.html](popup.html)). All documentation uses `https://gitlab.example.com` as a placeholder; it is not the current source value or a working service. Editing documentation does not change capture behavior.

**[Inferred]** For development, use Firefox's temporary add-on loader and the steps in [getting started](docs/02-getting-started.md). **[Verified]** Three icon files referenced by [manifest.json:20](manifest.json#L20) are absent. **[Unknown]** A successful clean-machine install and authenticated GitLab capture have not been established.

**[Verified]** There is no application dependency install, build command or web server. With Node 22 installed, run these offline checks from repository root:

```powershell
node --check background.js
node --check popup.js
node --test --experimental-test-isolation=none docs/tests/runtime.test.cjs
node docs/tools/check-docs.cjs
```

**[Verified]** These documentation-only tests simulate browser APIs; they do not certify a Firefox deployment. Captures are memory-only, and current MR identity/selection and rendering limitations are documented in the [risk register](docs/09-risks-and-recommendations.md).

## Planned instance configuration

**[Inferred]** The requested improvement is a first-run setup flow for entering a GitLab instance URL, validating it, obtaining host permission, and saving the selection for future sessions. It should also provide settings to change the instance safely. This is a documented proposal, not implemented functionality. Read the [instance configuration and setup plan](docs/11-instance-setup-plan.md) for acceptance criteria, affected modules and test scenarios.

## Documentation

- [Documentation index and role-based reading order](docs/README.md)
- [Architecture](docs/03-architecture.md) and [developer guide](docs/04-code-guide.md)
- [Product behavior](docs/05-product-guide.md), [data model](docs/06-data-model.md) and [integrations](docs/07-api-and-integrations.md)
- [Operations](docs/08-operations.md), [risks](docs/09-risks-and-recommendations.md), [glossary](docs/10-glossary.md) and [verification](docs/verification.md)

Next: [Getting started](docs/02-getting-started.md).
