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
 * GET /api/users
 * Get all users with family group information
 */
router.get('/', async (req, res) => {
  try {
    await initializeServices();
    
    const users = await userService.getAllUsers();
    
    res.json({
      success: true,
      data: users,
      count: users.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    await initializeServices();
    
    const userId = parseInt(req.params.id);
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: user
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/users/name/:name
 * Get user by name
 */
router.get('/name/:name', async (req, res) => {
  try {
    await initializeServices();
    
    const name = req.params.name;
    const user = await userService.getUserByName(name);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: user
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user by name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/users/:id/can-tip-for
 * Get users that a specific user can tip for
 */
router.get('/:id/can-tip-for', async (req, res) => {
  try {
    await initializeServices();
    
    const userId = parseInt(req.params.id);
    const users = await userService.getUsersCanTipFor(userId);
    
    res.json({
      success: true,
      data: users,
      count: users.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching users can tip for:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tippable users',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    await initializeServices();
    
    const userId = parseInt(req.params.id);
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const stats = await userService.getUserStats(userId, year);
    
    res.json({
      success: true,
      data: stats
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    await initializeServices();
    
    const { name, family_group_id, email, role } = req.body;
    
    if (!name || !family_group_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and family_group_id'
      } as ApiResponse);
    }
    
    const newUser = await userService.createUser(name, family_group_id, email, role);
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', async (req, res) => {
  try {
    await initializeServices();
    
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedUser = await userService.updateUser(userId, updates);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;