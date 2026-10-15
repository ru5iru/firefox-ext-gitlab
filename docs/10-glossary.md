# 10 — Glossary

Purpose: define the vocabulary used in this repository and its documentation. Intended reader: anyone new to the project or domain. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

| Term | Meaning in this project and evidence |
|---|---|
| GitLab Network Catcher | **[Verified]** Extension name; manifest application version is `2.0` ([manifest.json:3](../manifest.json#L3)). |
| GitLab host / instance | **[Verified]** The current source permits one hard-coded HTTPS origin, documented only as the placeholder `https://gitlab.example.com`; it is not user-configurable today. **[Unknown]** Its deployed version and ownership procedures are not documented ([manifest.json:11](../manifest.json#L11)). |
| Instance configuration / setup | **[Inferred]** Proposed first-use URL validation, host permission grant and locally saved instance setting, with later edit/reset. These are planned behaviors, not existing UI or storage ([setup plan](11-instance-setup-plan.md)). |
| Merge request / MR | **[Inferred]** Proposed change being summarized through title, commits and files; upstream paths contain `merge_requests` ([background.js:1](../background.js#L1), [popup.js:24](../popup.js#L24)). |
| MR number / `mergeRequestId` | **[Verified]** Numeric-string regex capture used as the entire store identity; it is not paired with project information ([background.js:13](../background.js#L13)). **[Unknown]** Its exact upstream identifier contract is not documented. |
| Commit | **[Verified]** Popup list item sourced from `commits_without_merge_commits`, displayed using `message` ([popup.js:38](../popup.js#L38)). **[Inferred]** Represents a recorded code change; filtering of merge commits is an upstream convention, not implemented here. |
| Changed file | **[Verified]** An item in `diff_files`, displayed by `new_path` plus added/removed counts ([popup.js:54](../popup.js#L54)). |
| `cached_widget` | **[Verified]** Captured endpoint type supplying the title and commit array to the UI, not an extension cache algorithm ([popup.js:25](../popup.js#L25)). |
| `diffs_metadata` | **[Verified]** Captured endpoint type supplying `diff_files` ([popup.js:54](../popup.js#L54)). No patch text is rendered. |
| Endpoint | **[Verified]** One of the two URL-path types matched by the regex. The extension observes responses rather than creating these requests ([background.js:1](../background.js#L1)). |
| Background script | **[Verified]** Persistent browser extension context running `background.js` and owning response memory ([manifest.json:13](../manifest.json#L13)). |
| Popup / browser action | **[Verified]** Toolbar UI entry that loads `popup.html` ([manifest.json:17](../manifest.json#L17)). |
| Manifest Version 2 / MV2 | **[Verified]** Browser extension manifest format selected by `manifest_version: 2`; distinct from application version `2.0` ([manifest.json:2](../manifest.json#L2)). |
| Stream filter / pass-through | **[Verified]** Browser response filter whose `ondata` handler saves and writes the same bytes before stop parsing ([background.js:16](../background.js#L16), [background.js:19](../background.js#L19)). |
| JSON | **[Inferred]** JavaScript Object Notation, a text data format. **[Verified]** Parsed by `JSON.parse`; syntactically valid values receive no schema validation ([background.js:34](../background.js#L34)). |
| UTF-8 | **[Verified]** Character encoding passed to `TextDecoder` after chunks are concatenated ([background.js:33](../background.js#L33)). |
| `latestResponse` | **[Verified]** Background map of multiple MR buckets; also the popup's separate saved snapshot. The name does not establish recency ([background.js:4](../background.js#L4), [popup.js:5](../popup.js#L5)). |
| Snapshot / DTO | **[Inferred]** Snapshot means the response last received by the popup; a DTO is a proposed normalized data transfer object, not an implemented class ([popup.js:9](../popup.js#L9), [architecture](03-architecture.md)). |
| `getResponses` | **[Verified]** Runtime message returning the full background map or `null` ([background.js:74](../background.js#L74)). |
| `clearResponses` | **[Verified]** Runtime message resetting the map to `null`; it does not cancel pending requests ([background.js:79](../background.js#L79)). |
| `responsesUpdated` | **[Verified]** Notification after successful capture; popup reacts with another read ([background.js:50](../background.js#L50), [popup.js:149](../popup.js#L149)). |
| Markdown | **[Verified]** Copy's text format, using bold headings, backtick paths, list markers and real newlines ([popup.js:97](../popup.js#L97)). |
| HTML escaping | **[Verified]** Converting text through a DOM element's `textContent`/`innerHTML` before interpolation; count fields currently bypass it ([popup.js:81](../popup.js#L81), [popup.js:65](../popup.js#L65)). |
| HTML / CSS / DOM | **[Inferred]** Hypertext Markup Language defines the popup document; Cascading Style Sheets defines appearance; the Document Object Model is the browser's programmable document structure. **[Verified]** These are connected through [popup.html:6](../popup.html#L6), [popup.html:29](../popup.html#L29) and [popup.js:1](../popup.js#L1). |
| HTTP / HTTPS | **[Inferred]** Hypertext Transfer Protocol carries web requests/responses; HTTPS is its encrypted transport form. **[Verified]** The extension's host filter specifies HTTPS ([background.js:67](../background.js#L67)). |
| CLI / SVG / ER | **[Inferred]** Command-line interface; Scalable Vector Graphics (the optional diagram output); entity-relationship diagram (the logical data-model view). **[Verified]** CLI commands here are development tooling, not an implemented extension interface ([verification](verification.md)). |
| TTL / eviction | **[Inferred]** A time limit / removal policy for retained data. Neither is implemented; store writes only initialize or overwrite endpoint slots ([background.js:36](../background.js#L36)). |
| Characterization test | **[Verified]** Audit-added test recording existing source behavior, including defects, through simulated browser/DOM APIs ([tests/runtime.test.cjs](tests/runtime.test.cjs)). It is not a live Firefox acceptance test. |
| CI/CD | **[Inferred]** Automated integration checks / release delivery; no pipeline definition exists in the inspected tracked tree. |
| AMO / signing | **[Inferred]** Mozilla's add-on distribution service / authentication of a distributable add-on; mentioned as an open release decision, not configured here ([operations](08-operations.md)). |

Next: [Verification and remaining gaps](verification.md), or return to the [documentation index](README.md).
