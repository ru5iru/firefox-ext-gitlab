# 02 — Set up, run, test and debug

Purpose: give a clean-machine setup route with explicit prerequisites and blockers. Intended reader: a new developer. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

## Prerequisites and what is not known

| Need | Reason and confidence |
|---|---|
| Firefox desktop | **[Inferred]** The intended development runtime, based on `browser.webRequest.filterResponseData` and the persistent MV2 manifest ([background.js:16](../background.js#L16), [manifest.json:2](../manifest.json#L2)). **[Unknown]** No exact supported version is recorded or live-tested. |
| Repository checkout and Git | **[Verified]** The runtime files are local source assets referenced by [manifest.json:13](../manifest.json#L13); use your team's supplied clone URL or existing checkout. **[Unknown]** No public clone URL is documented here. |
| GitLab access | **[Inferred]** Live capture requires access to the configured host and an MR page that makes the matching requests. **[Unknown]** Account provisioning, VPN, SSO and project access requirements are not in the code. |
| Node.js for offline checks only | **[Verified]** The new [test harness](tests/runtime.test.cjs) uses built-in Node modules; it was run with Node `v22.22.1`. The extension itself has no Node imports. **[Inferred]** Use Node 22 to reproduce the documented checks. |

**[Inferred]** Install Firefox from [Mozilla](https://www.mozilla.org/firefox/) and Node 22 from the [Node.js downloads](https://nodejs.org/en/download) when needed. These are tool acquisition instructions, not repository-defined version requirements.

## Check the checkout

**[Verified]** Run these commands from the repository root; they were exercised during this audit. Neither an `npm install` nor a server start is defined by this repository.

```powershell
git rev-parse HEAD
node --version
node --check background.js
node --check popup.js
node --test docs/tests/runtime.test.cjs
node docs/tools/check-docs.cjs
```

**[Verified]** The source baseline is `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0`. Passing offline tests proves the simulated cases in [verification](verification.md), not real Firefox installation, host connectivity, or clipboard permission.

## Load the extension

**[Inferred]** Use Mozilla's [temporary installation procedure](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/): open Firefox, navigate to `about:debugging`, select **This Firefox**, choose **Load Temporary Add-on**, and select the repository's `manifest.json`. This is the appropriate development route for the entry points declared at [manifest.json:13](../manifest.json#L13). Temporary installation must be repeated after restarting Firefox, per Mozilla's platform guide.

**[Verified]** There is an unresolved checkout defect: `default_icon` references three absent assets ([manifest.json:20](../manifest.json#L20)). **[Unknown]** Whether the selected Firefox build rejects this checkout or falls back to a default icon was not tested. If installation reports missing icons, obtain the original assets from the maintainer at the three exact manifest paths; this documentation task has not created or removed those assets. There is no evidence-backed, guaranteed clean-machine live run until installation is validated. Offline checks remain available independently.

**[Inferred]** After successful installation:

1. Open an MR on the configured host in a normal Firefox tab using your existing authorized account.
2. In the page's Network panel, look for the two path patterns documented in [integrations](07-api-and-integrations.md). Reload the MR or visit its changes view if no matching request occurs; this is a diagnostic step, not a promise about GitLab navigation.
3. Open the extension toolbar action. A captured widget can supply a title and commits; diff metadata supplies changed files. Empty sections are omitted ([popup.js:38](../popup.js#L38), [popup.js:54](../popup.js#L54)).
4. Click **Copy** and paste into a local scratch editor. Click **Clear** to empty background memory and the current popup ([popup.js:88](../popup.js#L88), [popup.js:121](../popup.js#L121)). A request already in flight can refill the store.

## Configuration and environment variables

| Setting | Location | Effective value / behavior |
|---|---|---|
| Capture host permission | [manifest.json:11](../manifest.json#L11) | **[Verified]** A hard-coded HTTPS host; documented as the placeholder `https://gitlab.example.com/*`, not its literal source value. |
| Listener host filter | [background.js:67](../background.js#L67) | **[Verified]** Same literal host; changing only one location leaves a mismatch. |
| Endpoint matching | [background.js:1](../background.js#L1) | **[Verified]** Numeric MR path and two endpoint names; no end-of-path anchor. |
| Background lifetime | [manifest.json:15](../manifest.json#L15) | **[Verified]** `persistent: true`; store is still memory only. |
| Environment variables / `.env` | All five source files | **[Verified]** None read or provided. No variable names or credential values are required by extension code. |
| GitLab credentials | No credential field in [popup.html](../popup.html) or request client in [background.js](../background.js) | **[Verified]** Extension has no login/token configuration. **[Inferred]** The browser page's authenticated requests supply the observed responses. |

## Debugging

**[Inferred]** In `about:debugging` use **Inspect** for the loaded extension and inspect the background console/debugger. Useful breakpoints are response parsing ([background.js:34](../background.js#L34)), assignment ([background.js:41](../background.js#L41)), and the message responder ([background.js:74](../background.js#L74)). Use the extension toolbox's popup inspection facilities for [popup.js:8](../popup.js#L8) and [popup.js:112](../popup.js#L112); exact toolbox controls depend on the Firefox build. See Mozilla's [extension debugging guide](https://extensionworkshop.com/documentation/develop/debugging/).

**[Verified]** Background logs include MR number, endpoint, decoded text length and a timestamp, not the full successful JSON ([background.js:43](../background.js#L43)). Initial popup failure replaces output with “Failed to load data”; refresh failure only logs to console ([popup.js:155](../popup.js#L155), [popup.js:167](../popup.js#L167)). **[Inferred]** Reload the extension from `about:debugging` after edits; background reinitialization loses captured data because initialization is `null` ([background.js:4](../background.js#L4)).

## Planned first-run configuration

**[Verified]** There is currently no instance URL field, settings page or saved configuration; the hostname placeholder is not a value you can enter into today's extension. **[Inferred]** The proposed improvement will provide setup on first use, validate an HTTPS instance origin, request its host permission, save it locally and expose Settings for later changes. Follow the [instance setup specification](11-instance-setup-plan.md) for proposed behavior and tests; these are not current setup instructions.

## Common problems

| Symptom | Evidence-backed explanation and next step |
|---|---|
| Missing icon installation error | **[Verified]** Manifest assets are absent. **[Inferred]** Restore original files through the maintainer, then repeat temporary installation. |
| Popup stays empty | **[Inferred]** Check actual host, matching path, request occurrence after extension load, JSON parse errors, and site permission. The capture gate is [background.js:9](../background.js#L9). The extension does not fetch old page responses. |
| Wrong MR displayed | **[Verified]** Selection uses object enumeration, not active tab or timestamp ([popup.js:24](../popup.js#L24)); no tab/project key is stored ([background.js:41](../background.js#L41)). Clear and capture just the target MR as a temporary diagnostic. |
| Title says “Unnamed MR” | **[Verified]** Missing/falsy `cached_widget.title` uses that fallback ([popup.js:25](../popup.js#L25)). |
| “Copied!” but formatting is odd | **[Verified]** Export uses real newlines, but upstream title/messages/paths are not Markdown-escaped ([popup.js:97](../popup.js#L97)). **[Inferred]** Check embedded formatting characters and the destination renderer; see [integrations](07-api-and-integrations.md). |
| Clear succeeds then data returns | **[Inferred]** An existing request's `onstop` can assign after clear; clear does not cancel filters ([background.js:24](../background.js#L24), [background.js:79](../background.js#L79)). |
| Popup notification warning | **[Verified]** Background catches rejected notification promises and suggests the popup may be closed ([background.js:50](../background.js#L50)); a rejected notification does not undo the earlier store assignment. **[Unknown]** The exact rejection reason needs the actual console error. |
| No `npm test` / `npm start` | **[Verified]** There is no package manifest. Use the explicit Node commands above and Firefox's temporary loader. |

Next: [03 — Architecture](03-architecture.md).
