const express = require('express');
const router = express.Router();
const pool = require('./db');
const redis = require('./cache');
const { generateCode } = require('./shortcode');

// POST /shorten — create a short URL
router.post('/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let code = generateCode();

  try {
    await pool.query(
      'INSERT INTO urls (short_code, long_url) VALUES ($1, $2)',
      [code, url]
    );
  } catch (err) {
    // Unique constraint collision — retry once
    if (err.code === '23505') {
      code = generateCode();
      try {
        await pool.query(
          'INSERT INTO urls (short_code, long_url) VALUES ($1, $2)',
          [code, url]
        );
      } catch (retryErr) {
        console.error('Retry insert failed:', retryErr.message);
        return res.status(500).json({ error: 'Failed to create short URL' });
      }
    } else {
      console.error('Insert error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  res.status(201).json({
    short_code: code,
    short_url: `${process.env.BASE_URL || 'http://localhost:3010'}/${code}`,
    long_url: url,
  });
});

// GET /:code — redirect to original URL
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    let cached = null;
    try {
      cached = await redis.get(`short:${code}`);
    } catch (redisErr) {
      // Redis unavailable — fall through to Postgres
    }

    if (cached) {
      return res.redirect(302, cached);
    }

    const result = await pool.query(
      'SELECT long_url FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Short code not found' });
    }

    const longUrl = result.rows[0].long_url;
    try {
      await redis.setex(`short:${code}`, 86400, longUrl);
    } catch (redisErr) {
      // Redis unavailable — continue without caching
    }
    res.redirect(302, longUrl);
  } catch (err) {
    console.error('Redirect error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /stats/:code — return metadata and hit count
router.get('/stats/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      'SELECT short_code, long_url, created_at, hit_count FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Short code not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
