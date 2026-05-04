if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  const numWorkers = os.cpus().length;
  console.log(`Primary ${process.pid} starting ${numWorkers} workers`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}), restarting`);
    cluster.fork();
  });
} else {
  const express = require('express');
  const cors = require('cors');
  const migrate = require('./migrate');
  const app = express();

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  const router = require('./routes');
  app.use('/', router);

  const PORT = process.env.PORT || 3010;

  migrate()
    .then(() => {
      app.listen(PORT, () => console.log(`Worker ${process.pid} listening on port ${PORT}`));
    })
    .catch(err => {
      console.error('Migration failed:', err?.stack ?? err);
      process.exit(1);
    });
}
