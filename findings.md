# Phase 1 Findings

## Setup

- Date:
- Machine specs (CPU, RAM):
- Docker version:
- Node version (inside container):
- Postgres version: 16

## Baseline Queries — EXPLAIN ANALYZE

### POST /shorten (INSERT)
```
-- paste output here
```

### GET /:code (UPDATE ... RETURNING)
```
-- paste output here
```

---

## Test Results

### Pure Write Load

| Metric | Value |
|--------|-------|
| Peak RPS | |
| p95 latency at peak | |
| RPS where p95 > 100ms | |
| RPS where errors start | |
| First error message | |

### Pure Read Load

| Metric | Value |
|--------|-------|
| Peak RPS | |
| p95 latency at peak | |
| RPS where p95 > 100ms | |
| RPS where errors start | |
| First error message | |

### Mixed Load (95% reads / 5% writes)

| Metric | Value |
|--------|-------|
| Peak RPS | |
| p95 latency at peak | |
| RPS where p95 > 100ms | |
| RPS where errors start | |
| First error message | |

---

## Resource Observations (docker stats)

| Stage | Node CPU % | Node Mem | Postgres CPU % | Postgres Mem |
|-------|-----------|----------|---------------|--------------|
| 50 VU | | | | |
| 200 VU | | | | |
| 500 VU | | | | |
| 1000 VU | | | | |

---

## pg_stat_activity Observations

- Max observed connections:
- Idle connections at peak:
- Wait events seen:

---

## What Broke First

- [ ] Node CPU
- [ ] Postgres CPU
- [ ] Connection pool exhausted (`pool exhausted`)
- [ ] Too many Postgres connections (`too many connections`)
- [ ] OOM
- [ ] Other: ___________

Exact error message:
```
```

---

## Surprises

<!-- Write down anything that didn't match your expectations -->

---

## Bottleneck Conclusion

> At ___ RPS, this setup falls over because ___.

---

## Next Phase Targets

- Bottleneck to address in Phase 2:
- Hypothesis for fix:
