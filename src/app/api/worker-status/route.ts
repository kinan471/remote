/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - API LAYER: /api/worker-status
 * Scraper monitoring dashboard API returning queue sizes, success metrics, and audit logs
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMemoryQueueLength } from '@/lib/scraper-engine/queue';

export async function GET(req: Request) {
  try {
    // 1. Fetch latest audit logs from scraping_logs
    const { data: logs, error } = await supabase
      .from('scraping_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    // Gracefully handle if v2 audit logs table does not exist yet
    const logsList = error ? [] : (logs || []);

    // 2. Compute aggregate analytics
    const totalRuns = logsList.length;
    const successRuns = logsList.filter((l: any) => l.success).length;
    const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 100;
    
    const avgDuration = totalRuns > 0 
      ? logsList.reduce((acc: number, cur: any) => acc + (cur.duration_ms || 0), 0) / totalRuns 
      : 0;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      queue: {
        inMemoryPendingCount: getMemoryQueueLength(),
        redisActive: false, // Set dynamically if Redis connection is bound
        message: "Serverless-Safe in-memory fallback active."
      },
      analytics: {
        sampleSize: totalRuns,
        crawlerSuccessRate: `${successRate.toFixed(1)}%`,
        averageDurationMs: `${avgDuration.toFixed(0)}ms`
      },
      latestLogs: logsList
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
