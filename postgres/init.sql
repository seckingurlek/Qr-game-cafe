-- =============================================
-- CAFE GAMES - Database Schema
-- =============================================

-- Masalar
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL UNIQUE,
  qr_code VARCHAR(100) NOT NULL UNIQUE, -- örn: "table_A3"
  label VARCHAR(50),                    -- örn: "Masa 3 - Pencere Kenarı"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı session (nick + masa)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(30) NOT NULL,
  table_id UUID NOT NULL REFERENCES tables(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Skorlar
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  game_slug VARCHAR(30) NOT NULL, -- "snake", "2048", "flappy", "wordle"
  score INTEGER NOT NULL DEFAULT 0,
  meta JSONB,                     -- ekstra veri (level, süre vs)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiplayer lobiler
CREATE TABLE IF NOT EXISTS game_lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug VARCHAR(30) NOT NULL,      -- "tictactoe", "chess"
  host_session_id UUID NOT NULL REFERENCES sessions(id),
  guest_session_id UUID REFERENCES sessions(id),
  status VARCHAR(20) DEFAULT 'waiting', -- waiting | playing | finished
  winner_session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- İndeksler
CREATE INDEX idx_scores_game_slug ON scores(game_slug);
CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_lobbies_status ON game_lobbies(status);
CREATE INDEX idx_lobbies_game ON game_lobbies(game_slug, status);
CREATE INDEX idx_sessions_active ON sessions(is_active);

-- =============================================
-- SEED: Örnek masalar (10 masa)
-- =============================================
INSERT INTO tables (table_number, qr_code, label) VALUES
  (1,  'table_01', 'Masa 1'),
  (2,  'table_02', 'Masa 2'),
  (3,  'table_03', 'Masa 3'),
  (4,  'table_04', 'Masa 4'),
  (5,  'table_05', 'Masa 5'),
  (6,  'table_06', 'Masa 6'),
  (7,  'table_07', 'Masa 7'),
  (8,  'table_08', 'Masa 8'),
  (9,  'table_09', 'Masa 9'),
  (10, 'table_10', 'Masa 10')
ON CONFLICT DO NOTHING;
