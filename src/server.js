if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const express = require('express');
const migrate = require('./migrate');
const app = express();

app.use(express.json());

// Mount stats route before /:code so it isn't swallowed by the wildcard
const router = require('./routes');
app.use('/stats', router);  // /stats/:code
app.use('/', router);       // /shorten and /:code

const PORT = process.env.PORT || 3010;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`url-shortener listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
