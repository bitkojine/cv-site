# Workflow Linting Notes

This document explains why `/Users/name/trusted-git/public-repos/cv-site/scripts/lint-workflows.sh`
was changed and what behavior we rely on now.

## What Broke

CI failed in `npm run lint:workflows` with errors like:

- `could not parse JSON output from shellcheck`
- `invalid character 'I' looking for beginning of value`

`actionlint` expects `shellcheck` to output JSON-only data. In CI, `shellcheck`
resolved to the npm wrapper (`node_modules/.bin/shellcheck`), which can print
`[INFO]` download logs to stdout on first run. Those logs break JSON parsing in
`actionlint`.

## Root Cause

- `actionlint` shells out to `shellcheck`.
- In npm script execution, `node_modules/.bin` is first in `PATH`.
- `command -v shellcheck` can therefore return the wrapper script.
- Wrapper output is not compatible with `actionlint`'s JSON parser.

## What We Changed

`/Users/name/trusted-git/public-repos/cv-site/scripts/lint-workflows.sh` now:

1. Prefers a real binary path:
   - `node_modules/shellcheck/bin/shellcheck`
2. If missing, pre-warms the wrapper once (`--version`) only to download the
   real binary.
3. Uses the downloaded real binary path if available.
4. Uses system `shellcheck` only when it is not the npm wrapper path.
5. If no safe binary is available, runs `actionlint` with `-shellcheck=`
   (disables shellcheck integration instead of failing unpredictably).

The script always passes an explicit `-shellcheck` argument to `actionlint`
when possible.

## Why This Is Stable

- We avoid ambiguous PATH lookup for `shellcheck`.
- We avoid wrapper stdout noise in actionlint's JSON parsing path.
- CI and local behavior are aligned.

## Related Scripts

- Main workflow linter:
  `/Users/name/trusted-git/public-repos/cv-site/scripts/lint-workflows.sh`
- npm script entrypoint:
  `/Users/name/trusted-git/public-repos/cv-site/package.json` (`lint:workflows`)
