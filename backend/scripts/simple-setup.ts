#!/usr/bin/env node

import Database from '../src/db/database';
import dotenv from 'dotenv';

dotenv.config();

async function createTables() {
  const db = new Database();
  
  try {
    console.log('🚀 Setting up Cooksey Plate database...');
    await db.connect();

    // Create tables one by one
    console.log('📋 Creating family_groups table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS family_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('👥 Creating users table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100),
        family_group_id INTEGER,
        role VARCHAR(20) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_group_id) REFERENCES family_groups(id)
      )
    `);

    console.log('🎯 Creating squiggle_games table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS squiggle_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        squiggle_game_key VARCHAR(3) NOT NULL UNIQUE,
        round_number INTEGER NOT NULL,
        game_number INTEGER NOT NULL,
        year INTEGER NOT NULL,
        complete INTEGER DEFAULT 0,
        date DATETIME,
        tz VARCHAR(50),
        hteam VARCHAR(50),
        ateam VARCHAR(50),
        hscore INTEGER DEFAULT 0,
        ascore INTEGER DEFAULT 0,
        hgoals INTEGER DEFAULT 0,
        agoals INTEGER DEFAULT 0,
        hbehinds INTEGER DEFAULT 0,
        abehinds INTEGER DEFAULT 0,
        venue VARCHAR(100),
        winner VARCHAR(50),
        updated DATETIME,
        raw_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🏆 Creating rounds table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round_number INTEGER NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'upcoming',
        lockout_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(round_number, year)
      )
    `);

    console.log('⚽ Creating games table...');
    await db.run(`
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
        is_complete INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (round_id) REFERENCES rounds(id),
        FOREIGN KEY (squiggle_game_key) REFERENCES squiggle_games(squiggle_game_key),
        UNIQUE(squiggle_game_key)
      )
    `);

    console.log('📝 Creating tips table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        squiggle_game_key VARCHAR(3) NOT NULL,
        round_id INTEGER NOT NULL,
        selected_team VARCHAR(50) NOT NULL,
        is_correct INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (squiggle_game_key) REFERENCES squiggle_games(squiggle_game_key),
        FOREIGN KEY (round_id) REFERENCES rounds(id),
        UNIQUE(user_id, game_id)
      )
    `);

    console.log('📚 Creating historical_tips table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS historical_tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name VARCHAR(50) NOT NULL,
        round_number INTEGER NOT NULL,
        game_number INTEGER NOT NULL,
        squiggle_game_key VARCHAR(3) NOT NULL,
        selected_team VARCHAR(50) NOT NULL,
        is_correct INTEGER,
        year INTEGER NOT NULL,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (squiggle_game_key) REFERENCES squiggle_games(squiggle_game_key)
      )
    `);

    console.log('📊 Creating import_logs table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        import_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        records_processed INTEGER DEFAULT 0,
        error_message TEXT,
        file_name VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    console.log('📇 Creating indexes...');
    await db.run('CREATE INDEX IF NOT EXISTS idx_squiggle_games_key ON squiggle_games(squiggle_game_key)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_squiggle_games_round_year ON squiggle_games(round_number, year)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_games_squiggle_key ON games(squiggle_game_key)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_games_round_id ON games(round_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_tips_user_id ON tips(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_tips_squiggle_key ON tips(squiggle_game_key)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_tips_round_id ON tips(round_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_historical_tips_squiggle_key ON historical_tips(squiggle_game_key)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_users_family_group ON users(family_group_id)');

    // Insert seed data
    console.log('🌱 Seeding data...');
    
    // Family groups
    await db.run(`INSERT OR IGNORE INTO family_groups (id, name) VALUES 
      (1, 'Ashtons & PFCs'),
      (2, 'PJCs'),
      (3, 'Chelsea Florences'),
      (4, 'Richmond Cookseys'),
      (5, 'South-East Cookseys'),
      (6, 'Perth Cookseys'),
      (7, 'Tassie Cookseys'),
      (8, 'Individuals')`);

    // Users
    const users = [
      // Ashtons & PFCs
      ['David', 1, 'user'], ['Chris', 1, 'user'], ['Jamie', 1, 'user'], 
      ['Emma', 1, 'user'], ['Zoe', 1, 'user'], ['Pop', 1, 'user'], ['Katie', 1, 'user'],
      // PJCs
      ['Phil', 2, 'admin'], ['Tracy', 2, 'user'], ['Ryan', 2, 'user'],
      // Chelsea Florences
      ['Shannan', 3, 'user'], ['Tom', 3, 'user'], ['Billy', 3, 'user'],
      // Richmond Cookseys
      ['Alex', 4, 'admin'], ['Ruby', 4, 'user'],
      // South-East Cookseys
      ['Mark', 5, 'user'], ['Henry', 5, 'user'],
      // Perth Cookseys
      ['Paulie', 6, 'user'], ['Jenni', 6, 'user'], ['Charlee', 6, 'user'],
      // Tassie Cookseys
      ['Anne', 7, 'user'], ['Stephen', 7, 'user'],
      // Individuals
      ['Jayne', 8, 'user'], ['Ant', 8, 'user']
    ];

    for (const [name, groupId, role] of users) {
      await db.run('INSERT OR IGNORE INTO users (name, family_group_id, role) VALUES (?, ?, ?)', [name, groupId, role]);
    }

    // Sample rounds for 2026 season
    await db.run('INSERT OR IGNORE INTO rounds (id, round_number, year, status) VALUES (1, 0, 2026, "upcoming")');
    await db.run('INSERT OR IGNORE INTO rounds (id, round_number, year, status) VALUES (2, 1, 2026, "upcoming")');

    // Verify setup
    const familyGroups = await db.get('SELECT COUNT(*) as count FROM family_groups');
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"');

    console.log('');
    console.log('✅ Database setup completed successfully!');
    console.log(`📊 Family groups: ${familyGroups.count}`);
    console.log(`👥 Users: ${userCount.count}`);
    console.log(`🔐 Admins: ${adminCount.count}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Run Squiggle API integration');
    console.log('2. Import historical data from Excel');
    console.log('3. Start the backend server');

  } catch (error) {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

createTables();