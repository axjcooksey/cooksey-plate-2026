-- Add margin prediction fields to tips table for finals rounds
-- This allows users to predict margin of victory for the last game of finals rounds

-- Check if columns exist before adding them
-- SQLite doesn't have IF NOT EXISTS for columns, so we'll handle errors gracefully

-- Add margin prediction columns to tips table
ALTER TABLE tips ADD COLUMN margin_prediction INTEGER; -- Predicted margin of victory
ALTER TABLE tips ADD COLUMN is_margin_game INTEGER DEFAULT 0; -- Whether this is a margin prediction game
ALTER TABLE tips ADD COLUMN margin_difference INTEGER; -- Actual difference from predicted margin (calculated after game ends)

-- Add finals round configuration table
CREATE TABLE IF NOT EXISTS finals_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_number INTEGER NOT NULL UNIQUE,
  round_name VARCHAR(50) NOT NULL, -- 'Finals Week 1', 'Semi Finals', etc.
  requires_margin INTEGER DEFAULT 0, -- Whether this round requires margin predictions
  margin_game_position VARCHAR(10) DEFAULT 'last', -- 'first', 'last', 'all'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (round_number >= 25 AND round_number <= 28)
);

-- Insert finals configuration
INSERT OR REPLACE INTO finals_config (round_number, round_name, requires_margin, margin_game_position) VALUES
(25, 'Finals Week 1', 1, 'last'),
(26, 'Semi Finals', 1, 'last'),
(27, 'Preliminary Finals', 1, 'last'),
(28, 'Grand Final', 1, 'last');

-- Add round winner tracking table for margin-based wins
CREATE TABLE IF NOT EXISTS round_winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  win_type VARCHAR(20) NOT NULL, -- 'normal', 'margin', 'tie'
  margin_difference INTEGER, -- For margin wins, how close they were
  points_awarded INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(round_id, user_id) -- One win record per user per round
);

-- Add indexes for margin prediction queries
CREATE INDEX IF NOT EXISTS idx_tips_margin_game ON tips(is_margin_game);
CREATE INDEX IF NOT EXISTS idx_tips_margin_prediction ON tips(margin_prediction);
CREATE INDEX IF NOT EXISTS idx_round_winners_round_id ON round_winners(round_id);
CREATE INDEX IF NOT EXISTS idx_round_winners_user_id ON round_winners(user_id);