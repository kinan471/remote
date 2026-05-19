import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';
import { PlatformType, ScrapedProduct, ScrapingLogEntry } from '@/types/scraper-engine';

/**
 * Calculates a cryptographic SHA-256 content hash for semantic cache matching
 */
export function generateContentHash(html: string): string {
  if (!html) return '';
  
  try {
    const $ = cheerio.load(html);
    
    // Extract semantic title, price, and stock info
    const titleText = $('h1#product-name, h1.product-name, title').first().text() || '';
    const priceText = $('span[data-bind*="currentPrice"], #offering-price, span.price').first().text() || '';
    
    let stockText = '';
    const stockMatch = html.match(/(?:son|sadece)\s*(\d+)\s*(?:adet|ürün|tane)/i);
    if (stockMatch) {
      stockText = stockMatch[1];
    }

    // Normalize semantic fields (lowercase, strip whitespace, currency, and timestamps)
    const cleanString = `${titleText} ${priceText} ${stockText}`
      .toLowerCase()
      .replace(/[\s\t\n\r]/g, '')
      .replace(/[₺tltry$,.]/g, '')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, '')
      .trim();

    // Use semantic string as hash key, or full HTML fallback if extraction fails
    const hashInput = cleanString.length > 5 ? cleanString : html.trim();

    const cryptoNode = require('crypto');
    return cryptoNode.createHash('sha256').update(hashInput).digest('hex');
  } catch (err) {
    const cryptoNode = require('crypto');
    return cryptoNode.createHash('sha256').update(html).digest('hex');
  }
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
 * Unified Fingerprint Generator - Single source of truth for deduplication
 * Normalizes Turkish characters so same product from different platforms = same fingerprint
 */
export function generateProductFingerprint(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ').filter(w => w.length > 1);
  const brand = words[0] || 'unknown';

  // MPN detection: 6+ chars with both letters and digits (e.g. FA507NVR, SM-G998B)
  const mpn = words.find(w => w.length >= 6 && /[a-z]/.test(w) && /[0-9]/.test(w));

  const base = mpn
    ? `${brand}-${mpn}`
    : words.slice(0, 6).join('-');

  // Use encodeURIComponent to handle non-ASCII safely before btoa
  return btoa(unescape(encodeURIComponent(base))).substring(0, 50);
}

/**
 * Persistence Handler: Saves or updates validated products, ensuring fingerprint integrity
 * Uses BOTH fingerprint AND source_url as deduplication keys to prevent any double storage
 */
export async function persistScrapedProduct(product: ScrapedProduct, confidenceScore: number): Promise<boolean> {
  try {
    // Use the unified fingerprint generator (same algorithm everywhere)
    const fingerprint = generateProductFingerprint(product.title);

    // PRIMARY: Check if this EXACT URL already exists (strongest dedup key)
    const cleanUrl = product.source_url.split('?')[0]; // Remove query params
    const { data: existingByUrl } = await supabase
      .from('products')
      .select('id, current_price')
      .eq('source_url', cleanUrl)
      .single();

    // SECONDARY: Check by fingerprint (catches same product from different platforms)
    const { data: existingByFp } = !existingByUrl ? await supabase
      .from('products')
      .select('id, current_price')
      .eq('fingerprint', fingerprint)
      .single() : { data: null };

    const existing = existingByUrl || existingByFp;


    // Clean payload for active base columns (remove review_count as it's not present in user's products table)
    const { review_count, ...productToInsert } = product as any;

    const upsertPayload = {
      ...productToInsert,
      fingerprint,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    let data, error;
    if (existing) {
      const res = await supabase.from('products').update(upsertPayload).eq('id', existing.id).select('id').single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase.from('products').insert([upsertPayload]).select('id').single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("[Persist] Insert/Update error:", error.message);
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
