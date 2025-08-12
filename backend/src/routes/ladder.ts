import { Router } from 'express';
import Database from '../db/database';
import LadderService from '../services/LadderService';
import { ApiResponse } from '../types/api';

const router = Router();

// Initialize services
let db: Database;
let ladderService: LadderService;

const initializeServices = async () => {
  if (!db) {
    db = new Database();
    await db.connect();
    ladderService = new LadderService(db);
  }
};

/**
 * GET /api/ladder/:year
 * Get current ladder for a specific year
 */
router.get('/:year', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const ladder = await ladderService.getLadder(year);
    
    res.json({
      success: true,
      data: ladder
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching ladder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ladder',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/ladder/:year/user/:userId
 * Get ladder position for a specific user
 */
router.get('/:year/user/:userId', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const userId = parseInt(req.params.userId);
    
    const position = await ladderService.getUserLadderPosition(userId, year);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'User ladder position not found',
        message: 'User has no tips recorded for this year'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: position
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user ladder position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user ladder position',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/ladder/:year/family-groups
 * Get family group standings
 */
router.get('/:year/family-groups', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const standings = await ladderService.getFamilyGroupStandings(year);
    
    res.json({
      success: true,
      data: standings,
      count: standings.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching family group standings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch family group standings',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/ladder/:year/head-to-head/:user1Id/:user2Id
 * Get head-to-head comparison between two users
 */
router.get('/:year/head-to-head/:user1Id/:user2Id', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const user1Id = parseInt(req.params.user1Id);
    const user2Id = parseInt(req.params.user2Id);
    
    const comparison = await ladderService.getHeadToHeadComparison(user1Id, user2Id, year);
    
    res.json({
      success: true,
      data: comparison
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching head-to-head comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch head-to-head comparison',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/ladder/:year/user/:userId/performance
 * Get round-by-round performance for a user
 */
router.get('/:year/user/:userId/performance', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const userId = parseInt(req.params.userId);
    
    const performance = await ladderService.getUserRoundByRoundPerformance(userId, year);
    
    res.json({
      success: true,
      data: performance,
      count: performance.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/ladder/:year/user/:userId/streaks
 * Get streak information for a user
 */
router.get('/:year/user/:userId/streaks', async (req, res) => {
  try {
    await initializeServices();
    
    const year = parseInt(req.params.year);
    const userId = parseInt(req.params.userId);
    
    const streaks = await ladderService.getUserStreakInfo(userId, year);
    
    res.json({
      success: true,
      data: streaks
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user streaks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user streaks',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/ladder/round/:roundId/popularity
 * Get tip popularity for a specific round
 */
router.get('/round/:roundId/popularity', async (req, res) => {
  try {
    await initializeServices();
    
    const roundId = parseInt(req.params.roundId);
    const popularity = await ladderService.getRoundTipPopularity(roundId);
    
    res.json({
      success: true,
      data: popularity,
      count: popularity.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching tip popularity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tip popularity',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;