import { Router } from 'express';
import Database from '../db/database';

const router = Router();

// Initialize database connection
let db: Database;

const initializeServices = async () => {
  if (!db) {
    db = new Database();
    await db.connect();
  }
};

/**
 * GET /api/logs/sync
 * Get sync operation logs
 */
router.get('/sync', async (req, res) => {
  try {
    await initializeServices();
    
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;
    
    let query = `
      SELECT * FROM import_logs 
      WHERE import_type IN ('squiggle', 'teams', 'scheduler_live-scores', 'scheduler_full-sync', 'scheduler_round-status', 'scheduler_tip-correctness')
    `;
    
    const params: any[] = [];
    
    if (type) {
      query += ` AND import_type = ?`;
      params.push(type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const logs = await db.all(query, params);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });

  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/logs/sync/summary
 * Get sync summary statistics
 */
router.get('/sync/summary', async (req, res) => {
  try {
    await initializeServices();
    
    // Get latest sync for each type
    const latestSyncs = await db.all(`
      SELECT 
        import_type,
        status,
        records_processed,
        created_at,
        error_message
      FROM import_logs il1
      WHERE created_at = (
        SELECT MAX(created_at) 
        FROM import_logs il2 
        WHERE il2.import_type = il1.import_type
      )
      AND import_type IN ('squiggle', 'teams', 'scheduler_live-scores', 'scheduler_full-sync', 'scheduler_round-status', 'scheduler_tip-correctness')
      ORDER BY created_at DESC
    `);
    
    // Get counts for last 24 hours
    const last24h = await db.all(`
      SELECT 
        import_type,
        status,
        COUNT(*) as count,
        SUM(records_processed) as total_records
      FROM import_logs 
      WHERE created_at >= datetime('now', '-24 hours')
        AND import_type IN ('squiggle', 'teams', 'scheduler_live-scores', 'scheduler_full-sync', 'scheduler_round-status', 'scheduler_tip-correctness')
      GROUP BY import_type, status
      ORDER BY import_type, status
    `);
    
    // Get overall statistics
    const totalStats = await db.get(`
      SELECT 
        COUNT(*) as total_operations,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_operations,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_operations,
        MAX(created_at) as last_operation
      FROM import_logs 
      WHERE import_type IN ('squiggle', 'teams', 'scheduler_live-scores', 'scheduler_full-sync', 'scheduler_round-status', 'scheduler_tip-correctness')
    `);
    
    res.json({
      success: true,
      data: {
        latestSyncs,
        last24h,
        totalStats
      }
    });

  } catch (error) {
    console.error('Error fetching sync summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/logs/sync/squiggle
 * Get latest Squiggle API sync status
 */
router.get('/sync/squiggle', async (req, res) => {
  try {
    await initializeServices();
    
    const latestSquiggleSync = await db.get(`
      SELECT * FROM import_logs 
      WHERE import_type = 'squiggle'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const latestTeamsSync = await db.get(`
      SELECT * FROM import_logs 
      WHERE import_type = 'teams'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    // Get recent Squiggle API activity (last 10 operations)
    const recentActivity = await db.all(`
      SELECT * FROM import_logs 
      WHERE import_type IN ('squiggle', 'teams')
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        latestSquiggleSync,
        latestTeamsSync,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Error fetching Squiggle sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Squiggle sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;