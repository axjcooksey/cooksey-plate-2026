import { Router } from 'express';
import Database from '../db/database';
import UserService from '../services/UserService';
import { ApiResponse } from '../types/api';

const router = Router();

// Initialize services
let db: Database;
let userService: UserService;

const initializeServices = async () => {
  if (!db) {
    db = new Database();
    await db.connect();
    userService = new UserService(db);
  }
};

/**
 * GET /api/family-groups
 * Get all family groups with member counts
 */
router.get('/', async (req, res) => {
  try {
    await initializeServices();
    
    const familyGroups = await userService.getAllFamilyGroups();
    
    res.json({
      success: true,
      data: familyGroups,
      count: familyGroups.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching family groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch family groups',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/family-groups/:id
 * Get family group by ID with members
 */
router.get('/:id', async (req, res) => {
  try {
    await initializeServices();
    
    const groupId = parseInt(req.params.id);
    const familyGroup = await userService.getFamilyGroupById(groupId);
    
    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        error: 'Family group not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: familyGroup
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching family group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch family group',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;