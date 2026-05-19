/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - EMBEDDED STATE EXTRACTOR
 * Safely traverses __NEXT_DATA__ and window.__INITIAL_STATE__ hydration nodes
 */

import * as cheerio from 'cheerio';
import { ExtractionResult } from '@/types/scraper-engine';
import { normalizePrice, optimizeImages } from './validation';

/**
 * Standardizes raw product keys extracted from hydration states
 */
export function normalizeEmbeddedProduct(raw: any): ExtractionResult {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'Embedded-State' };

  try {
    const title = raw.productName || raw.name || raw.title || '';
    const currentPriceRaw = raw.currentPrice || raw.discountedPrice || raw.sellingPrice || raw.priceValue || raw.price || '0';
    const originalPriceRaw = raw.originalPrice || raw.listPrice || raw.highPrice || currentPriceRaw;

    const current_price = normalizePrice(String(currentPriceRaw));
    const original_price = normalizePrice(String(originalPriceRaw));

    let images: string[] = [];
    const rawImages = raw.images || raw.productImages || raw.imageUrls || [];
    if (Array.isArray(rawImages)) {
      images = rawImages.map(img => {
        if (typeof img === 'object' && img !== null) {
          return img.url || img.imagePath || img.src;
        }
        return img;
      }).filter(Boolean);
    } else if (typeof rawImages === 'string') {
      images = [rawImages];
    }

    // Specs mapping
    const specs: Record<string, string> = {};
    if (Array.isArray(raw.attributes)) {
      raw.attributes.forEach((attr: any) => {
        const k = attr.name || attr.key || attr.attributeName;
        const v = attr.value || attr.attributeValue;
        if (k && v) specs[String(k)] = String(v);
      });
    }

    const rating = Number(raw.ratingValue || raw.rating || 4.5);
    const review_count = Number(raw.reviewCount || raw.reviewsCount || 0);
    const scarcity_level = Number(raw.remainingStock || raw.stock || raw.scarcityLevel || 10);

    if (title && current_price > 0) {
      result.data = {
        title,
        current_price,
        original_price: original_price || current_price * 1.25,
        images: optimizeImages(images),
        rating,
        review_count,
        specs,
        scarcity_level
      };
      result.confidence = 0.98; // Very high confidence for structured hydration JSON
    }
  } catch (err: any) {
    console.error("[EmbeddedExtractor] Normalization error:", err.message);
    result.confidence = 0.0;
  }

  return result;
}

/**
 * Performs a depth-limited search of target product keys inside a parsed JSON tree
 */
export function searchJsonTree(
  obj: any,
  targets: string[],
  maxDepth = 5,
  currentDepth = 0,
  visited = new Set<any>()
): Record<string, any> {
  const found: Record<string, any> = {};
  if (!obj || typeof obj !== 'object' || currentDepth > maxDepth || visited.has(obj)) {
    return found;
  }

  visited.add(obj);

  // Check top keys
  for (const k of Object.keys(obj)) {
    if (targets.includes(k)) {
      found[k] = obj[k];
    }
  }

  // Recurse into children
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (val && typeof val === 'object') {
      const childFound = searchJsonTree(val, targets, maxDepth, currentDepth + 1, visited);
      Object.assign(found, childFound);
    }
  }

  return found;
}

/**
 * Main Embedded State Extraction Engine
 */
export function extractEmbeddedState(html: string): ExtractionResult {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'Embedded-State' };

  try {
    const $ = cheerio.load(html);
    let stateJson: any = null;

    // 1. Search for Next.js hydrations
    const nextDataText = $('script#__NEXT_DATA__').html()?.trim();
    if (nextDataText) {
      try {
        stateJson = JSON.parse(nextDataText);
      } catch {}
    }

    // 2. Search for window.__INITIAL_STATE__ script tags if Next.js hydration is empty
    if (!stateJson) {
      $('script').each((_, elem) => {
        const scriptText = $(elem).html() || '';
        const match = scriptText.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/) || 
                      scriptText.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})/);
        if (match) {
          try {
            stateJson = JSON.parse(match[1]);
          } catch {}
        }
      });
    }

    if (stateJson) {
      // Limit tree search to relevant product attributes
      const keysToLocate = [
        'productName', 'name', 'title',
        'currentPrice', 'discountedPrice', 'sellingPrice', 'priceValue', 'price',
        'originalPrice', 'listPrice', 'highPrice',
        'images', 'productImages', 'imageUrls',
        'attributes', 'specs',
        'ratingValue', 'rating',
        'reviewCount', 'reviewsCount',
        'remainingStock', 'stock', 'scarcityLevel'
      ];

      const rawExtracted = searchJsonTree(stateJson, keysToLocate, 5);
      return normalizeEmbeddedProduct(rawExtracted);
    }
  } catch (err: any) {
    console.error("[EmbeddedExtractor] Extraction failed:", err.message);
  }

  return result;
}
