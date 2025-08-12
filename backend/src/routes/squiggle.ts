import { Router } from 'express';
import Database from '../db/database';
import SquiggleService from '../services/SquiggleService';

const router = Router();

// Initialize services
let db: Database;
let squiggleService: SquiggleService;

// Initialize database connection
const initializeServices = async () => {
  if (!db) {
    db = new Database();
    await db.connect();
    squiggleService = new SquiggleService(db);
  }
};

/**
 * GET /api/squiggle/games/:year
 * Get all games for a specific year
 */
router.get('/games/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const round = req.query.round ? parseInt(req.query.round as string) : undefined;
    
    let games;
    if (round) {
      games = await db.all(`
        SELECT * FROM squiggle_games 
        WHERE year = ? AND round_number = ?
        ORDER BY game_number
      `, [year, round]);
    } else {
      games = await db.all(`
        SELECT * FROM squiggle_games 
        WHERE year = ?
        ORDER BY round_number, game_number
      `, [year]);
    }

    res.json({
      success: true,
      data: games,
      count: games.length,
      year,
      round
    });

  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/squiggle/rounds/:year
 * Get all rounds for a specific year
 */
router.get('/rounds/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    
    const rounds = await db.all(`
      SELECT 
        r.*,
        COUNT(g.id) as game_count,
        COUNT(CASE WHEN g.is_complete = 1 THEN 1 END) as completed_games
      FROM rounds r
      LEFT JOIN games g ON r.id = g.round_id
      WHERE r.year = ?
      GROUP BY r.id
      ORDER BY r.round_number
    `, [year]);

    res.json({
      success: true,
      data: rounds,
      count: rounds.length,
      year
    });

  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rounds',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/squiggle/update/:year
 * Manually trigger update for a specific year
 */
router.post('/update/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    
    console.log(`🔄 Manual update triggered for year ${year}`);
    const gameCount = await squiggleService.updateGamesForYear(year);
    
    res.json({
      success: true,
      message: `Successfully updated ${gameCount} games for ${year}`,
      gameCount,
      year
    });

  } catch (error) {
    console.error('Error updating games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/squiggle/live-scores/:year
 * Update live scores for current games
 */
router.post('/live-scores/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    
    console.log(`🔄 Live score update triggered for year ${year}`);
    await squiggleService.updateLiveScores(year);
    
    res.json({
      success: true,
      message: `Live scores updated for ${year}`,
      year
    });

  } catch (error) {
    console.error('Error updating live scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update live scores',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/squiggle/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req, res) => {
  try {
    await initializeServices();
    
    const cacheStats = squiggleService.getCacheStats();
    
    res.json({
      success: true,
      data: cacheStats
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/squiggle/cache
 * Clear cache
 */
router.delete('/cache', async (req, res) => {
  try {
    await initializeServices();
    
    squiggleService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/squiggle/stats/:year
 * Get statistics for a specific year
 */
router.get('/stats/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN complete = 1 THEN 1 END) as completed_games,
        COUNT(DISTINCT round_number) as total_rounds,
        MIN(date) as season_start,
        MAX(date) as season_end
      FROM squiggle_games 
      WHERE year = ?
    `, [year]);

    const roundsWithGames = await db.all(`
      SELECT 
        round_number,
        COUNT(*) as game_count,
        COUNT(CASE WHEN complete = 1 THEN 1 END) as completed_games
      FROM squiggle_games 
      WHERE year = ?
      GROUP BY round_number
      ORDER BY round_number
    `, [year]);

    res.json({
      success: true,
      data: {
        year,
        summary: stats,
        rounds: roundsWithGames
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/squiggle/teams
 * Get all AFL teams
 */
router.get('/teams', async (req, res) => {
  try {
    await initializeServices();
    
    const teams = await db.all(`
      SELECT * FROM teams
      ORDER BY name
    `);

    res.json({
      success: true,
      data: teams,
      count: teams.length
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/squiggle/update-teams
 * Manually trigger teams update from Squiggle API
 */
router.post('/update-teams', async (req, res) => {
  try {
    await initializeServices();
    
    console.log('🔄 Manual teams update triggered');
    const teamCount = await squiggleService.updateTeams();
    
    res.json({
      success: true,
      message: `Successfully updated ${teamCount} teams`,
      teamCount
    });

  } catch (error) {
    console.error('Error updating teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update teams',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;