# Verification record and remaining gaps

Purpose: state what this documentation audit checked and what still needs live evidence. Intended reader: reviewer or new developer assessing confidence. Last verified against commit `9b02e7db044bfa763c69c7b956fa379ee3ddd2d0` (2026-10-15).

## Evidence inspected

**[Verified]** All five tracked application files were read in full with line numbers: [background.js](../background.js), [manifest.json](../manifest.json), [popup.html](../popup.html), [popup.js](../popup.js) and [popup.css](../popup.css). Recon included a depth-three inventory, hidden/tracked file listing, ancestor `AGENTS.md` checks, configuration/test/README searches, secret-name and TODO/FIXME/HACK searches, all eight commit summaries/stats, the initial background/manifest, and diffs for `73bf15f` and `9b02e7d`.

**[Verified]** No repository or ancestor `AGENTS.md` was found in the inspected ancestor locations. No original README, dependency manifest, test, CI, Dockerfile, environment sample, infrastructure definition, TODO/FIXME/HACK marker or credential literal was found in the current five-file source. **[Unknown]** This is not a forensic secret scan of all historical blobs or a review of any private server data.

## Executed checks

| Check | Result / limit |
|---|---|
| JavaScript syntax | **[Verified]** `node --check background.js` and `node --check popup.js` passed. |
| Runtime characterization | **[Verified]** 13 tests passed using Node `v22.22.1` and `node --test --experimental-test-isolation=none docs/tests/runtime.test.cjs`; browser/DOM/clipboard are simulated. |
| Default test command | **[Verified]** The sandbox initially blocked worker spawn with `EPERM`; approved execution ran the suite and exposed an incorrect draft expectation about newlines. The expectation and docs were corrected; the isolation-free rerun passed all 13 tests. |
| Source changes | **[Verified]** Source diff was empty for all five application files; all audit additions are under `docs/`. |
| Local links, source lines, index and metadata | **[Verified]** The follow-up check passed for 14 Markdown files, 510 local links/source-line bounds, 11 unchanged Mermaid blocks, index coverage and private-hostname redaction. |
| Mermaid parsing and rendering | **[Verified]** All 11 fenced diagrams parsed and rendered to linked SVGs using Mermaid `12.2.0`, Mermaid CLI `12.0.0`, Puppeteer `25.14.0` and headless Chrome `155.0.8059.40`. |

**[Verified]** The harness covers three multi-stage flows: capture → store → popup; store → snapshot → clipboard; and clear → memory reset → empty popup → possible in-flight refill. Additional cases cover byte pass-through, endpoint merging, parse/filter errors, no match/unknown message, suffix matching, JSON scalars, project collision, numeric selection, unescaped count markup, no-data/clipboard rejection, startup/clear rejection, malformed arrays and resolved error-body handling. See [tests/runtime.test.cjs](tests/runtime.test.cjs).

**[Verified]** The documentation checker validates local Markdown links and source line bounds, required metadata, index coverage, evidence label presence and caption/read-note presence. It extracts Mermaid source when requested but deliberately does not pretend that a regex proves Mermaid syntax. **[Unknown]** Automated checks do not prove that every prose interpretation is correct, that remote URLs remain available, or that source-line links are rendered identically by every Markdown viewer.

## Follow-up: repository entry files and instance setup proposal

**[Verified]** This follow-up adds the [root README](../README.md) and [project gitignore](../.gitignore), replaces the private source hostname throughout `docs/` with `gitlab.example.com`, and extends the checker to detect its reappearance without printing the hostname. The fixture-only host replacement still invokes the source request callback directly; it does not simulate Firefox's host filter or add support for another instance. All 13 characterization tests passed again, representative ignore rules matched, and the diff for all five application files remained empty.

**[Inferred]** The new [instance setup specification](11-instance-setup-plan.md) records requested future behavior and acceptance criteria. It is not implementation evidence. Existing Mermaid definitions are unchanged, so the original 11 render results and SVG copies remain applicable. **[Unknown]** The proposed setup flow, settings persistence, optional host permissions and instance switching need future implementation and browser tests.

## Remaining gaps and definition-of-done limits

- **[Unknown]** A guaranteed live clean-machine setup cannot be certified: three manifest icon assets are absent, exact Firefox support is unspecified, and authenticated GitLab access has not been exercised. The setup guide provides the actual loading procedure and identifies this gap rather than fabricating a successful install.
- **[Unknown]** The runtime behavior of Firefox stream filtering, extension messaging serialization, clipboard permissions, browser cache/compression/redirect edge cases and real DOM accessibility remains untested.
- **[Unknown]** Upstream schema, GitLab version, MR identifier scope, pagination and data sensitivity need sanitized live fixtures and owner confirmation.
- **[Unknown]** Product intent, release/signing/distribution, operations ownership, actual usage and server internals are absent from the repository/history.
- **[Verified]** No deployment diagram was generated because no infrastructure definition exists; all eleven requested topic documents were retained. Existing source/config defects were documented, not modified.

## Re-run the local verification

**[Verified]** These are the dependency-free commands for the checks committed under `docs/`, run from repository root:

```powershell
node --check background.js
node --check popup.js
node --test --experimental-test-isolation=none docs/tests/runtime.test.cjs
node docs/tools/check-docs.cjs
git diff --check
git diff --name-only -- background.js manifest.json popup.html popup.js popup.css
```

**[Inferred]** After a future behavior change, update the baseline hash and evidence lines, adjust characterization expectations deliberately, and repeat browser acceptance checks once installation/access are available.

## Optional Mermaid tooling

**[Verified]** The audit's diagram renderer is [tools/render-diagrams.mjs](tools/render-diagrams.mjs). It extracts fenced definitions from the Markdown, invokes Mermaid CLI's renderer with a fresh headless Chrome context, and writes SVGs beneath `docs/diagrams`. It requires temporary tooling under `docs/.validation`, separate from the extension and offline test suite. The downloaded package metadata reports Mermaid CLI `12.0.0`, Mermaid `12.2.0` and Puppeteer `25.14.0`.

**[Inferred]** For a future render, install those versions into the temporary tool directory, set `DOCS_CHROME_PATH` to an installed Chrome-compatible browser executable when the script's Windows default is unsuitable, then run the linked renderer. In this audit npm needed the Windows system certificate store to validate the package registry; certificate verification was retained. Temporary dependency/cache/profile files should not be committed. These tooling settings are not extension environment variables.

**[Verified]** The audit used this Windows tooling installation command (the resolved versions are above) and renderer invocation. It downloads documentation tooling and launches a separate headless browser; it is optional for using the extension or running the offline tests.

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = 'true'
$env:NODE_USE_SYSTEM_CA = '1'
npm.cmd install --prefix docs/.validation --cache docs/.validation/npm-cache --no-save --no-package-lock --offline=false @mermaid-js/mermaid-cli@latest
node docs/tools/render-diagrams.mjs
```

**[Inferred]** Replace `@latest` with `@12.0.0` and add explicit `mermaid@12.2.0 puppeteer@25.14.0` arguments if reproducing the same renderer versions matters. For a browser installed elsewhere, set `DOCS_CHROME_PATH` to its absolute executable path before the renderer command. [.gitignore](.gitignore) keeps temporary tooling out of version control; the linked generated SVG copies are the retained outputs.

Next: [Documentation index](README.md) or the [first-week checklist](09-risks-and-recommendations.md).
