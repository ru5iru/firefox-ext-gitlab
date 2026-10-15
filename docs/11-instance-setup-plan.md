# 11 — Configurable GitLab instance and extension setup

Purpose: specify the requested instance configuration and onboarding improvement before implementation. Intended reader: developer, architect, PM and release owner. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

## Status and documentation placeholder

**[Verified]** Current capture has a literal host permission and listener URL filter, no saved settings, and no setup/settings UI ([manifest.json:11](../manifest.json#L11), [background.js:4](../background.js#L4), [background.js:67](../background.js#L67), [popup.html](../popup.html)). Application code is unchanged by this documentation update.

**[Inferred]** Everything below is the proposed implementation specification for the user's requested improvement. `https://gitlab.example.com` is a documentation placeholder, not a current configured value, credential, or live service. Actual instance addresses should be entered locally by the user after the feature exists, rather than embedded in published examples.

## Proposed scope

**[Inferred]** Support one configured GitLab HTTPS origin per extension profile, with first-run setup and a Settings entry for later changes. Continue observing the browser page's existing authenticated requests; do not introduce an API token, login form, background fetch client or automatic MR navigation. Preserve existing display/Copy/Clear behavior while making capture depend on saved configuration and granted permission. Supporting multiple simultaneous instances is a separate future decision.

## User journeys and acceptance criteria

| Scenario | Proposed behavior and acceptance criterion |
|---|---|
| Fresh install | **[Inferred]** With no saved instance, show “Set up GitLab instance” and a URL field using the placeholder as help text. Capture remains inactive; Copy/Clear are unavailable or clearly inactive. Provide setup from the popup even if an optional first-install page cannot open. |
| Enter instance | **[Inferred]** Trim surrounding whitespace; parse with `URL`; accept an HTTPS origin with hostname and optional explicit port. Normalize a trailing `/`. Reject blank input, non-HTTPS schemes, credentials, wildcard hosts, query strings, fragments and non-root paths with actionable inline feedback. Do not silently remove a path that could represent a subpath deployment. |
| Save and grant access | **[Inferred]** Explain access to the entered instance, then request that origin's host permission from an explicit user action. Only persist/activate the configuration after validation and permission grant. A syntactically valid URL does not prove reachability, GitLab compatibility or login. |
| Permission denied or cancelled | **[Inferred]** Stay in setup with clear retry guidance; do not claim success. During an edit, retain the old active configuration until replacement activation succeeds. |
| Setup complete | **[Inferred]** Show the selected origin and instructions to sign in through the normal GitLab page, open an MR and trigger its requests. Distinguish “configured” from “data captured”; do not present a green success indicator as proof of network connectivity. |
| Reopen/restart | **[Inferred]** Reload saved settings, verify current host permission, then enable capture. Continue keeping MR responses memory-only. Browser restart should retain the instance setting, not captured payloads. |
| Edit instance | **[Inferred]** Provide Settings from the popup. On successful switch, invalidate old captures and popup snapshots, block stale in-flight writes, activate the new origin and remove the previous origin's permission if no longer needed. Failed validation/permission should leave the previous setup usable. |
| Permission revoked | **[Inferred]** Suspend capture, show a permission-needed state and offer a user-triggered reauthorization action. Do not silently fall back to a hard-coded instance. |
| Reset setup | **[Inferred]** Explicitly distinguish reset from Clear. Reset removes configuration, invalidates captured data and requests removal of now-unneeded host permission; Clear only removes captured responses. Report partial failures honestly and leave capture inactive after reset. |

## Proposed settings and lifecycle

**[Inferred]** Store a minimal versioned settings record in `browser.storage.local`, using the already-declared `storage` permission ([manifest.json:9](../manifest.json#L9)). The following is a proposed schema, not a current stored entity:

```json
{
  "instanceConfig": {
    "version": 1,
    "origin": "https://gitlab.example.com"
  }
}
```

**[Inferred]** Keep configuration separate from response memory. Persist neither credentials nor captured MR payloads. Serialize activation/switch/reset operations through one background configuration owner; use an in-memory generation/revision to reject capture completions from an earlier configuration. Return an explicit configuration/permission/capture status to the popup rather than inferring setup from whether MR data exists.

**[Inferred]** Proposed states are unconfigured → validating → requesting permission → configured; validation/denial returns to setup, and revoked permission moves configured → permission needed. Persist only a valid configuration record; requesting/validation states are transient. A saved origin without currently granted permission is not an active capture configuration. Existing installations should open setup if settings are absent; the old literal instance must not be silently copied into newly published documentation or assumed to be the user's choice.

## Architecture and permission work

| Area | Proposed change / existing evidence |
|---|---|
| Manifest | **[Inferred]** Replace the fixed host permission with an appropriate optional-host-permission declaration for the retained manifest version and register the selected setup/settings UI entry. Verify Firefox's exact permission declaration/request semantics before implementation; do not mechanically copy Manifest V3 syntax into this MV2 extension. Existing entry points: [manifest.json:2](../manifest.json#L2), [manifest.json:11](../manifest.json#L11), [manifest.json:17](../manifest.json#L17). |
| Background startup | **[Inferred]** Load/validate configuration before registering or enabling capture. Request-origin filtering must derive from normalized saved settings and granted permission, not from another literal. Current listener: [background.js:7](../background.js#L7), [background.js:67](../background.js#L67). |
| Capture boundary | **[Inferred]** Match the configured origin, including port policy, before endpoint matching; safely replace/deregister listeners on switches. Keep stream pass-through intact, and disconnect obsolete filters without publishing old data. Current store/write: [background.js:16](../background.js#L16), [background.js:41](../background.js#L41). |
| Messages | **[Inferred]** Add validated configuration/status operations, explicit success/error replies and change notifications. Names and wire shape are not yet selected. Do not present proposed operations as already supported by [background.js:72](../background.js#L72). |
| Popup/setup UI | **[Inferred]** Add setup-required/permission-needed states and a Settings entry, with a labeled URL field, keyboard access, accessible status/error announcements and retained input after errors. Current shell: [popup.html:14](../popup.html#L14); current initial read: [popup.js:163](../popup.js#L163). |
| Identity | **[Inferred]** Include instance and project provenance in captured MR identity, or explicitly restrict supported usage until that work lands. Configuring an origin alone does not fix the existing MR-number-only collision ([background.js:41](../background.js#L41)). |
| Privacy and diagnostics | **[Inferred]** Avoid publishing real instance URLs in examples, fixtures, screenshots or logs shared outside the team. Saving an origin is not saving authentication. Log setup error categories without credentials or response bodies. |

## Proposed validation matrix

**[Inferred]** Before calling this feature complete, test the following with synthetic origins and a real supported Firefox build. These tests are planned; the current 13 characterization tests do not verify this feature.

- URL handling: whitespace, trailing slash, case normalization, explicit ports, malformed input, non-HTTPS schemes, credentials, query/fragment, wildcard input and subpath rejection.
- First-run setup, successful Save, permission rejection/cancellation, retry, storage failure and a missing/invalid/unsupported settings record.
- Restart with valid settings; restart with revoked permission; settings access from an empty or errored popup.
- Allowed-origin capture and rejection of other origins, including the formerly active origin after a switch.
- Switch/reset while requests are in flight; no old response or copied snapshot survives activation of a different instance.
- Clear retains settings; reset removes settings and disables capture; resolved error replies never display false success.
- Existing capture, partial endpoint data, Copy/Clear, browser-stream pass-through and safe HTML rendering continue working.
- Clean extension installation, missing icon resolution, host permission behavior, keyboard/screen-reader feedback and target GitLab endpoint compatibility.

## Decisions still needed

**[Unknown]** PM/engineering must confirm support for GitLab installations under a URL subpath, HTTP-only development instances, custom ports, managed deployment defaults and multi-instance use. The proposal above intentionally accepts HTTPS origins only and rejects subpaths until supported behavior is designed. **[Unknown]** Supported Firefox versions, final UI placement, new message names and the exact permission declaration need implementation-time platform verification.

**[Inferred]** Suggested delivery order: resolve install assets; settle URL/permission policy; implement settings validation/storage and permission-aware capture activation; add setup/settings UI and safe switching; implement tests; run real-browser acceptance; then update these documents from proposed to verified using the new commit and source lines.

Next: [Risks and priorities](09-risks-and-recommendations.md) or the [documentation index](README.md).
