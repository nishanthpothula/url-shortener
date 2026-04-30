# URL Shortener — Phase 1 Baseline

A deliberately naive URL shortener. The goal is to find where it breaks, not to prevent it from breaking.

## Stack

- Node.js + Express
- node-postgres (`pg`) — no ORM
- nanoid for short codes
- Postgres 16
- Docker Compose

## Quick Start

```bash
# 1. Install dependencies (for local dev)
npm install

# 2. Start the stack
docker compose up --build

# 3. Test it
curl -X POST http://localhost:3010/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some/long/path"}'

# 4. Follow the redirect
curl -L http://localhost:3010/<short_code>

# 5. Check stats
curl http://localhost:3010/stats/<short_code>
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shorten` | Create a short URL. Body: `{"url": "https://..."}` |
| `GET` | `/:code` | Redirect (302) to original URL, increments hit count |
| `GET` | `/stats/:code` | Returns `short_code`, `long_url`, `created_at`, `hit_count` |

## Load Testing

Install [k6](https://k6.io/docs/get-started/installation/) locally.

```bash
# Restart the stack fresh before each test
docker compose down -v && docker compose up --build -d

# Wait ~5s for Postgres to be ready, then run:

# 1. Mixed load (95% reads / 5% writes) — default scenario
k6 run load-tests/baseline.js

# 2. Pure write load
k6 run --export writeOptions load-tests/baseline.js

# 3. Pure read load (requires pre-seeded codes — run mixed test first)
k6 run --export readOptions load-tests/baseline.js
```

## Observation Setup (4 terminals)

```bash
# Terminal 1 — run k6
k6 run load-tests/baseline.js

# Terminal 2 — watch container resources
docker stats

# Terminal 3 — watch Postgres connections
watch -n1 'docker exec -it $(docker compose ps -q postgres) \
  psql -U shortener -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"'

# Terminal 4 — tail app logs
docker compose logs -f app
```

## What to Record

Fill in `findings.md` as you run tests:

- RPS at which p95 latency exceeds 100ms
- RPS at which errors start appearing
- What broke first (Node CPU / Postgres CPU / connection pool / memory)
- Exact error messages

## Deliberate Anti-Patterns (do not fix in Phase 1)

- `hit_count` incremented with a write on every redirect
- Default pool size of 10 connections
- No caching layer
- No retries beyond one collision retry on insert
- No graceful shutdown

These are the bottlenecks you're here to measure.
