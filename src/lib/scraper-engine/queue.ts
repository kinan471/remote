/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - BULLMQ PRIORITY QUEUE SYSTEM
 * Serverless-safe task scheduler with priority mapping and fallback buffers
 */

import { ScraperPriority } from '@/types/scraper-engine';
import { runScraperEngine } from './index';

// Simple in-memory fallback queue for serverless environments (like Vercel) where Redis is unavailable
const MEMORY_QUEUE: Array<{ url: string; priority: ScraperPriority; bypassCache: boolean }> = [];
let isProcessingMemoryQueue = false;

/**
 * Enterprise Queue Task Enqueuer
 */
export async function enqueueScrapingJob(
  url: string,
  priority: ScraperPriority = 'MEDIUM',
  bypassCache = false
): Promise<{ success: boolean; jobId?: string; message: string }> {
  console.log(`[QueueSystem] Enqueueing request for: ${url} (Priority: ${priority})`);

  // Define BullMQ numerical priority bands (lower is higher priority in BullMQ)
  const priorityMap: Record<ScraperPriority, number> = {
    'HIGH': 1,
    'MEDIUM': 2,
    'LOW': 3
  };

  try {
    const bullmqLib = 'bullmq';
    const { Queue } = require(bullmqLib);
    const { ENGINE_CONFIG } = require('./config');
    
    // Dynamic initialization to prevent compile errors in Vercel build phases
    const connection = ENGINE_CONFIG.redis.url 
      ? { url: ENGINE_CONFIG.redis.url } 
      : {
          host: ENGINE_CONFIG.redis.host,
          port: ENGINE_CONFIG.redis.port,
          password: ENGINE_CONFIG.redis.password
        };

    const scrapeQueue = new Queue('yakala-scraper-v2', { connection });

    const job = await scrapeQueue.add(
      'extract-job',
      { url, bypassCache },
      {
        priority: priorityMap[priority],
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    return {
      success: true,
      jobId: job.id,
      message: `Successfully scheduled job via Redis BullMQ Queue. Job ID: ${job.id}`
    };

  } catch {
    // 2. Serverless Graceful Fallback: Queue job in memory and trigger asynchronous runner
    console.warn(`[QueueSystem] Redis/BullMQ unavailable in this hosting context. Switching to Serverless-Safe In-Memory Queue.`);
    
    // Check for duplicates in memory queue
    const exists = MEMORY_QUEUE.some(q => q.url === url);
    if (!exists) {
      MEMORY_QUEUE.push({ url, priority, bypassCache });
      
      // Sort memory queue by priority dynamically (HIGH first)
      MEMORY_QUEUE.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
    }

    // Trigger processing loop asynchronously
    triggerMemoryQueueProcessor();

    return {
      success: true,
      jobId: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      message: "Scheduled task via Serverless-Safe In-Memory Queue."
    };
  }
}

/**
 * Handles sequential in-memory task processing for serverless environments
 */
async function triggerMemoryQueueProcessor() {
  if (isProcessingMemoryQueue || MEMORY_QUEUE.length === 0) return;
  isProcessingMemoryQueue = true;

  console.log(`[QueueSystem] [In-Memory] Starting execution loop. Jobs remaining: ${MEMORY_QUEUE.length}`);

  // Process jobs one by one to avoid CPU spikes and rate limits
  (async () => {
    while (MEMORY_QUEUE.length > 0) {
      const task = MEMORY_QUEUE.shift();
      if (!task) continue;

      try {
        console.log(`[QueueSystem] [In-Memory] Processing active task: ${task.url}`);
        await runScraperEngine(task.url, task.bypassCache);
      } catch (err: any) {
        console.error(`[QueueSystem] [In-Memory] Task execution failed:`, err.message);
      }
      
      // Artificial delay between jobs to evade target anti-bots
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    isProcessingMemoryQueue = false;
    console.log(`[QueueSystem] [In-Memory] Execution loop completed. Queue is clean.`);
  })();
}
export function getMemoryQueueLength() {
  return MEMORY_QUEUE.length;
}
