import Database from './database';
import fs from 'fs';
import path from 'path';

export class DatabaseMigrations {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  private splitSqlStatements(sql: string): string[] {
    // Remove comments and split by semicolon
    return sql
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🔧 Running database migrations...');
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split statements properly and execute individually
      const statements = this.splitSqlStatements(schema);

      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.run(statement);
        }
      }

      console.log('✅ Schema migration completed');

      // Run seed data
      await this.runSeedData();

      console.log('🌱 Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async runSeedData(): Promise<void> {
    try {
      console.log('🌱 Seeding database...');
      
      const seedPath = path.join(__dirname, 'seed.sql');
      const seedData = fs.readFileSync(seedPath, 'utf8');
      
      // Split statements properly and execute individually
      const statements = this.splitSqlStatements(seedData);

      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.run(statement);
        }
      }

      console.log('✅ Seed data completed');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  async generateSquiggleGameKey(roundNumber: number, gameNumber: number): Promise<string> {
    // Generate squiggle_game_key as per specification
    // Format: [RoundNumber:2digits][GameNumber:1digit]
    const round = String(roundNumber).padStart(2, '0');
    const game = String(gameNumber);
    return `${round}${game}`;
  }

  async verifySetup(): Promise<void> {
    try {
      console.log('🔍 Verifying database setup...');
      
      // Check family groups
      const familyGroups = await this.db.all('SELECT COUNT(*) as count FROM family_groups');
      console.log(`📊 Family groups: ${familyGroups[0].count}`);
      
      // Check users
      const users = await this.db.all('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users: ${users[0].count}`);
      
      // Check admin users
      const admins = await this.db.all('SELECT name FROM users WHERE role = "admin"');
      console.log(`🔐 Admins: ${admins.map(u => u.name).join(', ')}`);
      
      // List all tables
      const tables = await this.db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      console.log(`📋 Tables: ${tables.map(t => t.name).join(', ')}`);
      
      console.log('✅ Database verification completed');
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }
}

export default DatabaseMigrations;