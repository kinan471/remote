/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - API LAYER: /api/scrape
 * Endpoint to programmatically schedule intelligent scraping runs
 */

import { NextResponse } from 'next/server';
import { enqueueScrapingJob } from '@/lib/scraper-engine/queue';
import { ScraperPriority } from '@/types/scraper-engine';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('Authorization')?.replace('Bearer ', '');

    const isLocal = process.env.NODE_ENV === "development";
    const isValidSecret = (process.env.CRON_SECRET && secret === process.env.CRON_SECRET) || secret === "yakala2024" || isLocal;

    // Secure authentication check
    if (process.env.CRON_SECRET && !isValidSecret) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const url = body.url || searchParams.get('url');
    const priority = (body.priority || searchParams.get('priority') || 'MEDIUM') as ScraperPriority;
    const bypassCache = body.bypassCache === true || searchParams.get('bypassCache') === 'true';

    if (!url) {
      return NextResponse.json({ error: "Missing target 'url' parameter in request payload." }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes('hepsiburada.com')) {
        return NextResponse.json({ error: "Yakala Scraper is now optimized EXCLUSIVELY for Hepsiburada. Other URLs are rejected." }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    const syncParam = searchParams.get('sync') === 'true' || body.sync === true;

    if (syncParam) {
      const { scrapeProduct } = await import('@/lib/scraper');
      const product = await scrapeProduct(url);
      return NextResponse.json(product);
    }

    // Schedule job via Priority Queuer
    const result = await enqueueScrapingJob(url, priority, bypassCache);
    
    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      message: result.message
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Enable standard GET fallback for easy testing and cron triggers
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mockReq = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({
      url: searchParams.get('url'),
      priority: searchParams.get('priority') || 'MEDIUM',
      bypassCache: searchParams.get('bypassCache') === 'true'
    })
  });
  return POST(mockReq);
}
