import Database from '../db/database';
import { Tip, TipSubmission, Game, Round } from '../types/api';

export class TipsService {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Submit tips for a user
   */
  async submitTips(userId: number, tips: TipSubmission[], targetUserId?: number): Promise<number> {
    const actualUserId = targetUserId || userId;
    let submittedCount = 0;

    for (const tip of tips) {
      try {
        // Validate game exists and get round info
        const game = await this.db.get(`
          SELECT g.*, r.round_number, r.year, r.lockout_time
          FROM games g
          LEFT JOIN rounds r ON g.round_id = r.id
          WHERE g.id = ?
        `, [tip.game_id]);

        if (!game) {
          console.warn(`Game ${tip.game_id} not found, skipping tip`);
          continue;
        }

        // Check if round is still open for tips
        if (game.lockout_time && new Date() > new Date(game.lockout_time)) {
          console.warn(`Round ${game.round_number} locked, skipping tip for game ${tip.game_id}`);
          continue;
        }

        // Validate selected team is one of the playing teams
        if (tip.selected_team !== game.home_team && tip.selected_team !== game.away_team) {
          console.warn(`Invalid team selection for game ${tip.game_id}: ${tip.selected_team}`);
          continue;
        }

        // Insert or update tip
        await this.db.run(`
          INSERT OR REPLACE INTO tips 
          (user_id, game_id, squiggle_game_key, round_id, selected_team, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [actualUserId, tip.game_id, tip.squiggle_game_key, game.round_id, tip.selected_team]);

        submittedCount++;

      } catch (error) {
        console.error(`Failed to submit tip for game ${tip.game_id}:`, error);
      }
    }

    return submittedCount;
  }

  /**
   * Get tips for a specific round
   */
  async getTipsForRound(roundId: number, userId?: number): Promise<Tip[]> {
    let query = `
      SELECT 
        t.*,
        u.name as user_name,
        g.home_team,
        g.away_team,
        g.venue,
        g.start_time,
        g.is_complete
      FROM tips t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN games g ON t.game_id = g.id
      WHERE t.round_id = ?
    `;
    
    const params = [roundId];
    
    if (userId) {
      query += ` AND t.user_id = ?`;
      params.push(userId);
    }
    
    query += ` ORDER BY g.start_time, u.name`;

    return await this.db.all(query, params);
  }

  /**
   * Get tips for a specific user and round
   */
  async getUserTipsForRound(userId: number, roundId: number): Promise<Tip[]> {
    return await this.db.all(`
      SELECT 
        t.*,
        g.home_team,
        g.away_team,
        g.venue,
        g.start_time,
        g.is_complete,
        g.home_score,
        g.away_score
      FROM tips t
      LEFT JOIN games g ON t.game_id = g.id
      WHERE t.user_id = ? AND t.round_id = ?
      ORDER BY g.start_time
    `, [userId, roundId]);
  }

  /**
   * Get all tips for a user across all rounds
   */
  async getAllUserTips(userId: number, year?: number): Promise<Tip[]> {
    let query = `
      SELECT 
        t.*,
        g.home_team,
        g.away_team,
        g.venue,
        g.start_time,
        g.is_complete,
        g.home_score,
        g.away_score,
        r.round_number,
        r.year
      FROM tips t
      LEFT JOIN games g ON t.game_id = g.id
      LEFT JOIN rounds r ON t.round_id = r.id
      WHERE t.user_id = ?
    `;
    
    const params = [userId];
    
    if (year) {
      query += ` AND r.year = ?`;
      params.push(year);
    }
    
    query += ` ORDER BY r.round_number, g.start_time`;

    return await this.db.all(query, params);
  }

  /**
   * Check if round is open for tipping
   */
  async isRoundOpen(roundId: number): Promise<boolean> {
    const round = await this.db.get(`
      SELECT lockout_time FROM rounds WHERE id = ?
    `, [roundId]);

    if (!round || !round.lockout_time) return true;

    return new Date() <= new Date(round.lockout_time);
  }

  /**
   * Get current round for a year
   */
  async getCurrentRound(year: number): Promise<Round | null> {
    // First try to find an active round
    let round = await this.db.get(`
      SELECT * FROM rounds 
      WHERE year = ? AND status = 'active'
      ORDER BY round_number LIMIT 1
    `, [year]);

    // If no active round, find the next upcoming round
    if (!round) {
      round = await this.db.get(`
        SELECT * FROM rounds 
        WHERE year = ? AND status = 'upcoming'
        ORDER BY round_number LIMIT 1
      `, [year]);
    }

    // If no upcoming rounds, get the latest round
    if (!round) {
      round = await this.db.get(`
        SELECT * FROM rounds 
        WHERE year = ?
        ORDER BY round_number DESC LIMIT 1
      `, [year]);
    }

    return round || null;
  }

  /**
   * Update round status based on games
   */
  async updateRoundStatus(roundId: number): Promise<void> {
    const roundInfo = await this.db.get(`
      SELECT 
        r.*,
        COUNT(g.id) as total_games,
        COUNT(CASE WHEN g.is_complete = 1 THEN 1 END) as completed_games,
        MIN(g.start_time) as first_game_time
      FROM rounds r
      LEFT JOIN games g ON r.id = g.round_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [roundId]);

    if (!roundInfo) return;

    let newStatus = roundInfo.status;
    
    // Determine status based on games
    if (roundInfo.completed_games === roundInfo.total_games && roundInfo.total_games > 0) {
      newStatus = 'completed';
    } else if (roundInfo.first_game_time && new Date() >= new Date(roundInfo.first_game_time)) {
      newStatus = 'active';
    } else {
      newStatus = 'upcoming';
    }

    // Update status if changed
    if (newStatus !== roundInfo.status) {
      await this.db.run(`
        UPDATE rounds SET status = ? WHERE id = ?
      `, [newStatus, roundId]);
      
      console.log(`Round ${roundInfo.round_number} status updated to: ${newStatus}`);
    }

    // Set lockout time if not set and we have games
    if (!roundInfo.lockout_time && roundInfo.first_game_time) {
      await this.db.run(`
        UPDATE rounds SET lockout_time = ? WHERE id = ?
      `, [roundInfo.first_game_time, roundId]);
      
      console.log(`Round ${roundInfo.round_number} lockout time set to: ${roundInfo.first_game_time}`);
    }
  }

  /**
   * Calculate tip correctness for completed games
   */
  async updateTipCorrectness(gameId: number): Promise<void> {
    // Get game result
    const game = await this.db.get(`
      SELECT 
        g.*,
        sg.winner
      FROM games g
      LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key
      WHERE g.id = ? AND g.is_complete = 1
    `, [gameId]);

    if (!game || !game.winner) return;

    // Update tip correctness
    await this.db.run(`
      UPDATE tips 
      SET is_correct = CASE 
        WHEN selected_team = ? THEN 1 
        ELSE 0 
      END
      WHERE game_id = ? AND is_correct IS NULL
    `, [game.winner, gameId]);

    console.log(`Updated tip correctness for game ${gameId}, winner: ${game.winner}`);
  }

  /**
   * Get tip statistics for a round
   */
  async getRoundTipStats(roundId: number): Promise<any> {
    return await this.db.get(`
      SELECT 
        COUNT(DISTINCT t.user_id) as users_tipped,
        COUNT(t.id) as total_tips,
        COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
        COUNT(CASE WHEN t.is_correct = 0 THEN 1 END) as incorrect_tips,
        COUNT(CASE WHEN t.is_correct IS NULL THEN 1 END) as pending_tips,
        COUNT(DISTINCT t.game_id) as games_with_tips
      FROM tips t
      WHERE t.round_id = ?
    `, [roundId]);
  }

  /**
   * Delete tip
   */
  async deleteTip(tipId: number, userId: number): Promise<boolean> {
    // Check if user owns the tip
    const tip = await this.db.get(`
      SELECT t.*, r.lockout_time
      FROM tips t
      LEFT JOIN rounds r ON t.round_id = r.id
      WHERE t.id = ? AND t.user_id = ?
    `, [tipId, userId]);

    if (!tip) return false;

    // Check if round is still open
    if (tip.lockout_time && new Date() > new Date(tip.lockout_time)) {
      throw new Error('Cannot delete tip after round lockout');
    }

    const result = await this.db.run(`DELETE FROM tips WHERE id = ?`, [tipId]);
    return (result.changes || 0) > 0;
  }

  /**
   * Get games available for tipping in a round
   */
  async getGamesForTipping(roundId: number): Promise<Game[]> {
    return await this.db.all(`
      SELECT 
        g.*,
        r.round_number,
        r.status as round_status,
        r.lockout_time
      FROM games g
      LEFT JOIN rounds r ON g.round_id = r.id
      WHERE g.round_id = ?
      ORDER BY g.start_time
    `, [roundId]);
  }
}

export default TipsService;