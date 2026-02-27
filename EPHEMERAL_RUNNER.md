# Ephemeral Self-Hosted Runner (One Job Per Run)

This repo is configured to run the `check` workflow only on runners labeled:

- `self-hosted`
- `cv-site`
- `ephemeral`

Workflow file: `.github/workflows/check.yml`

## Run one ephemeral runner

1. In GitHub, open:
   - Repo `Settings` -> `Actions` -> `Runners` -> `New self-hosted runner`
2. Copy the generated registration token.
3. Run the one-job runner command:

```bash
GH_OWNER=bitkojine \
GH_REPO=cv-site \
bash scripts/start-ephemeral-runner.sh
```

The runner registers with `--ephemeral`, processes one job, exits, and deletes its local runner directory.
The script prompts for `RUNNER_TOKEN` and `RUNNER_SHA256`, then verifies the downloaded tarball before extraction.

## Trigger a job

Use one of:

- Push to `main`
- Run `check` manually from the Actions tab (`workflow_dispatch`)
