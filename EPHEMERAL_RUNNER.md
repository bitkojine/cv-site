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
3. Start a one-job runner:

```bash
GH_OWNER=bitkojine \
GH_REPO=cv-site \
RUNNER_TOKEN=YOUR_TOKEN_HERE \
bash scripts/start-ephemeral-runner.sh
```

The runner registers with `--ephemeral`, processes one job, exits, and deletes its local runner directory.

## Trigger a job

Use one of:

- Push to `main` or `codex/**`
- Run `check` manually from the Actions tab (`workflow_dispatch`)
