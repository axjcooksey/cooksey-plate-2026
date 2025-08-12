import Database from '../db/database';
import { LadderEntry, LadderResponse } from '../types/api';

export class LadderService {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Calculate and return the current ladder for a year
   */
  async getLadder(year: number): Promise<LadderResponse> {
    const ladderData = await this.db.all(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        fg.name as family_group_name,
        COUNT(t.id) as total_tips,
        COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
        COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) as completed_tips,
        ROUND(
          CASE 
            WHEN COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) > 0 
            THEN CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
                 COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) * 100 
            ELSE 0 
          END, 2
        ) as percentage,
        MAX(r.round_number) as latest_round
      FROM users u
      LEFT JOIN family_groups fg ON u.family_group_id = fg.id
      LEFT JOIN tips t ON u.id = t.user_id
      LEFT JOIN rounds r ON t.round_id = r.id AND r.year = ?
      WHERE u.id IN (
        SELECT DISTINCT user_id FROM tips t2 
        LEFT JOIN rounds r2 ON t2.round_id = r2.id 
        WHERE r2.year = ?
      )
      GROUP BY u.id, u.name, fg.name
      ORDER BY correct_tips DESC, percentage DESC, u.name ASC
    `, [year, year]);

    // Add ranks
    const ladder: LadderEntry[] = ladderData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    // Get summary statistics
    const summary = await this.db.get(`
      SELECT 
        COUNT(DISTINCT r.id) as total_rounds,
        COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_rounds
      FROM rounds r
      WHERE r.year = ?
    `, [year]);

    return {
      ladder,
      year,
      last_updated: new Date().toISOString(),
      total_rounds: summary?.total_rounds || 0,
      completed_rounds: summary?.completed_rounds || 0
    };
  }

  /**
   * Get ladder position for a specific user
   */
  async getUserLadderPosition(userId: number, year: number): Promise<LadderEntry | null> {
    const userStats = await this.db.get(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        fg.name as family_group_name,
        COUNT(t.id) as total_tips,
        COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
        COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) as completed_tips,
        ROUND(
          CASE 
            WHEN COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) > 0 
            THEN CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
                 COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) * 100 
            ELSE 0 
          END, 2
        ) as percentage,
        MAX(r.round_number) as latest_round
      FROM users u
      LEFT JOIN family_groups fg ON u.family_group_id = fg.id
      LEFT JOIN tips t ON u.id = t.user_id
      LEFT JOIN rounds r ON t.round_id = r.id AND r.year = ?
      WHERE u.id = ?
      GROUP BY u.id, u.name, fg.name
    `, [year, userId]);

    if (!userStats) return null;

    // Calculate rank by counting users with better or equal performance
    const betterPerformers = await this.db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT 
          u.id,
          COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
          ROUND(
            CASE 
              WHEN COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) > 0 
              THEN CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
                   COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) * 100 
              ELSE 0 
            END, 2
          ) as percentage
        FROM users u
        LEFT JOIN tips t ON u.id = t.user_id
        LEFT JOIN rounds r ON t.round_id = r.id AND r.year = ?
        WHERE u.id IN (
          SELECT DISTINCT user_id FROM tips t2 
          LEFT JOIN rounds r2 ON t2.round_id = r2.id 
          WHERE r2.year = ?
        )
        GROUP BY u.id
      ) subquery
      WHERE 
        correct_tips > ? OR 
        (correct_tips = ? AND percentage > ?) OR
        (correct_tips = ? AND percentage = ? AND subquery.id < ?)
    `, [
      year, year,
      userStats.correct_tips,
      userStats.correct_tips, userStats.percentage,
      userStats.correct_tips, userStats.percentage, userId
    ]);

    return {
      ...userStats,
      rank: (betterPerformers?.count || 0) + 1
    };
  }

  /**
   * Get head-to-head comparison between two users
   */
  async getHeadToHeadComparison(user1Id: number, user2Id: number, year: number): Promise<any> {
    const comparison = await this.db.get(`
      SELECT 
        u1.name as user1_name,
        u2.name as user2_name,
        COUNT(CASE WHEN t1.is_correct = 1 AND t2.is_correct = 0 THEN 1 END) as user1_wins,
        COUNT(CASE WHEN t1.is_correct = 0 AND t2.is_correct = 1 THEN 1 END) as user2_wins,
        COUNT(CASE WHEN t1.is_correct = t2.is_correct AND t1.is_correct IS NOT NULL THEN 1 END) as draws,
        COUNT(CASE WHEN t1.is_correct IS NOT NULL AND t2.is_correct IS NOT NULL THEN 1 END) as total_compared
      FROM users u1
      CROSS JOIN users u2
      LEFT JOIN tips t1 ON u1.id = t1.user_id
      LEFT JOIN tips t2 ON u2.id = t2.user_id AND t1.game_id = t2.game_id
      LEFT JOIN rounds r ON t1.round_id = r.id AND r.year = ?
      WHERE u1.id = ? AND u2.id = ?
    `, [year, user1Id, user2Id]);

    return comparison;
  }

  /**
   * Get family group standings
   */
  async getFamilyGroupStandings(year: number): Promise<any[]> {
    const standings = await this.db.all(`
      SELECT 
        fg.id as family_group_id,
        fg.name as family_group_name,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(t.id) as total_tips,
        COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
        ROUND(
          CASE 
            WHEN COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) > 0 
            THEN CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
                 COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) * 100 
            ELSE 0 
          END, 2
        ) as percentage,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT u.id) > 0 
            THEN CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
                 COUNT(DISTINCT u.id)
            ELSE 0 
          END, 2
        ) as average_correct_per_member
      FROM family_groups fg
      LEFT JOIN users u ON fg.id = u.family_group_id
      LEFT JOIN tips t ON u.id = t.user_id
      LEFT JOIN rounds r ON t.round_id = r.id AND r.year = ?
      GROUP BY fg.id, fg.name
      HAVING COUNT(t.id) > 0
      ORDER BY correct_tips DESC, percentage DESC, fg.name ASC
    `, [year]);

    return standings.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  /**
   * Get round-by-round performance for a user
   */
  async getUserRoundByRoundPerformance(userId: number, year: number): Promise<any[]> {
    return await this.db.all(`
      SELECT 
        r.round_number,
        r.status,
        COUNT(t.id) as total_tips,
        COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
        COUNT(CASE WHEN t.is_correct = 0 THEN 1 END) as incorrect_tips,
        COUNT(CASE WHEN t.is_correct IS NULL THEN 1 END) as pending_tips,
        ROUND(
          CASE 
            WHEN COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) > 0 
            THEN CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
                 COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) * 100 
            ELSE 0 
          END, 2
        ) as percentage
      FROM rounds r
      LEFT JOIN tips t ON r.id = t.round_id AND t.user_id = ?
      WHERE r.year = ?
      GROUP BY r.id, r.round_number, r.status
      ORDER BY r.round_number
    `, [userId, year]);
  }

  /**
   * Get most/least popular tips for a round
   */
  async getRoundTipPopularity(roundId: number): Promise<any[]> {
    return await this.db.all(`
      SELECT 
        g.home_team,
        g.away_team,
        g.venue,
        COUNT(CASE WHEN t.selected_team = g.home_team THEN 1 END) as home_tips,
        COUNT(CASE WHEN t.selected_team = g.away_team THEN 1 END) as away_tips,
        COUNT(t.id) as total_tips,
        ROUND(
          COUNT(CASE WHEN t.selected_team = g.home_team THEN 1 END) * 100.0 / 
          NULLIF(COUNT(t.id), 0), 1
        ) as home_percentage
      FROM games g
      LEFT JOIN tips t ON g.id = t.game_id
      WHERE g.round_id = ?
      GROUP BY g.id, g.home_team, g.away_team, g.venue
      HAVING COUNT(t.id) > 0
      ORDER BY g.start_time
    `, [roundId]);
  }

  /**
   * Get streak information for a user
   */
  async getUserStreakInfo(userId: number, year: number): Promise<any> {
    // Get all tips for the user in chronological order
    const tips = await this.db.all(`
      SELECT 
        t.is_correct,
        g.start_time,
        r.round_number
      FROM tips t
      LEFT JOIN games g ON t.game_id = g.id
      LEFT JOIN rounds r ON t.round_id = r.id
      WHERE t.user_id = ? AND r.year = ? AND t.is_correct IS NOT NULL
      ORDER BY g.start_time
    `, [userId, year]);

    let currentStreak = 0;
    let longestCorrectStreak = 0;
    let longestIncorrectStreak = 0;
    let currentStreakType: 'correct' | 'incorrect' | null = null;

    for (const tip of tips) {
      if (tip.is_correct === 1) {
        if (currentStreakType === 'correct') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = 'correct';
        }
        longestCorrectStreak = Math.max(longestCorrectStreak, currentStreak);
      } else {
        if (currentStreakType === 'incorrect') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = 'incorrect';
        }
        longestIncorrectStreak = Math.max(longestIncorrectStreak, currentStreak);
      }
    }

    return {
      current_streak: currentStreak,
      current_streak_type: currentStreakType,
      longest_correct_streak: longestCorrectStreak,
      longest_incorrect_streak: longestIncorrectStreak,
      total_decided_tips: tips.length
    };
  }
}

export default LadderService;