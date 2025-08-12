-- Update Cooksey Plate Database Schema
-- Add teams table and fix complete field (0-100 instead of 0/1)

-- Create teams table for AFL team information
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY, -- Using Squiggle team ID as primary key
  name VARCHAR(50) NOT NULL UNIQUE,
  abbrev VARCHAR(10) NOT NULL UNIQUE,
  logo TEXT,
  primary_colour VARCHAR(10),
  secondary_colour VARCHAR(10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update squiggle_games table to include all available fields
-- Add new columns if they don't exist
ALTER TABLE squiggle_games ADD COLUMN localtime DATETIME;
ALTER TABLE squiggle_games ADD COLUMN hmargin INTEGER DEFAULT 0;
ALTER TABLE squiggle_games ADD COLUMN is_final INTEGER DEFAULT 0;
ALTER TABLE squiggle_games ADD COLUMN is_grand_final INTEGER DEFAULT 0;

-- Note: complete field should already be INTEGER and support 0-100 range
-- But let's ensure it's properly documented that it's 0-100, not boolean

-- Add index on teams table
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_abbrev ON teams(abbrev);

-- Add trigger for teams updated_at
CREATE TRIGGER IF NOT EXISTS update_teams_updated_at
  AFTER UPDATE ON teams
BEGIN
  UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;