import * as cron from 'node-cron';
import Database from '../db/database';
import SquiggleService from './SquiggleService';
import TipsService from './TipsService';

export interface SchedulerJob {
  id: string;
  name: string;
  cronPattern: string;
  description: string;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastError?: string;
  runCount: number;
}

export class SchedulerService {
  private db: Database;
  private squiggleService: SquiggleService;
  private tipsService: TipsService;
  private jobs: Map<string, { task: cron.ScheduledTask; info: SchedulerJob }> = new Map();
  private isEnabled: boolean;

  constructor(database: Database, squiggleService: SquiggleService, tipsService: TipsService) {
    this.db = database;
    this.squiggleService = squiggleService;
    this.tipsService = tipsService;
    this.isEnabled = process.env.SCHEDULER_ENABLED === 'true';
  }

  /**
   * Initialize and start all scheduled jobs
   */
  async start(): Promise<void> {
    if (!this.isEnabled) {
      console.log('📅 Scheduler is disabled via SCHEDULER_ENABLED=false');
      return;
    }

    console.log('📅 Starting Cooksey Plate Scheduler...');
    
    // Create scheduled jobs
    this.createLiveScoreUpdateJob();
    this.createFullDataSyncJob();
    this.createRoundStatusUpdateJob();
    this.createTipCorrectnessJob();
    
    console.log(`✅ Scheduler started with ${this.jobs.size} jobs`);
    this.logJobSummary();
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log('🛑 Stopping all scheduled jobs...');
    
    for (const [jobId, { task }] of this.jobs.entries()) {
      task.stop();
      console.log(`  - Stopped job: ${jobId}`);
    }
    
    this.jobs.clear();
    console.log('✅ All scheduler jobs stopped');
  }

  /**
   * Create live score update job - runs every 30 minutes during AFL season
   */
  private createLiveScoreUpdateJob(): void {
    const jobId = 'live-scores';
    const cronPattern = '*/30 * * * *'; // Every 30 minutes
    
    const task = cron.schedule(cronPattern, async () => {
      await this.executeJob(jobId, async () => {
        const currentYear = new Date().getFullYear();
        await this.squiggleService.updateLiveScores(currentYear);
      });
    });

    const jobInfo: SchedulerJob = {
      id: jobId,
      name: 'Live Score Updates',
      cronPattern,
      description: 'Updates live scores and game completion status every 30 minutes during AFL season',
      isRunning: false,
      runCount: 0
    };

    this.jobs.set(jobId, { task, info: jobInfo });
    
    // Only run during AFL season (March to September)
    if (this.isAFLSeason()) {
      task.start();
      jobInfo.isRunning = true;
      console.log(`📊 Started job: ${jobInfo.name} (${cronPattern})`);
    } else {
      console.log(`⏸️  Job paused (off-season): ${jobInfo.name}`);
    }
  }

  /**
   * Create full data sync job - runs twice daily
   */
  private createFullDataSyncJob(): void {
    const jobId = 'full-sync';
    const cronPattern = '0 6,18 * * *'; // At 6 AM and 6 PM daily
    
    const task = cron.schedule(cronPattern, async () => {
      await this.executeJob(jobId, async () => {
        const currentYear = new Date().getFullYear();
        
        // Update games and teams
        await this.squiggleService.updateGamesForYear(currentYear);
        await this.squiggleService.updateTeams();
        
        // Update round statuses
        await this.tipsService.updateAllRoundStatuses(currentYear);
      });
    });

    const jobInfo: SchedulerJob = {
      id: jobId,
      name: 'Full Data Sync',
      cronPattern,
      description: 'Syncs all game data, teams, and round statuses twice daily (6 AM & 6 PM)',
      isRunning: false,
      runCount: 0
    };

    this.jobs.set(jobId, { task, info: jobInfo });
    task.start();
    jobInfo.isRunning = true;
    console.log(`🔄 Started job: ${jobInfo.name} (${cronPattern})`);
  }

  /**
   * Create round status update job - runs every 15 minutes
   */
  private createRoundStatusUpdateJob(): void {
    const jobId = 'round-status';
    const cronPattern = '0 */2 * * *'; // Every 2 hours
    
    const task = cron.schedule(cronPattern, async () => {
      await this.executeJob(jobId, async () => {
        const currentYear = new Date().getFullYear();
        await this.tipsService.updateAllRoundStatuses(currentYear);
      });
    });

    const jobInfo: SchedulerJob = {
      id: jobId,
      name: 'Round Status Updates',
      cronPattern,
      description: 'Updates round statuses (upcoming/active/completed) every 2 hours',
      isRunning: false,
      runCount: 0
    };

    this.jobs.set(jobId, { task, info: jobInfo });
    task.start();
    jobInfo.isRunning = true;
    console.log(`⏰ Started job: ${jobInfo.name} (${cronPattern})`);
  }

  /**
   * Create tip correctness calculation job - runs every hour during AFL season
   */
  private createTipCorrectnessJob(): void {
    const jobId = 'tip-correctness';
    const cronPattern = '15 * * * *'; // Every hour at 15 minutes past
    
    const task = cron.schedule(cronPattern, async () => {
      await this.executeJob(jobId, async () => {
        // Calculate tip correctness for completed games
        await this.calculateTipCorrectness();
        
        // Update margin predictions for completed finals games
        await this.updateMarginPredictions();
      });
    });

    const jobInfo: SchedulerJob = {
      id: jobId,
      name: 'Tip Correctness Calculation',
      cronPattern,
      description: 'Calculates tip correctness and margin predictions hourly during AFL season',
      isRunning: false,
      runCount: 0
    };

    this.jobs.set(jobId, { task, info: jobInfo });
    
    // Only run during AFL season
    if (this.isAFLSeason()) {
      task.start();
      jobInfo.isRunning = true;
      console.log(`🎯 Started job: ${jobInfo.name} (${cronPattern})`);
    } else {
      console.log(`⏸️  Job paused (off-season): ${jobInfo.name}`);
    }
  }

  /**
   * Execute a job with error handling and logging
   */
  private async executeJob(jobId: string, jobFunction: () => Promise<void>): Promise<void> {
    const jobEntry = this.jobs.get(jobId);
    if (!jobEntry) return;

    const { info } = jobEntry;
    const startTime = new Date();
    
    try {
      console.log(`🔄 Running job: ${info.name}`);
      await jobFunction();
      
      // Update job info
      info.lastRun = startTime;
      info.nextRun = this.calculateNextRun(info.cronPattern);
      info.runCount++;
      info.lastError = undefined;
      
      console.log(`✅ Completed job: ${info.name} (run #${info.runCount})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      info.lastError = errorMessage;
      console.error(`❌ Job failed: ${info.name} - ${errorMessage}`);
      
      // Log error to database
      await this.logJobError(jobId, errorMessage);
    }
  }

  /**
   * Calculate tip correctness for completed games
   */
  private async calculateTipCorrectness(): Promise<void> {
    const completedGames = await this.db.all(`
      SELECT DISTINCT sg.squiggle_game_key, sg.winner
      FROM squiggle_games sg
      LEFT JOIN tips t ON sg.squiggle_game_key = t.squiggle_game_key
      WHERE sg.complete = 100 
        AND sg.winner IS NOT NULL 
        AND t.is_correct IS NULL
    `);

    for (const game of completedGames) {
      await this.db.run(`
        UPDATE tips 
        SET is_correct = CASE 
          WHEN selected_team = ? THEN 1 
          ELSE 0 
        END
        WHERE squiggle_game_key = ? AND is_correct IS NULL
      `, [game.winner, game.squiggle_game_key]);
    }

    if (completedGames.length > 0) {
      console.log(`🎯 Updated tip correctness for ${completedGames.length} completed games`);
    }
  }

  /**
   * Update margin predictions for completed finals games
   */
  private async updateMarginPredictions(): Promise<void> {
    const completedFinalsGames = await this.db.all(`
      SELECT g.id, sg.squiggle_game_key, ABS(sg.hscore - sg.ascore) as actual_margin
      FROM games g
      LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key
      LEFT JOIN tips t ON g.id = t.game_id AND t.is_margin_game = 1
      WHERE sg.complete = 100 
        AND t.margin_prediction IS NOT NULL 
        AND t.margin_difference IS NULL
    `);

    for (const game of completedFinalsGames) {
      await this.tipsService.updateMarginPredictions(game.id);
    }

    if (completedFinalsGames.length > 0) {
      console.log(`📏 Updated margin predictions for ${completedFinalsGames.length} finals games`);
    }
  }

  /**
   * Manual trigger for any job
   */
  async triggerJob(jobId: string): Promise<boolean> {
    const jobEntry = this.jobs.get(jobId);
    if (!jobEntry) {
      throw new Error(`Job not found: ${jobId}`);
    }

    console.log(`🔄 Manual trigger for job: ${jobEntry.info.name}`);
    
    switch (jobId) {
      case 'live-scores':
        await this.executeJob(jobId, async () => {
          const currentYear = new Date().getFullYear();
          await this.squiggleService.updateLiveScores(currentYear);
        });
        break;
        
      case 'full-sync':
        await this.executeJob(jobId, async () => {
          const currentYear = new Date().getFullYear();
          await this.squiggleService.updateGamesForYear(currentYear);
          await this.squiggleService.updateTeams();
          await this.tipsService.updateAllRoundStatuses(currentYear);
        });
        break;
        
      case 'round-status':
        await this.executeJob(jobId, async () => {
          const currentYear = new Date().getFullYear();
          await this.tipsService.updateAllRoundStatuses(currentYear);
        });
        break;
        
      case 'tip-correctness':
        await this.executeJob(jobId, async () => {
          await this.calculateTipCorrectness();
          await this.updateMarginPredictions();
        });
        break;
        
      default:
        throw new Error(`Unknown job: ${jobId}`);
    }

    return true;
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus(): SchedulerJob[] {
    return Array.from(this.jobs.values()).map(({ info }) => ({
      ...info,
      nextRun: this.calculateNextRun(info.cronPattern)
    }));
  }

  /**
   * Check if it's currently AFL season
   */
  private isAFLSeason(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    return month >= 3 && month <= 9; // March to September
  }

  /**
   * Calculate next run time for a cron pattern
   */
  private calculateNextRun(cronPattern: string): Date {
    // Simple approximation - in production would use proper cron parser
    const now = new Date();
    const nextRun = new Date(now);
    
    if (cronPattern.includes('*/5')) {
      // Every 5 minutes
      const minutes = Math.ceil(now.getMinutes() / 5) * 5;
      nextRun.setMinutes(minutes, 0, 0);
      if (minutes >= 60) {
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(0);
      }
    } else if (cronPattern.includes('*/10')) {
      // Every 10 minutes
      const minutes = Math.ceil(now.getMinutes() / 10) * 10;
      nextRun.setMinutes(minutes, 0, 0);
      if (minutes >= 60) {
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(0);
      }
    } else if (cronPattern.includes('*/15')) {
      // Every 15 minutes
      const minutes = Math.ceil(now.getMinutes() / 15) * 15;
      nextRun.setMinutes(minutes, 0, 0);
      if (minutes >= 60) {
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(0);
      }
    } else if (cronPattern.startsWith('0 *')) {
      // Every hour
      nextRun.setHours(nextRun.getHours() + 1);
      nextRun.setMinutes(0, 0, 0);
    }
    
    return nextRun;
  }

  /**
   * Log job error to database
   */
  private async logJobError(jobId: string, errorMessage: string): Promise<void> {
    try {
      await this.db.run(`
        INSERT INTO import_logs (import_type, status, records_processed, error_message, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [`scheduler_${jobId}`, 'error', 0, errorMessage]);
    } catch (error) {
      console.error('Failed to log scheduler error to database:', error);
    }
  }

  /**
   * Log job summary
   */
  private logJobSummary(): void {
    console.log('\n📋 Scheduled Jobs Summary:');
    for (const { info } of this.jobs.values()) {
      const status = info.isRunning ? '🟢 Running' : '🔴 Stopped';
      console.log(`  ${status} ${info.name} (${info.cronPattern}) - ${info.description}`);
    }
    console.log(`\n📅 AFL Season: ${this.isAFLSeason() ? '🏈 Active' : '⏸️  Off-season'}`);
    console.log('');
  }

  /**
   * Enable/disable scheduler
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { enabled: boolean; jobCount: number; aflSeason: boolean } {
    return {
      enabled: this.isEnabled,
      jobCount: this.jobs.size,
      aflSeason: this.isAFLSeason()
    };
  }
}

export default SchedulerService;