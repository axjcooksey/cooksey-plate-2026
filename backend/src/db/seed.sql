-- Seed data for Cooksey Plate database
-- Family Groups and Users based on CLAUDE.md specification

-- Insert Family Groups
INSERT OR IGNORE INTO family_groups (id, name) VALUES 
  (1, 'Ashtons & PFCs'),
  (2, 'PJCs'),
  (3, 'Chelsea Florences'),
  (4, 'Richmond Cookseys'),
  (5, 'South-East Cookseys'),
  (6, 'Perth Cookseys'),
  (7, 'Tassie Cookseys'),
  (8, 'Individuals');

-- Insert Users with family group assignments
INSERT OR IGNORE INTO users (name, family_group_id, role) VALUES 
  -- Ashtons & PFCs (7 members)
  ('David', 1, 'user'),
  ('Chris', 1, 'user'),
  ('Jamie', 1, 'user'),
  ('Emma', 1, 'user'),
  ('Zoe', 1, 'user'),
  ('Pop', 1, 'user'),
  ('Katie', 1, 'user'),
  
  -- PJCs (3 members)
  ('Phil', 2, 'admin'), -- Admin as per CLAUDE.md
  ('Tracy', 2, 'user'),
  ('Ryan', 2, 'user'),
  
  -- Chelsea Florences (3 members)
  ('Shannan', 3, 'user'),
  ('Tom', 3, 'user'),
  ('Billy', 3, 'user'),
  
  -- Richmond Cookseys (2 members)
  ('Alex', 4, 'admin'), -- Admin as per CLAUDE.md
  ('Ruby', 4, 'user'),
  
  -- South-East Cookseys (2 members)
  ('Mark', 5, 'user'),
  ('Henry', 5, 'user'),
  
  -- Perth Cookseys (3 members)
  ('Paulie', 6, 'user'),
  ('Jenni', 6, 'user'),
  ('Charlee', 6, 'user'),
  
  -- Tassie Cookseys (2 members)
  ('Anne', 7, 'user'),
  ('Stephen', 7, 'user'),
  
  -- Individuals (3 members)
  ('Jayne', 8, 'user'),
  ('Ant', 8, 'user');

-- Insert sample round for 2026 (Opening Round)
INSERT OR IGNORE INTO rounds (id, round_number, year, status) VALUES 
  (1, 0, 2026, 'upcoming'),
  (2, 1, 2026, 'upcoming');

-- Note: Squiggle games, games, and tips will be populated via API integration
-- Historical data will be imported from Excel via import scripts