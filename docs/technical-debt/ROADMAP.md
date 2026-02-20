# Technical Debt Remediation Roadmap

## 30-day plan (stabilize release baseline)

### 30-day goals

- Rebuild confidence in release determinism and CI quality signals.
- Reduce immediate contributor friction.

### 30-day actions

1. Change deploy workflow dependency install from `npm install` to `npm ci`.
2. Add `npm run typecheck` (`tsc --noEmit`) and wire it into CI.
3. Fix initial compiler blockers in config/runtime files first.
4. Add explicit local Playwright setup path and adjust hooks accordingly.
5. Reduce monitor comment noise with cooldown/transition logic.

### 30-day success criteria

- Deploy workflow is lockfile-deterministic.
- CI has an active typecheck signal.
- New contributors can execute local checks with documented E2E setup.

## 60-day plan (reduce coupling and operational drag)

### 60-day goals

- Lower change amplification for role-related behavior.
- Reduce duplicated monitoring logic.

### 60-day actions

1. Introduce a central role registry module and refactor all role/path literals.
2. Split `RoleClientEnhancements` into typed modules by concern.
3. Replace string-content unit tests with behavior tests.
4. Extract shared TLS/policy logic from workflows into tested scripts.

### 60-day success criteria

- Role changes are made in one source of truth.
- Client enhancement logic is modular and testable.
- Monitoring workflows share reusable implementation code.

## 90-day plan (security and governance hardening)

### 90-day goals

- Improve defense-in-depth and supply-chain trust.
- Prevent debt recurrence with enforceable guardrails.

### 90-day actions

1. Harden CSP (reduce/remove broad `'unsafe-inline'` allowances).
2. Add checksum verification for downloaded workflow tooling binaries.
3. Add coverage collection and thresholds for critical interaction modules.
4. Continue type debt burn-down for tooling/stress code paths.

### 90-day success criteria

- CSP policy is significantly stricter and operationalized via edge headers.
- Downloaded workflow binaries are integrity-verified.
- Coverage and type checks are sustained CI gates.

## Sequencing rationale

1. Reliability gates first: fix deterministic install + CI typecheck + E2E bootstrap.
2. Coupling reduction second: role registry + client-script decomposition.
3. Operational consolidation third: shared monitor scripts.
4. Security/governance hardening once baseline is stable.

## Preventative guardrails

- Required CI checks: `lint`, `typecheck`, `unit`, `build`, `e2e`.
- Add unused-code detection (e.g., `knip`) for dead file drift.
- Adopt convention docs for role metadata ownership and client error handling.
- Add monitor lifecycle policy (open, dedupe updates, resolve/close).
