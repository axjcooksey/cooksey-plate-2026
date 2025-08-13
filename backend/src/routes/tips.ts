import { Router } from 'express';
import Database from '../db/database';
import TipsService from '../services/TipsService';
import UserService from '../services/UserService';
import { ApiResponse, TipSubmission } from '../types/api';

const router = Router();

// Initialize services
let db: Database;
let tipsService: TipsService;
let userService: UserService;

const initializeServices = async () => {
  if (!db) {
    db = new Database();
    await db.connect();
    tipsService = new TipsService(db);
    userService = new UserService(db);
  }
};

/**
 * POST /api/tips
 * Submit tips for a user
 */
router.post('/', async (req, res) => {
  try {
    await initializeServices();
    
    const { user_id, tips, tip_for_user } = req.body;
    
    if (!user_id || !tips || !Array.isArray(tips)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id and tips array'
      } as ApiResponse);
    }

    // If tipping for someone else, validate permission
    let targetUserId = user_id;
    if (tip_for_user) {
      const targetUser = await userService.getUserByName(tip_for_user);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Target user not found'
        } as ApiResponse);
      }
      
      const canTipFor = await userService.canUserTipFor(user_id, targetUser.id);
      if (!canTipFor) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to tip for this user'
        } as ApiResponse);
      }
      
      targetUserId = targetUser.id;
    }

    const submittedCount = await tipsService.submitTips(user_id, tips, targetUserId);
    
    res.json({
      success: true,
      message: `Successfully submitted ${submittedCount} tips`,
      data: {
        submitted_count: submittedCount,
        total_attempted: tips.length,
        target_user_id: targetUserId
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error submitting tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit tips',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/tips/user/:userId/round/:roundId
 * Get tips for a specific user and round
 */
router.get('/user/:userId/round/:roundId', async (req, res) => {
  try {
    await initializeServices();
    
    const userId = parseInt(req.params.userId);
    const roundId = parseInt(req.params.roundId);
    
    const tips = await tipsService.getUserTipsForRound(userId, roundId);
    
    res.json({
      success: true,
      data: tips,
      count: tips.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user round tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user round tips',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/tips/user/:userId
 * Get all tips for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    await initializeServices();
    
    const userId = parseInt(req.params.userId);
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const tips = await tipsService.getAllUserTips(userId, year);
    
    res.json({
      success: true,
      data: tips,
      count: tips.length,
      year
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tips',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/tips/round/:roundId
 * Get all tips for a specific round
 */
router.get('/round/:roundId', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.roundId);
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
 * DELETE /api/tips/:tipId
 * Delete a specific tip (if round is still open)
 */
router.delete('/:tipId', async (req, res) => {
  try {
    await initializeServices();
    
    const tipId = parseInt(req.params.tipId);
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: user_id'
      } as ApiResponse);
    }
    
    const deleted = await tipsService.deleteTip(tipId, user_id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tip not found or you do not have permission to delete it'
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Tip deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting tip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tip',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * POST /api/tips/game/:gameId/update-correctness
 * Update tip correctness for a completed game
 */
router.post('/game/:gameId/update-correctness', async (req, res) => {
  try {
    await initializeServices();
    
    const gameId = parseInt(req.params.gameId);
    await tipsService.updateTipCorrectness(gameId);
    
    res.json({
      success: true,
      message: 'Tip correctness updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating tip correctness:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tip correctness',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/tips/finals-config/:roundNumber
 * Get finals configuration for a round
 */
router.get('/finals-config/:roundNumber', async (req, res) => {
  try {
    await initializeServices();
    
    const roundNumber = parseInt(req.params.roundNumber);
    const config = await tipsService.getFinalsConfig(roundNumber);
    
    res.json({
      success: true,
      data: config
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching finals config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch finals config',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/tips/margin-game/:gameId/:roundNumber
 * Check if a game requires margin prediction
 */
router.get('/margin-game/:gameId/:roundNumber', async (req, res) => {
  try {
    await initializeServices();
    
    const gameId = parseInt(req.params.gameId);
    const roundNumber = parseInt(req.params.roundNumber);
    const isMargin = await tipsService.isMarginGame(gameId, roundNumber);
    
    res.json({
      success: true,
      data: { is_margin_game: isMargin }
    } as ApiResponse);

  } catch (error) {
    console.error('Error checking margin game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check margin game',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * POST /api/tips/game/:gameId/update-margins
 * Update margin predictions after game completion
 */
router.post('/game/:gameId/update-margins', async (req, res) => {
  try {
    await initializeServices();
    
    const gameId = parseInt(req.params.gameId);
    await tipsService.updateMarginPredictions(gameId);
    
    res.json({
      success: true,
      message: 'Margin predictions updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating margin predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update margin predictions',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * POST /api/tips/round/:roundId/calculate-margin-winner
 * Calculate round winner based on margin predictions
 */
router.post('/round/:roundId/calculate-margin-winner', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.roundId);
    const result = await tipsService.calculateMarginRoundWinner(roundId);
    
    res.json({
      success: true,
      data: result,
      message: result ? `Found ${result.winners.length} margin winner(s)` : 'No margin winners found'
    } as ApiResponse);

  } catch (error) {
    console.error('Error calculating margin winner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate margin winner',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/tips/round/:roundId/winners
 * Get round winners for a specific round
 */
router.get('/round/:roundId/winners', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.roundId);
    const winners = await tipsService.getRoundWinners(roundId);
    
    res.json({
      success: true,
      data: winners,
      count: winners.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching round winners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch round winners',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;