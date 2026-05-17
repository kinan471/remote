/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - DATABASE INTEGRITY PANEL
 * Handles cryptographic cache hashing, price history tracking, and scraping audit logging
 */

import { supabase } from '@/lib/supabase';
import { PlatformType, ScrapedProduct, ScrapingLogEntry } from '@/types/scraper-engine';

/**
 * Calculates a cryptographic MD5 content hash for cache matching
 */
export function generateContentHash(html: string): string {
  if (!html) return '';
  const cryptoNode = require('crypto');
  return cryptoNode.createHash('md5').update(html).digest('hex');
}

/**
 * Cache Intelligence: Checks if page structure is identical to skip redundant scraping runs
 */
export async function isPageUnchanged(url: string, newHash: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('page_hashes')
      .select('content_hash')
      .eq('url', url)
      .single();

    if (error || !data) return false;
    
    // Returns true if content hash matches perfectly (structure is identical)
    return data.content_hash === newHash;
  } catch {
    return false;
  }
}

/**
 * Updates cache hash entry in database
 */
export async function updatePageHash(url: string, contentHash: string) {
  try {
    await supabase
      .from('page_hashes')
      .upsert({
        url,
        content_hash: contentHash,
        last_scraped_at: new Date().toISOString()
      });
  } catch {
    // Fail silently
  }
}

/**
 * Price History Tracker: Saves product pricing over time
 */
export async function logPriceHistory(productId: string, price: number, originalPrice: number) {
  try {
    await supabase
      .from('product_prices')
      .insert([{
        product_id: productId,
        price,
        original_price: originalPrice,
        scraped_at: new Date().toISOString()
      }]);
  } catch {
    // Fail silently to keep application robust
  }
}

/**
 * System Auditor: Writes crawling execution logs to scraping_logs table
 */
export async function logScrapingExecution(entry: ScrapingLogEntry) {
  try {
    await supabase
      .from('scraping_logs')
      .insert([{
        url: entry.url,
        platform: entry.platform,
        pipeline_path: entry.pipeline_path,
        success: entry.success,
        error_message: entry.error_message || null,
        confidence_score: entry.confidence_score,
        duration_ms: entry.duration_ms,
        created_at: new Date().toISOString()
      }]);
    
    console.log(`[Auditor] Logged scraping run: ${entry.url} - Success: ${entry.success} (${entry.duration_ms}ms)`);
  } catch (err: any) {
    console.error("[Auditor] Logging error:", err.message);
  }
}

/**
 * Persistence Handler: Saves or updates validated products, ensuring fingerprint integrity
 */
export async function persistScrapedProduct(product: ScrapedProduct, confidenceScore: number): Promise<boolean> {
  try {
    // Dynamic fingerprinting based on title and category
    const cleanTitle = product.title.trim();
    const fingerprint = btoa(`${cleanTitle}-${product.category || 'Genel'}`).substring(0, 50);

    // Get historical price for anomaly comparison
    const { data: existing } = await supabase
      .from('products')
      .select('id, current_price')
      .eq('fingerprint', fingerprint)
      .single();

    // Clean payload for active base columns (remove review_count as it's not present in user's products table)
    const { review_count, ...productToInsert } = product as any;

    const upsertPayload = {
      ...productToInsert,
      fingerprint,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .upsert([upsertPayload], { onConflict: 'fingerprint' })
      .select('id')
      .single();

    if (error) {
      console.error("[Persist] Upsert error:", error.message);
      return false;
    }

    const productId = data?.id || existing?.id;

    if (productId) {
      // Log price history point
      await logPriceHistory(productId, product.current_price, product.original_price);
      
      // Auto price alert trigger: check if price dropped by > 10% compared to previous pricing
      if (existing && existing.current_price > product.current_price) {
        const dropPercent = ((existing.current_price - product.current_price) / existing.current_price) * 100;
        if (dropPercent >= 10.0) {
          console.log(`[ALERTS] 🚨 PRICE DROP DETECTED! ${product.title} dropped by ${dropPercent.toFixed(1)}%! (From ${existing.current_price} TL to ${product.current_price} TL)`);
        }
      }
    }

    return true;
  } catch (err: any) {
    console.error("[Persist] Unexpected persistence error:", err.message);
    return false;
  }
}
