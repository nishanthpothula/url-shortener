CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  long_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count BIGINT DEFAULT 0
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
