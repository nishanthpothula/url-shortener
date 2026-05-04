import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3010';

// ---------------------------------------------------------------------------
// Shared pool of pre-seeded codes (populated during setup)
// ---------------------------------------------------------------------------
const seededCodes = new SharedArray('codes', function () {
  // During actual runs, replace this with a pre-generated JSON file:
  //   k6 run --env CODES_FILE=codes.json baseline.js
  // For now, codes are seeded in the setup() function below.
  return [];
});

// ---------------------------------------------------------------------------
// Scenario 1: Pure write load
// ---------------------------------------------------------------------------
export const writeOptions = {
  scenarios: {
    pure_writes: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
      exec: 'writeScenario',
    },
  },
};

export function writeScenario() {
  const payload = JSON.stringify({ url: `https://example.com/page/${Math.random()}` });
  const res = http.post(`${BASE_URL}/shorten`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'shorten status 201': (r) => r.status === 201,
    'has short_code': (r) => JSON.parse(r.body).short_code !== undefined,
  });
}

// ---------------------------------------------------------------------------
// Scenario 2: Pure read load (redirects)
// ---------------------------------------------------------------------------
export const readOptions = {
  scenarios: {
    pure_reads: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
      exec: 'readScenario',
    },
  },
};

export function readScenario() {
  if (seededCodes.length === 0) return;
  const code = seededCodes[Math.floor(Math.random() * seededCodes.length)];
  const res = http.get(`${BASE_URL}/${code}`, { redirects: 0 });
  check(res, {
    'redirect 302': (r) => r.status === 302,
  });
}

// ---------------------------------------------------------------------------
// Scenario 3 (DEFAULT): 95% reads / 5% writes — realistic mix
// ---------------------------------------------------------------------------
export const options = {
  setupTimeout: '3m',
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // warn if p95 > 500ms
    http_req_failed: ['rate<0.01'],    // warn if error rate > 1%
  },
};

// Seed 1000 URLs before the mixed test
export function setup() {
  const codes = [];
  console.log('Seeding 1000 URLs...');
  for (let i = 0; i < 1000; i++) {
    const res = http.post(
      `${BASE_URL}/shorten`,
      JSON.stringify({ url: `https://example.com/seed/${i}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status === 201) {
      codes.push(JSON.parse(res.body).short_code);
    }
  }
  console.log(`Seeded ${codes.length} URLs`);
  return { codes };
}

// Default export: 95/5 mixed load
export default function (data) {
  const roll = Math.random();

  if (roll < 0.95 && data.codes.length > 0) {
    // Read path
    const code = data.codes[Math.floor(Math.random() * data.codes.length)];
    const res = http.get(`${BASE_URL}/${code}`, { redirects: 0 });
    check(res, {
      'redirect 302': (r) => r.status === 302,
    });
  } else {
    // Write path
    const payload = JSON.stringify({ url: `https://example.com/live/${Math.random()}` });
    const res = http.post(`${BASE_URL}/shorten`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
      'shorten status 201': (r) => r.status === 201,
    });
  }

  sleep(0); // no think time — maximum pressure
}
