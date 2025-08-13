import { Router } from 'express';
import Database from '../db/database';
import TipsService from '../services/TipsService';
import { ApiResponse } from '../types/api';

const router = Router();

// Initialize services
let db: Database;
let tipsService: TipsService;

const initializeServices = async () => {
  if (!db) {
    db = new Database();
    await db.connect();
    tipsService = new TipsService(db);
  }
};

/**
 * GET /api/rounds/current/:year
 * Get current round for a specific year
 */
router.get('/current/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const currentRound = await tipsService.getCurrentRound(year);
    
    if (!currentRound) {
      return res.status(404).json({
        success: false,
        error: 'No current round found',
        message: `No rounds found for year ${year}`
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: currentRound
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching current round:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current round',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/rounds/:year
 * Get all rounds for a specific year
 */
router.get('/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    
    const rounds = await db.all(`
      SELECT 
        r.*,
        COUNT(g.id) as game_count,
        COUNT(CASE WHEN g.is_complete = 1 THEN 1 END) as completed_games,
        MIN(g.start_time) as first_game_time,
        MAX(g.start_time) as last_game_time
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
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rounds',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/rounds/:id/games
 * Get games for a specific round
 */
router.get('/:id/games', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.id);
    
    // Validate roundId
    if (isNaN(roundId) || req.params.id === 'null') {
      return res.status(400).json({
        success: false,
        error: 'Invalid round ID',
        message: 'Round ID must be a valid number'
      });
    }
    
    // Validate tipsService is initialized
    if (!tipsService) {
      return res.status(500).json({
        success: false,
        error: 'Service initialization failed',
        message: 'TipsService is not properly initialized'
      });
    }
    
    const games = await tipsService.getGamesForTipping(roundId);
    
    res.json({
      success: true,
      data: games,
      count: games.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching round games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch round games',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/rounds/:id/tips
 * Get all tips for a specific round
 */
router.get('/:id/tips', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.id);
    const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;
    
    const tips = await tipsService.getTipsForRound(roundId, userId);
    
    res.json({
      success: true,
      data: tips,
      count: tips.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching round tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch round tips',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/rounds/:id/stats
 * Get statistics for a specific round
 */
router.get('/:id/stats', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.id);
    const stats = await tipsService.getRoundTipStats(roundId);
    
    res.json({
      success: true,
      data: stats
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching round stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch round statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * POST /api/rounds/:id/update-status
 * Update round status based on games
 */
router.post('/:id/update-status', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.id);
    await tipsService.updateRoundStatus(roundId);
    
    res.json({
      success: true,
      message: 'Round status updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating round status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update round status',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/rounds/:id/is-open
 * Check if round is open for tipping
 */
router.get('/:id/is-open', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.id);
    const isOpen = await tipsService.isRoundOpen(roundId);
    
    res.json({
      success: true,
      data: { is_open: isOpen }
    } as ApiResponse);

  } catch (error) {
    console.error('Error checking if round is open:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check round status',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;