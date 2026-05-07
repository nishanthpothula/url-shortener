if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const migrate = require('./migrate');
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

let inflight = 0;
const MAX_INFLIGHT = parseInt(process.env.MAX_INFLIGHT || '200');
app.use((req, res, next) => {
  if (inflight >= MAX_INFLIGHT) {
    return res.status(503).json({ error: 'Server busy' });
  }
  inflight++;
  res.on('finish', () => inflight--);
  res.on('close', () => inflight--);
  next();
});

const router = require('./routes');
app.use('/', router);

const PORT = process.env.PORT || 3010;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`url-shortener listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('Migration failed:', err?.stack ?? err);
    process.exit(1);
  });
