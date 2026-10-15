# 08 — Operations and security posture

Purpose: distinguish existing runtime operations from missing build/release infrastructure. Intended reader: operations, release engineering or security reviewer. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

## Build, environments and deployment

**[Verified]** The five-file tracked application has no package manifest, bundler, dependency lockfile, Dockerfile, environment files, CI/CD pipeline, infrastructure-as-code, release script or artifact/signing configuration. The manifest directly loads the source files ([manifest.json:13](../manifest.json#L13), [popup.html:6](../popup.html#L6), [popup.html:29](../popup.html#L29)). There is no source-defined `build`, `start` or `test` script to invoke.

**[Inferred]** Local development should use Firefox's temporary add-on loader as described in [getting started](02-getting-started.md). A development build step is unnecessary for the existing plain scripts. **[Unknown]** Production packaging, Mozilla signing identity, AMO (Mozilla's add-on distribution service) listing, enterprise distribution, release approver, rollback policy, supported Firefox versions and whether any version was deployed are not recorded. Manifest version `2.0` and the “finalized extension” commit subject are not deployment evidence.

**[Verified]** The only configured environment is a literal HTTPS host in both manifest permission and listener filter ([manifest.json:11](../manifest.json#L11), [background.js:67](../background.js#L67)); no staging/development/prod switch exists. **[Inferred]** With today's implementation, changing the source host requires keeping both locations consistent and reloading/testing the extension. The proposed settings feature below replaces that workflow after implementation. No deployment diagram is supplied because no infrastructure definition exists; use the [runtime container diagram](03-architecture.md).

## Reproducible local checks

**[Verified]** From repository root, the syntax checks and documentation-only suite are real commands used during the audit:

```powershell
node --check background.js
node --check popup.js
node --test docs/tests/runtime.test.cjs
node docs/tools/check-docs.cjs
git diff --check
git status --short
```

**[Verified]** In this managed Windows sandbox, the default Node test runner initially failed to create its worker process (`spawn EPERM`); running with approved subprocess access worked. A subsequently exercised alternative avoids that worker process:

```powershell
node --test --experimental-test-isolation=none docs/tests/runtime.test.cjs
```

**[Inferred]** Use the ordinary command on a normal machine and the isolation-free variant when equivalent process restrictions apply. These checks do not validate Firefox installation or an external GitLab service. Results and Mermaid validation details are in [verification](verification.md).

## Runtime runbook

| Task / symptom | Evidence and operation |
|---|---|
| Inspect capture | **[Inferred]** Inspect the background via Firefox's extension debugger, then follow [background.js:43](../background.js#L43) success logs or [background.js:56](../background.js#L56) parse errors. Do not log raw proprietary responses to shared systems. |
| Reset local captured state | **[Verified]** Click Clear to send `clearResponses`; handler sets all stored captures to `null` ([background.js:79](../background.js#L79)). **[Inferred]** It is a local data reset, not a service restart or GitLab modification. |
| Clear immediately refills | **[Inferred]** Check for pending requests completing after reset; capture remains enabled ([background.js:24](../background.js#L24)). There is no pause switch. |
| No data on startup | **[Verified]** State starts empty and only subsequent matching parsed responses populate it ([background.js:4](../background.js#L4), [background.js:41](../background.js#L41)). **[Inferred]** Visit/reload the target MR and verify network requests. |
| Update source in development | **[Inferred]** Reload via `about:debugging`, then capture again; reinitialization resets the in-memory store. See [Mozilla's reload procedure](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/). |
| Recover earlier captures | **[Verified]** No backup, export-to-disk, durable store or restore path exists. Copy only exports the selected summary, not a restorable full store ([popup.js:94](../popup.js#L94)). |
| Diagnose wrong MR | **[Verified]** There is no active-tab lookup despite `tabs` permission ([manifest.json:10](../manifest.json#L10), [popup.js:24](../popup.js#L24)). **[Inferred]** Compare stored keys in the extension debugger; see identity risks. |

## Logging and observability

**[Verified]** Background logs startup, successful capture metadata (`endpoint`, decoded text `dataSize`, UTC ISO timestamp), notification failure, parse/filter errors, clear, unknown message types and message-handler errors ([background.js:43](../background.js#L43), [background.js:62](../background.js#L62), [background.js:81](../background.js#L81), [background.js:99](../background.js#L99)). `dataSize` is `text.length`, not raw byte length or a persisted metric.

**[Verified]** Popup logs clipboard failure, clear failure, refresh failure and initial-load failure ([popup.js:115](../popup.js#L115), [popup.js:129](../popup.js#L129), [popup.js:156](../popup.js#L156), [popup.js:168](../popup.js#L168)). No structured log transport, log retention policy, metrics exporter, health endpoint, alerting, crash reporting or analytics appears in source. **[Unknown]** Real runtime error frequency and any external operational monitoring are not documented.

**[Verified]** History shows `6016c67:background.js` logged entire parsed responses; current code logs metadata instead (`git show 9b02e7d -- background.js`). **[Inferred]** Treat captures and debug dumps as potentially confidential even though normal current success logs omit response bodies.

## Security posture

| Boundary | Existing control / gap |
|---|---|
| Host access | **[Verified]** One explicit HTTPS host permission plus matching webRequest host filter ([manifest.json:11](../manifest.json#L11), [background.js:67](../background.js#L67)). No account/project/tab filtering. |
| Browser privileges | **[Verified]** `webRequest` and blocking stream interception are used; `storage`/`tabs` are declared but unused by current scripts. `popup.css` is declared web-accessible ([manifest.json:26](../manifest.json#L26)). **[Inferred]** Review least privilege and remove declarations only after actual browser validation. |
| Secrets | **[Verified]** No credential values or credential environment variables were found in the five source files or inspected diffs. The configured hostname is an integration setting, not a credential. **[Unknown]** No comprehensive forensic scan of every historical blob or real server payload was performed. |
| Incoming data | **[Verified]** No schema, HTTP status, content-type or size validation; JSON values are accepted wholesale ([background.js:34](../background.js#L34)). |
| HTML construction | **[Verified]** Main text fields are escaped; line counts are directly interpolated into HTML ([popup.js:65](../popup.js#L65), [popup.js:81](../popup.js#L81)). **[Inferred]** Markup injection is possible with malformed count strings; script execution is unproven. |
| Message surface | **[Verified]** Internal listener checks type but not sender or an explicit schema; no external listener declared ([background.js:72](../background.js#L72)). |
| Data egress | **[Verified]** Current source writes selected text to clipboard and console diagnostics; no outbound fetch or telemetry client. Full JSON still resides in memory and crosses runtime messages ([background.js:75](../background.js#L75), [popup.js:112](../popup.js#L112)). |
| Security policy | **[Verified]** No custom `content_security_policy` key appears in [manifest.json](../manifest.json). **[Unknown]** Effective browser default policy and release enforcement have not been live-tested. |

**[Inferred]** Before a release, prioritize identity correctness, safe rendering, missing assets and a real-browser smoke test; then define privacy, retention, supported versions and a repeatable packaging/signing path. These are proposed work, not controls already present. See [priorities](09-risks-and-recommendations.md).

## Planned operational changes for configurable instances

**[Inferred]** The [setup plan](11-instance-setup-plan.md) replaces source edits for each instance with locally saved URL configuration and user-granted host access. Before release, validate startup settings loading, permission revocation, denial, restart, switching/reset and old-response isolation in Firefox. Saving a URL must not be treated as a successful connection test. **[Verified]** These operations are not available today; the current fixed-host runbook above remains applicable.

**[Verified]** The new [root gitignore](../.gitignore) excludes local environment values, dependencies/caches, packaged add-ons, local browser profiles, logs, coverage and editor/OS files. It does not add a build or release pipeline, and ignore rules do not remove files already tracked by Git. The earlier baseline inventory still describes the inspected source commit, before these repository documentation additions.

Next: [09 — Risks and recommendations](09-risks-and-recommendations.md).
