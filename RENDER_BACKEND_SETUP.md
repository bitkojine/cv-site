# Render Setup: Upvotes Backend

This repo now includes a small backend API in `backend/` for Customer Discovery Brief upvotes.

## What was added
- API service: `backend/src/server.js`
- Render blueprint: `render.yaml`
- Frontend scripts: `upvote-config.js`, `upvotes.js`

Upvote meaning in this product:
- One upvote means: "This is the customer segment I most want to serve and feel capable of serving."

## Security measures included
- Helmet HTTP hardening headers
- CORS allowlist (`ALLOWED_ORIGINS`)
- Input validation for brief slug
- Strict server-side list of valid brief slugs (unknown slugs rejected)
- Rate limiting on upvote endpoint
- One vote per IP hash per brief (`vote_events` unique constraint)
- Salted hash for IP (`VOTE_SALT`) so raw IP is not stored
- Parameterized SQL queries

## Manual steps you need to do
1. In Render, create from blueprint:
   - New -> Blueprint -> connect this repo
   - Render will read `render.yaml` and create:
     - web service `cv-site-upvotes-api`
     - postgres `cv-site-upvotes-db`
2. Wait for service deploy to finish and copy the service URL:
   - Example: `https://cv-site-upvotes-api.onrender.com`
3. Update frontend config file in this repo:
   - File: `upvote-config.js`
   - Replace placeholder URL with your real Render URL
4. Commit and deploy site again so GitHub Pages serves the updated config.
5. Verify endpoints:
   - `GET https://<your-render-url>/healthz`
   - `GET https://<your-render-url>/api/v1/upvotes`
   - `GET https://<your-render-url>/api/v1/upvotes/top?limit=10`
6. Verify in browser:
   - Open `/briefs/index.html`
   - Click an upvote button
   - Count should increase and persist after refresh.

## Notes
- Data is stored in Render Postgres and survives service restarts/redeploys.
- The current anti-spam rule is one upvote per IP per brief.
- If you later want stricter abuse protection, add Cloudflare Turnstile before POST `/api/v1/upvotes/:slug`.
- Use `/api/v1/upvotes/top` to see which segments your current network is signaling most strongly.
