import { Router } from 'express';

const router = Router();

// Get scheduler from global scope (set in index.ts)
const getScheduler = () => {
  const scheduler = (global as any).schedulerService;
  if (!scheduler) {
    throw new Error('Scheduler service not initialized');
  }
  return scheduler;
};

/**
 * GET /api/scheduler/status
 * Get overall scheduler status
 */
router.get('/status', async (req, res) => {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();
    
    res.json({
      success: true,
      data: status,
      message: status.enabled ? 'Scheduler is running' : 'Scheduler is disabled'
    });

  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/scheduler/jobs
 * Get status of all scheduled jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const scheduler = getScheduler();
    const jobs = scheduler.getJobsStatus();
    
    res.json({
      success: true,
      data: jobs,
      count: jobs.length,
      message: `Found ${jobs.length} scheduled jobs`
    });

  } catch (error) {
    console.error('Error fetching scheduler jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scheduler/trigger/:jobId
 * Manually trigger a specific job
 */
router.post('/trigger/:jobId', async (req, res) => {
  try {
    const scheduler = getScheduler();
    const jobId = req.params.jobId;
    
    const success = await scheduler.triggerJob(jobId);
    
    res.json({
      success: true,
      data: { jobId, triggered: success },
      message: `Job ${jobId} triggered successfully`
    });

  } catch (error) {
    console.error('Error triggering job:', error);
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Failed to trigger job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scheduler/enable
 * Enable the scheduler
 */
router.post('/enable', async (req, res) => {
  try {
    const scheduler = getScheduler();
    scheduler.setEnabled(true);
    
    res.json({
      success: true,
      message: 'Scheduler enabled successfully'
    });

  } catch (error) {
    console.error('Error enabling scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable scheduler',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scheduler/disable
 * Disable the scheduler
 */
router.post('/disable', async (req, res) => {
  try {
    const scheduler = getScheduler();
    scheduler.setEnabled(false);
    
    res.json({
      success: true,
      message: 'Scheduler disabled successfully'
    });

  } catch (error) {
    console.error('Error disabling scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable scheduler',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scheduler/sync-all
 * Trigger all sync jobs manually (for admin use)
 */
router.post('/sync-all', async (req, res) => {
  try {
    const scheduler = getScheduler();
    
    // Trigger all jobs in sequence
    const jobs = ['full-sync', 'round-status', 'tip-correctness'];
    const results = [];
    
    for (const jobId of jobs) {
      try {
        await scheduler.triggerJob(jobId);
        results.push({ jobId, status: 'success' });
      } catch (error) {
        results.push({ 
          jobId, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    
    res.json({
      success: true,
      data: results,
      message: `Sync completed: ${successCount}/${results.length} jobs successful`
    });

  } catch (error) {
    console.error('Error running full sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run full sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;