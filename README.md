# CV Site Door System

Static Astro site with one identity and three role doors:

- `/hiring` for `Recruiter / Hiring Manager`
- `/build` for `Founder / Operator`
- `/vision` for `Investor / Advisor`
- `/` as door selection only

## Guardrails

- Keep exactly three doors.
- Do not expose internal mode names in UI.
- Do not share mode-specific content blocks across routes.
- Keep switching subtle and reversible via `Viewing as: X (Switch)`.
- Ensure mobile-first behavior remains the default.

## Analytics Hooks

Client analytics are lightweight and emitted with `console.log` in
`/Users/name/trusted-git/public-repos/cv-site/src/components/RoleClientEnhancements.astro`.

Tracked events:

- `mode_selected`: door choice from `/`
- `mode_switched`: role switch action with `{ from, to }`
- `cta_clicked`: CTA click with `{ cta, mode }`
- `scroll_depth`: milestone with `{ depth, mode }`

Required attributes for instrumentation:

- Door links: `data-role-door="..."`
- Switch links: `data-role-switch="..."`
- Return link: `data-return-door`
- CTA links/buttons: `data-cta` and `data-cta-mode`
- Progressive sections: `data-progressive`

## SEO + Schema

Each route must define:

- unique `title`
- unique meta description
- canonical path
- structured data context via `schemaType` and `schemaExtras`

Set these in route files under `/Users/name/trusted-git/public-repos/cv-site/src/pages` and pass them through `/Users/name/trusted-git/public-repos/cv-site/src/layouts/SiteLayout.astro`.

## Validation

Run before publishing:

```bash
npm run build
npm run lint
```
