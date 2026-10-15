# 07 — APIs and integration boundaries

Purpose: specify observed HTTP paths, extension messages, clipboard output and failure behavior. Intended reader: developer integrating or debugging the extension. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

## Observed HTTP traffic

**[Verified]** The extension hosts no HTTP endpoint and defines no CLI. It observes requests whose URL is allowed by the configured host filter and whose pathname contains a matching fragment ([background.js:1](../background.js#L1), [background.js:67](../background.js#L67)). These are internal page response shapes consumed by this extension, not a documented public GitLab API integration.

**[Verified]** Every hostname below is the documentation placeholder `gitlab.example.com`; the actual hard-coded source hostname is intentionally omitted. The endpoint paths describe current matching logic, while these example URLs are not live services. **[Inferred]** A future configured origin will replace the fixed host boundary as described in the [setup plan](11-instance-setup-plan.md); no new configuration messages or endpoints exist yet.

| Host and path fragment | Fields the popup consumes | Gate and response handling |
|---|---|---|
| `https://gitlab.example.com/.../merge_requests/<digits>/cached_widget.json` | **[Verified]** `title`, `commits_without_merge_commits[].message` ([popup.js:25](../popup.js#L25), [popup.js:38](../popup.js#L38)) | **[Verified]** Capture does not restrict method/status/content type; parses whole response as UTF-8 JSON. |
| `https://gitlab.example.com/.../merge_requests/<digits>/diffs_metadata.json` | **[Verified]** `diff_files[].new_path`, `added_lines`, `removed_lines` ([popup.js:54](../popup.js#L54)) | **[Verified]** Same parsing and buffering path ([background.js:26](../background.js#L26)). |

**[Verified]** Matching uses `new URL(details.url).pathname`, so query parameters do not affect endpoint selection. The regex has neither start nor end anchor and ignores project/path prefix; a pathname with `.json` followed by extra text still matches ([background.js:9](../background.js#L9)). The listener is host-scoped by browser registration; its callback does not independently check the hostname.

**[Verified]** Synthetic matching URL examples, based on the regex, are:

```text
https://gitlab.example.com/example/project/-/merge_requests/42/cached_widget.json
https://gitlab.example.com/example/project/-/merge_requests/42/diffs_metadata.json?view=example
```

**[Unknown]** HTTP methods actually used by the deployed GitLab instance, response envelopes, required headers, status semantics, rate limits, endpoint availability and backward compatibility have not been verified against that server. No replay/curl instruction is supplied because the extension has no request constructor and the repository has no authentication contract. Use the [synthetic response fixture](06-data-model.md) to understand consumed fields without contacting the server.

## Authentication and authorization

**[Verified]** There is no extension login, token variable, OAuth flow, cookie reader, API key or HTTP client in either script. Permissions are `webRequest`, `webRequestBlocking`, `storage`, `tabs`, and one HTTPS host ([manifest.json:6](../manifest.json#L6)). **[Inferred]** The page/browser is responsible for authenticated GitLab traffic; observation does not establish that the extension enforces GitLab access rules itself. See [architecture boundaries](03-architecture.md).

## Internal runtime protocol

**[Verified]** `browser.runtime.onMessage` in the background implements the following contract. Replies are sent synchronously via `sendResponse`, and the listener returns `true`; the popup awaits `sendMessage` promises ([background.js:72](../background.js#L72), [popup.js:165](../popup.js#L165)).

| Direction / request | Reply or event body | Behavior |
|---|---|---|
| Popup → background: `{"type":"getResponses"}` | **[Verified]** `null` or full raw MR map | Read only; not scoped by current tab or selected MR ([background.js:74](../background.js#L74)). |
| Popup → background: `{"type":"clearResponses"}` | **[Verified]** `{"success":true}` | Sets map to `null`, logs; no clear broadcast or filter cancellation ([background.js:79](../background.js#L79)). |
| Background → extension contexts: `{"type":"responsesUpdated"}` | **[Verified]** No data payload or application reply required | Sent after successful store write; popup fetches entire map ([background.js:50](../background.js#L50), [popup.js:149](../popup.js#L149)). |
| Unknown type → background | **[Verified]** `{"error":"Unknown message type"}` | Logs warning; state unchanged ([background.js:86](../background.js#L86)). |
| Exception in background handler | **[Verified]** `{"error": error.message}` | Catch attempts error reply ([background.js:90](../background.js#L90)). |

**[Verified]** Example expressions below are the message calls implemented by the popup; evaluate only within the extension's debugging context, where `browser.runtime` belongs to this extension ([popup.js:123](../popup.js#L123), [popup.js:165](../popup.js#L165)). Clear is destructive to captured extension memory.

```javascript
await browser.runtime.sendMessage({ type: "getResponses" });
// Example empty reply: null

await browser.runtime.sendMessage({ type: "clearResponses" });
// Reply from handler: { success: true }
```

**[Verified]** `sender` is not inspected, `msg.type` has no upfront object validation, and no `onMessageExternal` listener exists ([background.js:72](../background.js#L72)). **[Unknown]** Real browser serialization and message-delivery ordering are not exercised by the Node harness. **[Inferred]** Do not expose this internal protocol as a public integration without explicit validation and access design.

## Clipboard integration and actual output

**[Verified]** Copy uses `navigator.clipboard.writeText(markdown)` and shows success only after that promise resolves ([popup.js:111](../popup.js#L111)). The manifest does not request `clipboardWrite`; **[Unknown]** user-gesture permission behavior in the target Firefox build has not been exercised.

**[Verified]** For the synthetic fixture in [data model](06-data-model.md), the generated text has this structure with actual newline characters. Source evidence is [popup.js:97](../popup.js#L97); the runtime test checks actual characters.

```text
**#42 Example change**

**Files (1):**

- `example.js` (+3/-1)

**Commits (1):**

- Example commit
```

**[Verified]** Fields are not escaped for Markdown; paths are wrapped in backticks, title in bold markers, and commit messages in list markers ([popup.js:97](../popup.js#L97), [popup.js:102](../popup.js#L102), [popup.js:108](../popup.js#L108)). **[Inferred]** Embedded Markdown characters or newlines from upstream can change the resulting document structure. Clipboard recipients and retention are outside extension control.

## Failure behavior

| Failure | Implemented result |
|---|---|
| Nonmatching path | **[Verified]** Early return, no filter or state update ([background.js:11](../background.js#L11)). |
| Invalid/empty JSON | **[Verified]** Logs error, disconnects in `finally`, previous store unchanged ([background.js:55](../background.js#L55)). |
| Valid JSON error payload or scalar | **[Verified]** Stored without checking HTTP status/schema ([background.js:34](../background.js#L34)); **[Inferred]** may yield an unnamed/partial card or render failure. |
| Filter error | **[Verified]** Logs MR number and disconnects; no popup failure notification ([background.js:62](../background.js#L62)). |
| Notification rejected | **[Verified]** Logs warning; assignment already happened ([background.js:41](../background.js#L41), [background.js:51](../background.js#L51)). |
| Initial data read or render rejects/throws | **[Verified]** Visible failed-load fallback ([popup.js:163](../popup.js#L163)). |
| Refresh read/render fails | **[Verified]** Logs only; no replacement error UI ([popup.js:151](../popup.js#L151)). |
| Clipboard promise rejects | **[Verified]** Logs and shows Failed for two seconds ([popup.js:114](../popup.js#L114)). Schema traversal before the try can reject the click handler without this feedback. |
| Clear promise rejects | **[Verified]** Logs and shows Error for two seconds ([popup.js:128](../popup.js#L128)). A resolved `{error}` body is not inspected and is treated as cleared. |

**[Verified]** No retry, timeout, backoff, circuit breaker, polling loop, request cancellation or external telemetry integration is defined in the scripts. **[Inferred]** Recovery depends on another page request, reopening/reloading, or a user retry, rather than an application recovery workflow.

Next: [08 — Operations](08-operations.md).
