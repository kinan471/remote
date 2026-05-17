/**
 * YAKALA SCRAPER ENGINE - V2 ENTERPRISE BRIDGE
 * Wraps Ultra Scraper Engine V2 to provide instant, backward-compatible upgrades to all existing discovery & admin routines!
 */

import { runScraperEngine } from './scraper-engine';

/**
 * Full AI/Multi-layered Scrape (used when discovering or adding new products)
 */
export async function scrapeProduct(url: string) {
  console.log(`[V2 Bridge] Redirecting product scrape request to V2 Engine: ${url}`);
  const result = await runScraperEngine(url, true); // Force bypass cache for direct/admin/fresh additions

  if (!result.success || !result.product) {
    throw new Error(result.error || "Ultra Scraper V2 failed to extract product details.");
  }

  // Map back to original structure expected by discovery & admin flows
  return {
    ...result.product,
    scarcity_level: result.product.scarcity_level || 10,
    social_proof_count: result.product.social_proof_count || 15,
    specs: result.product.specs || {}
  };
}

/**
 * Fast Price Update Check (used by cron job routines)
 */
export async function updateProductPrice(url: string) {
  console.log(`[V2 Bridge] Redirecting fast price update request to V2 Engine: ${url}`);
  const result = await runScraperEngine(url, false); // Use cache-hit optimization to save API costs!

  if (!result.success || !result.product) {
    return null;
  }

  return result.product.current_price;
}

// Keep helper exports for backward compatibility
export function extractPriceFromMarkdown(markdown: string): number | null {
  if (!markdown) return null;
  const priceRegex = /([\d.,]+)\s*(?:TL|₺|TRY)/gi;
  const matches = [...markdown.matchAll(priceRegex)];
  if (matches.length > 0) {
    const cleaned = matches[0][1].replace(/[₺$€\s]/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}