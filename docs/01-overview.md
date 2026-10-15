# 01 — What this repository does

Purpose: introduce the domain, runtime, scope, and repository layout. Intended reader: a developer or product teammate with no project context. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

## Domain and user value

**[Inferred]** A merge request (MR) is the unit of proposed code change being summarized here: the UI combines its title, commit messages, changed file paths, and added/removed line counts. This interpretation follows [popup.js:24](../popup.js#L24), [popup.js:38](../popup.js#L38), and [popup.js:54](../popup.js#L54). A commit is an entry in the server's `commits_without_merge_commits` array; the extension displays its `message`, not a diff or review decision.

**[Verified]** The extension listens on one hard-coded HTTPS host and matches request path fragments `/merge_requests/<digits>/diffs_metadata.json` or `/merge_requests/<digits>/cached_widget.json` ([background.js:1](../background.js#L1), [background.js:67](../background.js#L67)). This documentation represents the private host as `https://gitlab.example.com/*`; that placeholder is not the literal source configuration. The extension does not initiate those requests, create MRs, merge changes, or call a GitLab API client; the complete background script is a request listener and a message responder ([background.js:7](../background.js#L7), [background.js:72](../background.js#L72)).

**[Inferred]** The primary user is someone already using that GitLab instance who wants to inspect or share a change summary. **[Unknown]** The business owner, actual user population, host access procedure, and intended meaning of “latest” are undocumented.

## Stack and entry points

| Area | Evidence-backed description |
|---|---|
| Runtime | **[Verified]** Manifest Version 2 browser extension, application version `2.0`; persistent background script ([manifest.json:2](../manifest.json#L2), [manifest.json:13](../manifest.json#L13)). |
| Language | **[Verified]** Plain JavaScript, JSON, HTML and CSS; native `browser` APIs, `TextDecoder`, DOM APIs and clipboard ([background.js:16](../background.js#L16), [popup.js:81](../popup.js#L81), [popup.js:112](../popup.js#L112)). |
| UI | **[Verified]** Toolbar action loads `popup.html`, which loads `popup.css` and `popup.js` ([manifest.json:17](../manifest.json#L17), [popup.html:6](../popup.html#L6), [popup.html:29](../popup.html#L29)). No UI framework imports. |
| Build | **[Verified]** No transpiler, bundler, package manifest or build script in the tracked tree. Firefox receives the listed source assets directly through the manifest. |
| Store | **[Verified]** One in-memory background object; no `browser.storage` usage despite the permission ([background.js:4](../background.js#L4), [background.js:41](../background.js#L41), [manifest.json:9](../manifest.json#L9)). |
| Tests | **[Verified]** No original tests. This audit adds [offline characterization tests](tests/runtime.test.cjs); they are not browser integration tests. |
| Dependencies | **[Verified]** No vendored dependencies, generated code, lockfiles, or third-party dependency declarations exist in the inspected tracked source tree. **[Unknown]** No browser version compatibility range or browser support matrix is declared. |

## Annotated tree, through three levels

**[Verified]** The application tree below is the complete tracked tree at the verified source commit. The second tree identifies this audit's documentation additions. `.git/` is local version-control metadata, not application runtime code.

```text
firefox-ext-gitlab/
├── background.js     Response interception, memory store, runtime message handlers
├── manifest.json     Browser permissions, host, background and popup entry points
├── popup.html        Header, Copy/Clear buttons, output container
├── popup.js          Rendering, Markdown export, messages, transient feedback
└── popup.css         Layout, colors, scrolling and animations

docs/                 Added by this documentation audit
├── .gitignore        Excludes temporary diagram-validation tooling
├── README.md         Index and evidence policy
├── 01-overview.md ... 11-instance-setup-plan.md
├── verification.md   Checks and gaps
├── diagrams/         Eleven generated SVG copies of the Mermaid diagrams
├── tests/
│   └── runtime.test.cjs
└── tools/
    ├── check-docs.cjs
    └── render-diagrams.mjs
```

## What “latest” actually means

**[Verified]** The background retains an object for every captured MR number and overwrites only a matching endpoint slot; it does not retain just one MR ([background.js:36](../background.js#L36)). The popup chooses `Object.entries(response).pop()` ([popup.js:24](../popup.js#L24)). **[Inferred]** For ordinary positive integer MR keys, JavaScript enumeration makes this select the highest number, even when a smaller number was captured later; the documentation tests reproduce that case. There is also no project or tab in the key, so equal numbers from different projects can be combined. See [identity and lifecycle](06-data-model.md).

## History that is actually available

**[Verified]** `git log --all --stat` exposes eight commits, all dated 2025-08-21. `6016c67` introduced the four-file extension with response buffering and numeric MR keys. `73bf15f` added Markdown copy and changed refresh to fetch responses again. `9b02e7d` introduced the CSS file, HTML escaping, feedback, filter error handling, and the callback-style message responder. Evidence can be reproduced with `git show 6016c67:background.js`, `git show 73bf15f -- popup.js`, and `git show 9b02e7d -- background.js popup.js manifest.json`.

**[Verified]** `popup.js` changes in all eight commits; `background.js` changes in five. No TODO/FIXME/HACK markers were found in the five current source files or matching history search. **[Unknown]** Commit subjects such as “final” and “working” do not establish deployment status, testing success, or rationale.

**[Inferred]** The requested next improvement is configurable instance setup; its scope, state handling and acceptance criteria are in the [setup plan](11-instance-setup-plan.md). **[Verified]** No settings feature has been added to the application in this documentation update.

Next: [02 — Getting started](02-getting-started.md).
