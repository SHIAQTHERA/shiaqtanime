-- Skema PostgreSQL SHIAQTANIME
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN','USER')),
  created_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS genres (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS anime (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  anilist_id  INTEGER,
  title       TEXT NOT NULL,
  alternative TEXT,
  synopsis    TEXT NOT NULL,
  poster_url  TEXT,
  banner_url  TEXT,
  release_year INTEGER,
  status      TEXT NOT NULL DEFAULT 'ONGOING' CHECK (status IN ('ONGOING','COMPLETED','UPCOMING')),
  air_day     TEXT,
  air_date    TEXT,
  type        TEXT NOT NULL DEFAULT 'TV' CHECK (type IN ('TV','MOVIE')),
  price       INTEGER,
  rating      TEXT,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  BIGINT NOT NULL,
  updated_at  BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS anime_genres (
  anime_id TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, genre_id)
);

CREATE TABLE IF NOT EXISTS episodes (
  id         TEXT PRIMARY KEY,
  anime_id   TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  number     INTEGER NOT NULL,
  title      TEXT,
  synopsis   TEXT,
  sources    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  UNIQUE (anime_id, number)
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_id   TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, anime_id)
);

CREATE TABLE IF NOT EXISTS history (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_id     TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  episode_id   TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  progress_sec INTEGER NOT NULL DEFAULT 0,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   BIGINT NOT NULL,
  UNIQUE (user_id, episode_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_id   TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','REJECTED')),
  ref        TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'GUEST',
  sender_id  TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_episodes_anime ON episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_anime ON orders(anime_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

-- Keamanan Supabase: tabel di schema "public" otomatis terbuka lewat Data API (kunci anon).
-- Mengaktifkan RLS tanpa policy memblokir akses itu. Aplikasi ini tidak terpengaruh karena
-- server Next.js terhubung langsung sebagai role "postgres" (melewati RLS).
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres         ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime          ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_genres   ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;
