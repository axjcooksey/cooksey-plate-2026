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

        // Insert or update tip with margin prediction support
        await this.db.run(`
          INSERT OR REPLACE INTO tips 
          (user_id, game_id, squiggle_game_key, round_id, selected_team, margin_prediction, is_margin_game, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          actualUserId, 
          tip.game_id, 
          tip.squiggle_game_key, 
          game.round_id, 
          tip.selected_team,
          tip.margin_prediction || null,
          tip.is_margin_game ? 1 : 0
        ]);

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
   * Get current round for a year using business logic with 2-day grace period
   */
  async getCurrentRound(year: number): Promise<Round | null> {
    // First, update all round statuses to ensure they're current
    await this.updateAllRoundStatuses(year);
    
    // Find the most recently completed round
    const latestCompletedRound = await this.db.get(`
      SELECT 
        r.*,
        MAX(sg.date) as last_game_time
      FROM rounds r
      LEFT JOIN games g ON r.id = g.round_id
      LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key
      WHERE r.year = ? AND r.status = 'completed'
      GROUP BY r.id
      ORDER BY r.round_number DESC
      LIMIT 1
    `, [year]);

    const now = new Date();
    
    // Check if we're still in the 2-day grace period after the latest completed round
    if (latestCompletedRound && latestCompletedRound.last_game_time) {
      const lastGameTime = new Date(latestCompletedRound.last_game_time);
      const twoDaysAfter = new Date(lastGameTime.getTime() + (2 * 24 * 60 * 60 * 1000));
      
      if (now <= twoDaysAfter) {
        // Still in grace period, show the completed round
        return latestCompletedRound;
      }
    }

    // Grace period over or no completed rounds, find active round
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

    // If still no round, get the latest round available
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
   * Update all round statuses for a year
   */
  async updateAllRoundStatuses(year: number): Promise<void> {
    const rounds = await this.db.all(`
      SELECT id FROM rounds WHERE year = ?
    `, [year]);

    for (const round of rounds) {
      await this.updateRoundStatus(round.id);
    }
  }

  /**
   * Update round status based on Squiggle game completion (complete field 0-100)
   */
  async updateRoundStatus(roundId: number): Promise<void> {
    const roundInfo = await this.db.get(`
      SELECT 
        r.*,
        COUNT(sg.id) as total_games,
        COUNT(CASE WHEN sg.complete = 100 THEN 1 END) as completed_games,
        COUNT(CASE WHEN sg.complete > 0 AND sg.complete < 100 THEN 1 END) as in_progress_games,
        MIN(sg.date) as first_game_time,
        MAX(sg.date) as last_game_time
      FROM rounds r
      LEFT JOIN games g ON r.id = g.round_id
      LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key
      WHERE r.id = ?
      GROUP BY r.id
    `, [roundId]);

    if (!roundInfo) return;

    let newStatus = roundInfo.status;
    const now = new Date();
    
    // Implement business logic for round status
    // Priority 1: Check if all games are completed first
    if (roundInfo.total_games > 0 && roundInfo.completed_games === roundInfo.total_games) {
      // All games complete (complete = 100) -> Round is completed
      newStatus = 'completed';
    } else if (roundInfo.in_progress_games > 0) {
      // Some games in progress (0 < complete < 100) -> Round is active
      newStatus = 'active';
    } else if (roundInfo.first_game_time && now >= new Date(roundInfo.first_game_time)) {
      // Current time is after first game start but no games in progress -> Round is active (started but not updated)
      newStatus = 'active';
    } else {
      // All games complete = 0 AND current time is before first game -> Round is upcoming
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

  /**
   * Get finals configuration for a round
   */
  async getFinalsConfig(roundNumber: number): Promise<any> {
    return await this.db.get(`
      SELECT * FROM finals_config 
      WHERE round_number = ?
    `, [roundNumber]);
  }

  /**
   * Determine if a game requires margin prediction
   */
  async isMarginGame(gameId: number, roundNumber: number): Promise<boolean> {
    // Check if this is a finals round
    if (roundNumber < 25 || roundNumber > 28) return false;
    
    const finalsConfig = await this.getFinalsConfig(roundNumber);
    if (!finalsConfig || !finalsConfig.requires_margin) return false;
    
    // Get all games for this round ordered by start time
    const roundGames = await this.db.all(`
      SELECT id, start_time FROM games g
      LEFT JOIN rounds r ON g.round_id = r.id
      WHERE r.round_number = ? AND r.year = 2025
      ORDER BY g.start_time
    `, [roundNumber]);
    
    if (!roundGames || roundGames.length === 0) return false;
    
    // Check position based on config
    if (finalsConfig.margin_game_position === 'last') {
      const lastGame = roundGames[roundGames.length - 1];
      return lastGame.id === gameId;
    } else if (finalsConfig.margin_game_position === 'first') {
      const firstGame = roundGames[0];
      return firstGame.id === gameId;
    } else if (finalsConfig.margin_game_position === 'all') {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate margin differences and update tips after game completion
   */
  async updateMarginPredictions(gameId: number): Promise<void> {
    // Get game result with actual margin
    const game = await this.db.get(`
      SELECT 
        g.*,
        sg.winner,
        sg.hmargin,
        ABS(sg.hscore - sg.ascore) as actual_margin
      FROM games g
      LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key
      WHERE g.id = ? AND g.is_complete = 1
    `, [gameId]);

    if (!game || !game.winner) return;

    // Update margin differences for all margin predictions for this game
    await this.db.run(`
      UPDATE tips 
      SET margin_difference = ABS(? - COALESCE(margin_prediction, 0))
      WHERE game_id = ? AND is_margin_game = 1 AND margin_prediction IS NOT NULL
    `, [game.actual_margin, gameId]);

    console.log(`Updated margin predictions for game ${gameId}, actual margin: ${game.actual_margin}`);
  }

  /**
   * Determine round winner based on margin predictions (closest wins)
   */
  async calculateMarginRoundWinner(roundId: number): Promise<any> {
    // Get all margin predictions for this round
    const marginTips = await this.db.all(`
      SELECT 
        t.user_id,
        t.margin_prediction,
        t.margin_difference,
        t.selected_team,
        t.is_correct,
        u.name as user_name,
        g.home_team,
        g.away_team
      FROM tips t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN games g ON t.game_id = g.id
      WHERE t.round_id = ? 
        AND t.is_margin_game = 1 
        AND t.margin_prediction IS NOT NULL
        AND t.margin_difference IS NOT NULL
        AND t.is_correct = 1
      ORDER BY t.margin_difference ASC
    `, [roundId]);

    if (!marginTips || marginTips.length === 0) return null;

    // Find the closest margin prediction (smallest difference)
    const closestMargin = marginTips[0].margin_difference;
    const winners = marginTips.filter(tip => tip.margin_difference === closestMargin);

    // Insert round winners
    for (const winner of winners) {
      await this.db.run(`
        INSERT OR REPLACE INTO round_winners 
        (round_id, user_id, win_type, margin_difference, points_awarded)
        VALUES (?, ?, 'margin', ?, 1)
      `, [roundId, winner.user_id, winner.margin_difference]);
    }

    return {
      winners: winners.map(w => ({
        user_id: w.user_id,
        user_name: w.user_name,
        margin_difference: w.margin_difference
      })),
      margin_difference: closestMargin
    };
  }

  /**
   * Get round winners for a specific round
   */
  async getRoundWinners(roundId: number): Promise<any[]> {
    return await this.db.all(`
      SELECT 
        rw.*,
        u.name as user_name
      FROM round_winners rw
      LEFT JOIN users u ON rw.user_id = u.id
      WHERE rw.round_id = ?
      ORDER BY rw.margin_difference ASC
    `, [roundId]);
  }
}

export default TipsService;