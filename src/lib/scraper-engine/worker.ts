/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - BULLMQ WORKER ENGINE
 * Robust queue consumer with exponential backoff handling and analytics
 */

import { runScraperEngine } from './index';

/**
 * Initializes the BullMQ Scraper Queue Worker
 */
export function startScraperWorker(): any {
  console.log("[WorkerEngine] Loading V2 Worker dependencies...");

  try {
    const bullmqLib = 'bullmq';
    const { Worker } = require(bullmqLib);
    const { ENGINE_CONFIG } = require('./config');

    const connection = ENGINE_CONFIG.redis.url 
      ? { url: ENGINE_CONFIG.redis.url } 
      : {
          host: ENGINE_CONFIG.redis.host,
          port: ENGINE_CONFIG.redis.port,
          password: ENGINE_CONFIG.redis.password
        };

    const worker = new Worker(
      'yakala-scraper-v2',
      async (job: any) => {
        const { url, bypassCache } = job.data;
        console.log(`[WorkerEngine] Processing Job ID: ${job.id} for: ${url}`);
        
        const result = await runScraperEngine(url, bypassCache);
        
        if (!result.success) {
          throw new Error(result.error || "Scraping failed inside dynamic worker extraction pool.");
        }
        
        return result;
      },
      {
        connection,
        concurrency: 3, // Safe concurrent threads
        limiter: {
          max: 10,
          duration: 10000 // Limit to max 10 jobs per 10 seconds to keep scraping extremely clean
        }
      }
    );

    worker.on('completed', (job: any) => {
      console.log(`[WorkerEngine] [COMPLETED] Job ID: ${job.id} succeeded.`);
    });

    worker.on('failed', (job: any, err: any) => {
      console.error(`[WorkerEngine] [FAILED] Job ID: ${job?.id} failed with error:`, err.message);
    });

    console.log("[WorkerEngine] BullMQ Scraping Worker successfully loaded and listening to Redis...");
    return worker;

  } catch {
    console.warn("[WorkerEngine] Redis/BullMQ is not enabled or available in this runtime context. Standard Worker listening bypassed.");
    return null;
  }
}
