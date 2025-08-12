-- Cooksey Plate Database Schema
-- SQLite version with squiggle_game_key as linking field

-- Family Groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100),
  family_group_id INTEGER,
  role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_group_id) REFERENCES family_groups(id)
);

-- Squiggle API Mirror table - complete copy of Squiggle API data
CREATE TABLE IF NOT EXISTS squiggle_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  squiggle_game_key VARCHAR(3) NOT NULL UNIQUE, -- RoundNumber(2) + GameNumber(1) e.g., "001", "029", "235"
  round_number INTEGER NOT NULL,
  game_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  complete INTEGER DEFAULT 0, -- 0/1 instead of boolean for SQLite
  date DATETIME,
  tz VARCHAR(50),
  hteam VARCHAR(50), -- home team
  ateam VARCHAR(50), -- away team
  hscore INTEGER DEFAULT 0, -- home score
  ascore INTEGER DEFAULT 0, -- away score
  hgoals INTEGER DEFAULT 0,
  agoals INTEGER DEFAULT 0,
  hbehinds INTEGER DEFAULT 0,
  abehinds INTEGER DEFAULT 0,
  venue VARCHAR(100),
  winner VARCHAR(50),
  updated DATETIME,
  raw_json TEXT, -- Store complete API response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rounds table (application-specific)
CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
  lockout_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(round_number, year)
);

-- Games table (application-specific, linked to squiggle_games)
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  squiggle_game_key VARCHAR(3) NOT NULL,
  round_id INTEGER NOT NULL,
  home_team VARCHAR(50) NOT NULL,
  away_team VARCHAR(50) NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  start_time DATETIME,
  venue VARCHAR(100),
  is_complete INTEGER DEFAULT 0, -- 0/1 instead of boolean
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (squiggle_game_key) REFERENCES squiggle_games(squiggle_game_key),
  UNIQUE(squiggle_game_key)
);

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  squiggle_game_key VARCHAR(3) NOT NULL,
  round_id INTEGER NOT NULL,
  selected_team VARCHAR(50) NOT NULL,
  is_correct INTEGER, -- NULL until game complete, then 0/1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (squiggle_game_key) REFERENCES squiggle_games(squiggle_game_key),
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  UNIQUE(user_id, game_id) -- One tip per user per game
);

-- Historical tips table (for Excel import)
CREATE TABLE IF NOT EXISTS historical_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name VARCHAR(50) NOT NULL,
  round_number INTEGER NOT NULL,
  game_number INTEGER NOT NULL,
  squiggle_game_key VARCHAR(3) NOT NULL,
  selected_team VARCHAR(50) NOT NULL,
  is_correct INTEGER, -- 0/1
  year INTEGER NOT NULL,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (squiggle_game_key) REFERENCES squiggle_games(squiggle_game_key)
);

-- Import logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_type VARCHAR(50) NOT NULL, -- 'excel', 'squiggle'
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  file_name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_squiggle_games_key ON squiggle_games(squiggle_game_key);
CREATE INDEX IF NOT EXISTS idx_squiggle_games_round_year ON squiggle_games(round_number, year);
CREATE INDEX IF NOT EXISTS idx_games_squiggle_key ON games(squiggle_game_key);
CREATE INDEX IF NOT EXISTS idx_games_round_id ON games(round_id);
CREATE INDEX IF NOT EXISTS idx_tips_user_id ON tips(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_squiggle_key ON tips(squiggle_game_key);
CREATE INDEX IF NOT EXISTS idx_tips_round_id ON tips(round_id);
CREATE INDEX IF NOT EXISTS idx_historical_tips_squiggle_key ON historical_tips(squiggle_game_key);
CREATE INDEX IF NOT EXISTS idx_users_family_group ON users(family_group_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_squiggle_games_updated_at
  AFTER UPDATE ON squiggle_games
BEGIN
  UPDATE squiggle_games SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_games_updated_at
  AFTER UPDATE ON games
BEGIN
  UPDATE games SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tips_updated_at
  AFTER UPDATE ON tips
BEGIN
  UPDATE tips SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;