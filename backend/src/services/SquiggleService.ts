import axios from 'axios';
import Database from '../db/database';
import { SquiggleApiGamesResponse, SquiggleApiTeamsResponse, SquiggleGame, SquiggleTeam, ProcessedGame, CachedData } from '../types/squiggle';

export class SquiggleService {
  private db: Database;
  private apiUrl: string;
  private gamesCache: Map<string, CachedData> = new Map();
  private teamsCache: Map<string, CachedData> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes during games
  private offSeasonTTL = 60 * 60 * 1000; // 1 hour during off-season

  constructor(database: Database) {
    this.db = database;
    this.apiUrl = process.env.SQUIGGLE_API_URL || 'https://api.squiggle.com.au';
  }

  /**
   * Generate squiggle_game_key from round and game numbers
   * Format: [RoundNumber:2digits][GameNumber:1digit]
   */
  generateSquiggleGameKey(roundNumber: number, gameNumber: number): string {
    const round = String(roundNumber).padStart(2, '0');
    const game = String(gameNumber);
    return `${round}${game}`;
  }

  /**
   * Fetch games from Squiggle API with caching
   */
  async fetchGames(year: number, round?: number): Promise<SquiggleApiGamesResponse> {
    const cacheKey = `games_${year}_${round || 'all'}`;
    const cached = this.gamesCache.get(cacheKey);

    // Check if cached data is still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📋 Using cached Squiggle data for ${cacheKey}`);
      return cached.data as SquiggleApiGamesResponse;
    }

    try {
      console.log(`🌐 Fetching Squiggle API data for year ${year}${round ? `, round ${round}` : ''}`);
      
      let url = `${this.apiUrl}/?q=games;year=${year};format=json`;
      if (round) {
        url += `;round=${round}`;
      }

      const response = await axios.get<SquiggleApiGamesResponse>(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Cooksey-Plate-2026/1.0'
        }
      });

      // Cache the response
      const ttl = this.isGameDay() ? this.defaultTTL : this.offSeasonTTL;
      this.gamesCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response.data,
        ttl
      });

      console.log(`✅ Fetched ${response.data.games.length} games from Squiggle API`);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to fetch from Squiggle API:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log('📋 Using expired cache as fallback');
        return cached.data as SquiggleApiGamesResponse;
      }
      
      throw new Error(`Squiggle API request failed: ${error}`);
    }
  }

  /**
   * Fetch teams from Squiggle API with caching
   */
  async fetchTeams(): Promise<SquiggleApiTeamsResponse> {
    const cacheKey = 'teams';
    const cached = this.teamsCache.get(cacheKey);

    // Check if cached data is still valid (teams don't change often, so longer TTL)
    const teamsTTL = 24 * 60 * 60 * 1000; // 24 hours
    if (cached && Date.now() - cached.timestamp < teamsTTL) {
      console.log('📋 Using cached teams data');
      return cached.data as SquiggleApiTeamsResponse;
    }

    try {
      console.log('🌐 Fetching teams from Squiggle API');
      
      const url = `${this.apiUrl}/?q=teams;format=json`;
      const response = await axios.get<SquiggleApiTeamsResponse>(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Cooksey-Plate-2026/1.0'
        }
      });

      // Cache the response
      this.teamsCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response.data,
        ttl: teamsTTL
      });

      console.log(`✅ Fetched ${response.data.teams.length} teams from Squiggle API`);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to fetch teams from Squiggle API:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log('📋 Using expired teams cache as fallback');
        return cached.data as SquiggleApiTeamsResponse;
      }
      
      throw new Error(`Squiggle Teams API request failed: ${error}`);
    }
  }

  /**
   * Process raw Squiggle games and generate game numbers
   */
  processGames(squiggleGames: SquiggleGame[], year: number): ProcessedGame[] {
    // Group games by round to assign game numbers
    const gamesByRound: { [round: number]: SquiggleGame[] } = {};
    
    squiggleGames.forEach(game => {
      if (!gamesByRound[game.round]) {
        gamesByRound[game.round] = [];
      }
      gamesByRound[game.round].push(game);
    });

    const processedGames: ProcessedGame[] = [];

    // Process each round and assign game numbers
    Object.keys(gamesByRound).forEach(roundStr => {
      const roundNumber = parseInt(roundStr);
      const roundGames = gamesByRound[roundNumber];
      
      // Sort games by date to maintain consistent numbering
      roundGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      roundGames.forEach((game, index) => {
        const gameNumber = index + 1;
        const squiggleGameKey = this.generateSquiggleGameKey(roundNumber, gameNumber);

        const processedGame: ProcessedGame = {
          squiggleGameKey,
          roundNumber,
          gameNumber,
          year,
          complete: game.complete === 100, // 100 = complete, not 1
          date: new Date(game.date),
          homeTeam: game.hteam,
          awayTeam: game.ateam,
          homeScore: game.hscore || 0,
          awayScore: game.ascore || 0,
          homeGoals: game.hgoals || 0,
          awayGoals: game.agoals || 0,
          homeBehinds: game.hbehinds || 0,
          awayBehinds: game.abehinds || 0,
          venue: game.venue,
          winner: game.winner || null,
          timezone: game.tz || 'Australia/Melbourne',
          rawJson: JSON.stringify(game)
        };

        processedGames.push(processedGame);
      });
    });

    return processedGames;
  }

  /**
   * Save processed games to database
   */
  async saveGamesToDatabase(games: ProcessedGame[]): Promise<void> {
    console.log(`💾 Saving ${games.length} games to database...`);

    for (const game of games) {
      try {
        // Skip games with missing essential data
        if (!game.homeTeam || !game.awayTeam || !game.venue) {
          console.log(`⚠️  Skipping game ${game.squiggleGameKey} - missing essential data`);
          continue;
        }
        // Get raw game data for all fields
        const rawGame = JSON.parse(game.rawJson);

        // Insert into squiggle_games table (complete mirror with all fields)
        await this.db.run(`
          INSERT OR REPLACE INTO squiggle_games 
          (squiggle_game_key, round_number, game_number, year, complete, date, tz,
           hteam, ateam, hscore, ascore, hgoals, agoals, hbehinds, abehinds, 
           venue, winner, localtime, hmargin, is_final, is_grand_final, raw_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          game.squiggleGameKey, game.roundNumber, game.gameNumber, game.year,
          rawGame.complete || 0, // Keep as 0-100 value, not boolean
          game.date.toISOString(), game.timezone,
          game.homeTeam, game.awayTeam, game.homeScore, game.awayScore,
          game.homeGoals, game.awayGoals, game.homeBehinds, game.awayBehinds,
          game.venue, game.winner, rawGame.localtime, rawGame.hmargin || 0,
          rawGame.is_final || 0, rawGame.is_grand_final || 0, game.rawJson
        ]);

        // Ensure round exists
        await this.db.run(`
          INSERT OR IGNORE INTO rounds (round_number, year, status)
          VALUES (?, ?, ?)
        `, [game.roundNumber, game.year, game.complete ? 'completed' : 'upcoming']);

        // Get round_id
        const round = await this.db.get(`
          SELECT id FROM rounds WHERE round_number = ? AND year = ?
        `, [game.roundNumber, game.year]);

        if (round) {
          // Insert into games table (application-specific)
          await this.db.run(`
            INSERT OR REPLACE INTO games 
            (squiggle_game_key, round_id, home_team, away_team, home_score, away_score,
             start_time, venue, is_complete, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            game.squiggleGameKey, round.id, game.homeTeam, game.awayTeam,
            game.homeScore, game.awayScore, game.date.toISOString(),
            game.venue, game.complete ? 1 : 0
          ]);
        }

      } catch (error) {
        console.error(`❌ Failed to save game ${game.squiggleGameKey}:`, error);
      }
    }

    console.log('✅ Games saved to database successfully');
  }

  /**
   * Save teams to database
   */
  async saveTeamsToDatabase(teams: SquiggleTeam[]): Promise<void> {
    console.log(`💾 Saving ${teams.length} teams to database...`);

    for (const team of teams) {
      try {
        await this.db.run(`
          INSERT OR REPLACE INTO teams 
          (id, name, abbrev, logo, primary_colour, secondary_colour, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          team.id, team.name, team.abbrev, team.logo || null,
          team.primarycolour || null, team.secondarycolour || null
        ]);
      } catch (error) {
        console.error(`❌ Failed to save team ${team.name}:`, error);
      }
    }

    console.log('✅ Teams saved to database successfully');
  }

  /**
   * Fetch and update all teams
   */
  async updateTeams(): Promise<number> {
    try {
      const response = await this.fetchTeams();
      await this.saveTeamsToDatabase(response.teams);
      
      // Log import
      await this.db.run(`
        INSERT INTO import_logs (import_type, status, records_processed, file_name)
        VALUES (?, ?, ?, ?)
      `, ['teams', 'success', response.teams.length, 'squiggle_teams.json']);

      return response.teams.length;
    } catch (error) {
      // Log error
      await this.db.run(`
        INSERT INTO import_logs (import_type, status, records_processed, error_message)
        VALUES (?, ?, ?, ?)
      `, ['teams', 'error', 0, error instanceof Error ? error.message : 'Unknown error']);
      
      throw error;
    }
  }

  /**
   * Fetch and update all games for a year
   */
  async updateGamesForYear(year: number): Promise<number> {
    try {
      const response = await this.fetchGames(year);
      const processedGames = this.processGames(response.games, year);
      await this.saveGamesToDatabase(processedGames);
      
      // Log import
      await this.db.run(`
        INSERT INTO import_logs (import_type, status, records_processed, file_name)
        VALUES (?, ?, ?, ?)
      `, ['squiggle', 'success', processedGames.length, `squiggle_${year}.json`]);

      return processedGames.length;
    } catch (error) {
      // Log error
      await this.db.run(`
        INSERT INTO import_logs (import_type, status, records_processed, error_message)
        VALUES (?, ?, ?, ?)
      `, ['squiggle', 'error', 0, error instanceof Error ? error.message : 'Unknown error']);
      
      throw error;
    }
  }

  /**
   * Update scores for completed games
   */
  async updateLiveScores(year: number): Promise<void> {
    console.log('🔄 Updating live scores...');
    
    try {
      const response = await this.fetchGames(year);
      const processedGames = this.processGames(response.games, year);
      
      // Only update games that are complete or in progress
      const activeGames = processedGames.filter(game => {
        const rawGame = JSON.parse(game.rawJson);
        return rawGame.complete > 0 || game.homeScore > 0 || game.awayScore > 0;
      });

      for (const game of activeGames) {
        const rawGame = JSON.parse(game.rawJson);
        const isComplete = rawGame.complete === 100;
        
        await this.db.run(`
          UPDATE squiggle_games 
          SET hscore = ?, ascore = ?, hgoals = ?, agoals = ?, hbehinds = ?, abehinds = ?,
              complete = ?, winner = ?, raw_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE squiggle_game_key = ?
        `, [
          game.homeScore, game.awayScore, game.homeGoals, game.awayGoals,
          game.homeBehinds, game.awayBehinds, rawGame.complete || 0,
          game.winner, game.rawJson, game.squiggleGameKey
        ]);

        await this.db.run(`
          UPDATE games 
          SET home_score = ?, away_score = ?, is_complete = ?, updated_at = CURRENT_TIMESTAMP
          WHERE squiggle_game_key = ?
        `, [game.homeScore, game.awayScore, isComplete ? 1 : 0, game.squiggleGameKey]);

        // Update tip correctness for completed games
        if (isComplete && game.winner) {
          await this.db.run(`
            UPDATE tips 
            SET is_correct = CASE 
              WHEN selected_team = ? THEN 1 
              ELSE 0 
            END
            WHERE squiggle_game_key = ? AND is_correct IS NULL
          `, [game.winner, game.squiggleGameKey]);
        }
      }

      console.log(`✅ Updated ${activeGames.length} active games`);
    } catch (error) {
      console.error('❌ Failed to update live scores:', error);
    }
  }

  /**
   * Check if it's currently a game day (weekend)
   */
  private isGameDay(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6; // Weekend
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.gamesCache.clear();
    this.teamsCache.clear();
    console.log('🗑️ Squiggle cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    const allKeys = [
      ...Array.from(this.gamesCache.keys()),
      ...Array.from(this.teamsCache.keys())
    ];
    return {
      size: this.gamesCache.size + this.teamsCache.size,
      keys: allKeys
    };
  }
}

export default SquiggleService;