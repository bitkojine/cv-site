# Render Setup: Upvotes Backend (Free Plans)

This repo includes a small backend API in `backend/` for Customer Discovery Brief voting.

## What was added
- API service: `backend/src/server.js`
- Render blueprint config: `render.yaml` (free plan values only)
- Frontend scripts: `upvote-config.js`, `upvotes.js`

Upvote meaning in this product:
- One active vote means: "This is the customer segment I most want to serve and feel capable of serving."
- Users can remove their vote or move it to a different segment at any time.

## Security measures included
- Helmet HTTP hardening headers
- CORS allowlist (`ALLOWED_ORIGINS`)
- Input validation for brief slug
- Strict server-side list of valid brief slugs (unknown slugs rejected)
- Rate limiting on vote endpoint
- One active vote per IP hash across all briefs (`voter_choice` uniqueness)
- Salted hash for IP (`VOTE_SALT`) so raw IP is not stored
- Parameterized SQL queries

## Setup option A: Blueprint (free only)
1. In Render: Dashboard -> New -> Blueprint.
2. Connect this repo and deploy.
3. Confirm generated resources are free tier:
   - Web service plan: `Free`
   - Postgres plan: `Free`
4. Wait for deploy and copy your service URL:
   - Example: `https://cv-site-upvotes-api.onrender.com`
5. Update frontend config in this repo:
   - File: `upvote-config.js`
   - Replace placeholder URL with your real Render URL
6. Commit and deploy site again so GitHub Pages serves the updated config.
7. Verify endpoints:
   - `GET https://<your-render-url>/healthz`
   - `GET https://<your-render-url>/api/v1/upvotes`
   - `GET https://<your-render-url>/api/v1/upvotes/top?limit=10`
8. Verify in browser:
   - Open `/briefs/index.html`
   - Vote a brief, remove vote, and move vote to a different brief
   - Counts should persist after refresh.

## Setup option B: Manual (if Blueprint is unavailable)
1. Create free Postgres manually (`Free` plan).
2. Create free Web Service manually (`Free` plan), root `backend`, build `npm ci`, start `npm start`.
3. Set env vars:
   - `DATABASE_URL`
   - `DATABASE_SSL=true`
   - `ALLOWED_ORIGINS=https://robertasrudys.com,https://www.robertasrudys.com`
   - `ALLOW_NO_ORIGIN=false`
   - `VOTE_SALT=<random 16+ chars>`

## Notes
- Data is stored in Render Postgres and survives service restarts/redeploys.
- If you later want stricter abuse protection, add Cloudflare Turnstile before POST `/api/v1/upvotes/:slug`.
- Use `/api/v1/upvotes/top` to see which segments your network is signaling most strongly.
