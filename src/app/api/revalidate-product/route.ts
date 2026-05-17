/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - API LAYER: /api/revalidate-product
 * Instantly revalidates and refreshes a single product's pricing details on-demand (Synchronous)
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraperEngine } from '@/lib/scraper-engine';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const productId = body.productId || searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: "Missing required 'productId' parameter." }, { status: 400 });
    }

    // 1. Fetch product source URL
    const { data: product, error } = await supabase
      .from('products')
      .select('source_url')
      .eq('id', productId)
      .single();

    if (error || !product || !product.source_url) {
      return NextResponse.json({ error: "Product not found or missing source URL." }, { status: 404 });
    }

    // 2. Execute scraping pipeline synchronously
    console.log(`[RevalidateAPI] Synchronous product refresh triggered for ID: ${productId}`);
    const result = await runScraperEngine(product.source_url, true); // Force bypassCache

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Synchronous revalidation failed."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Product revalidated and synchronized successfully.",
      product: result.product,
      pipeline: result.pipelinePath,
      confidence: result.confidenceScore
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
