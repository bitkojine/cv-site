const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const VOTE_SALT = process.env.VOTE_SALT;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
if (!VOTE_SALT || VOTE_SALT.length < 16) {
  throw new Error('VOTE_SALT is required and must be at least 16 characters');
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://robertasrudys.com,http://localhost:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Origin not allowed'));
    },
    methods: ['GET', 'POST']
  })
);

app.use(express.json({ limit: '5kb' }));

const upvoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try later.' }
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validBriefSlugs = loadValidBriefSlugs();

function loadValidBriefSlugs() {
  const briefsDir = path.resolve(__dirname, '..', '..', 'briefs');
  const files = fs.readdirSync(briefsDir);
  const slugs = files
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.replace(/\.html$/u, ''))
    .filter((slug) => slug !== 'index' && slug !== '_template');
  return new Set(slugs);
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(`${ip}:${VOTE_SALT}`).digest('hex');
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS brief_votes (
      brief_slug TEXT PRIMARY KEY,
      votes BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS voter_choice (
      id BIGSERIAL PRIMARY KEY,
      ip_hash TEXT NOT NULL,
      brief_slug TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (ip_hash)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_voter_choice_brief_slug
    ON voter_choice (brief_slug);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vote_events (
      id BIGSERIAL PRIMARY KEY,
      brief_slug TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (brief_slug, ip_hash)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vote_events_brief_slug
    ON vote_events (brief_slug);
  `);

  await pool.query(`
    INSERT INTO voter_choice (ip_hash, brief_slug)
    SELECT DISTINCT ON (ip_hash) ip_hash, brief_slug
    FROM vote_events
    ORDER BY ip_hash, created_at DESC
    ON CONFLICT (ip_hash) DO NOTHING;
  `);

  await pool.query('TRUNCATE TABLE brief_votes;');
  await pool.query(`
    INSERT INTO brief_votes (brief_slug, votes, updated_at)
    SELECT brief_slug, COUNT(*)::BIGINT AS votes, NOW()
    FROM voter_choice
    GROUP BY brief_slug;
  `);
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/v1/upvotes', async (req, res, next) => {
  const ipHash = hashIp(getClientIp(req));
  try {
    const { rows } = await pool.query('SELECT brief_slug, votes FROM brief_votes;');
    const myVoteResult = await pool.query(
      'SELECT brief_slug FROM voter_choice WHERE ip_hash = $1;',
      [ipHash]
    );
    const counts = {};

    for (const slug of validBriefSlugs) {
      counts[slug] = 0;
    }

    for (const row of rows) {
      counts[row.brief_slug] = Number(row.votes);
    }

    res.json({
      counts,
      my_vote: myVoteResult.rowCount > 0 ? myVoteResult.rows[0].brief_slug : null,
      description:
        "Upvote means: this is a customer segment I most want to serve and feel capable of serving."
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/v1/upvotes/top', async (req, res, next) => {
  const limitRaw = Number.parseInt(String(req.query.limit || '10'), 10);
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
  try {
    const { rows } = await pool.query(
      `
      SELECT brief_slug, votes
      FROM brief_votes
      ORDER BY votes DESC, brief_slug ASC
      LIMIT $1;
      `,
      [limit]
    );

    res.json({
      description:
        "Segments your network most wants to serve now (proxy signal from upvotes).",
      top: rows.map((row, idx) => ({
        rank: idx + 1,
        slug: row.brief_slug,
        votes: Number(row.votes)
      }))
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/v1/upvotes/:slug', upvoteLimiter, async (req, res, next) => {
  const { slug } = req.params;

  if (!slugPattern.test(slug)) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }
  if (!validBriefSlugs.has(slug)) {
    res.status(404).json({ error: 'Unknown brief' });
    return;
  }

  const ipHash = hashIp(getClientIp(req));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentChoice = await client.query(
      `
      SELECT brief_slug
      FROM voter_choice
      WHERE ip_hash = $1
      FOR UPDATE;
      `,
      [ipHash]
    );

    let action;
    let previousSlug = null;

    if (currentChoice.rowCount === 0) {
      action = 'added';
      await client.query(
        `
        INSERT INTO voter_choice (ip_hash, brief_slug)
        VALUES ($1, $2);
        `,
        [ipHash, slug]
      );
    } else {
      previousSlug = currentChoice.rows[0].brief_slug;
      if (previousSlug === slug) {
        action = 'removed';
        await client.query(
          `
          DELETE FROM voter_choice
          WHERE ip_hash = $1;
          `,
          [ipHash]
        );
      } else {
        action = 'moved';
        await client.query(
          `
          UPDATE voter_choice
          SET brief_slug = $2, updated_at = NOW()
          WHERE ip_hash = $1;
          `,
          [ipHash, slug]
        );
      }
    }

    await client.query('TRUNCATE TABLE brief_votes;');
    await client.query(`
      INSERT INTO brief_votes (brief_slug, votes, updated_at)
      SELECT brief_slug, COUNT(*)::BIGINT AS votes, NOW()
      FROM voter_choice
      GROUP BY brief_slug;
    `);

    const countsResult = await client.query('SELECT brief_slug, votes FROM brief_votes;');
    const counts = {};
    for (const validSlug of validBriefSlugs) {
      counts[validSlug] = 0;
    }
    for (const row of countsResult.rows) {
      counts[row.brief_slug] = Number(row.votes);
    }

    await client.query('COMMIT');
    res.json({
      slug,
      previous_slug: previousSlug,
      action,
      my_vote: action === 'removed' ? null : slug,
      counts
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

app.use((err, _req, res, _next) => {
  if (err && err.message === 'Origin not allowed') {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Upvotes API listening on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize DB', err);
    process.exit(1);
  });
