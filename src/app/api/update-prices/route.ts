/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - API LAYER: /api/update-prices
 * Scans active catalog and enqueues HIGH priority price re-verification tasks
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enqueueScrapingJob } from '@/lib/scraper-engine/queue';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('Authorization')?.replace('Bearer ', '');

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 1. Retrieve active products
    const { data: products, error } = await supabase
      .from('products')
      .select('source_url')
      .eq('is_active', true);

    if (error) throw error;
    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No active products found to revalidate." });
    }

    // 2. Schedule each product with HIGH priority
    let enqueuedCount = 0;
    for (const prod of products) {
      if (prod.source_url) {
        await enqueueScrapingJob(prod.source_url, 'HIGH', true); // Force bypassCache to update prices
        enqueuedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: enqueuedCount,
      message: `Successfully scheduled ${enqueuedCount} products for HIGH priority price updates.`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
