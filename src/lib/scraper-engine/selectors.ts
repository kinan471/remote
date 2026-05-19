/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - SELF-HEALING SELECTORS CONTROLLER
 * Dynamic selector lookup, automatic fallback, and self-learning mechanics
 */

import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';
import { PlatformType, SelectorType } from '@/types/scraper-engine';
import { ENGINE_CONFIG } from './config';
import { normalizePrice } from './validation';

// In-Memory selector cache to limit database query load
const SELECTOR_CACHE: Record<string, string[]> = {};

/**
 * Gets the most active and successful selectors for a platform and type
 */
export async function getActiveSelectors(platform: PlatformType, type: SelectorType): Promise<string[]> {
  const cacheKey = `${platform}:${type}`;
  
  if (SELECTOR_CACHE[cacheKey]) {
    return SELECTOR_CACHE[cacheKey];
  }

  try {
    const { data, error } = await supabase
      .from('scraping_selectors')
      .select('selector, success_count, failure_count, unique_page_count, last_verified_at, last_used, is_active')
      .eq('platform', platform)
      .eq('selector_type', type);

    if (error || !data || data.length === 0) {
      const configVal = (ENGINE_CONFIG.selectors as any)[platform]?.[type];
      const defaults = configVal ? [configVal] : [];
      SELECTOR_CACHE[cacheKey] = defaults;
      return defaults;
    }

    const filteredSelectors = data
      .filter((row: any) => {
        // Predefined or explicitly active selectors
        if (!row.is_active) return false;

        const successCount = row.success_count || 0;
        const failureCount = row.failure_count || 0;
        const successRate = successCount / (successCount + failureCount || 1);
        
        // Decay calculation: check if not verified in 30 days
        const lastActivity = row.last_verified_at || row.last_used;
        const daysSinceActivity = (Date.now() - new Date(lastActivity || new Date()).getTime()) / (1000 * 60 * 60 * 24);
        
        let decayedSuccessRate = successRate;
        if (daysSinceActivity > 30) {
          const decayFactor = Math.max(0.2, 1 - (daysSinceActivity - 30) * 0.02);
          decayedSuccessRate *= decayFactor;
        }

        // Trust criteria: success rate >= 80%
        return decayedSuccessRate >= 0.8;
      })
      .map((row: any) => row.selector);

    // Add default config selector at the end as ultimate fallback
    const defaultConfigVal = (ENGINE_CONFIG.selectors as any)[platform]?.[type];
    if (defaultConfigVal && !filteredSelectors.includes(defaultConfigVal)) {
      filteredSelectors.push(defaultConfigVal);
    }

    SELECTOR_CACHE[cacheKey] = filteredSelectors;
    return filteredSelectors;
  } catch {
    // Ultimate fallback if Supabase is down or schema is missing
    const configVal = (ENGINE_CONFIG.selectors as any)[platform]?.[type];
    const defaults = configVal ? [configVal] : [];
    return defaults;
  }
}

/**
 * Logs the success of a selector, reinforcing its rank in the database
 */
export async function logSelectorSuccess(platform: PlatformType, type: SelectorType, selector: string, url: string) {
  try {
    const { data: existing } = await supabase
      .from('scraping_selectors')
      .select('id, success_count, unique_page_count, last_used_url, failure_count')
      .eq('platform', platform)
      .eq('selector_type', type)
      .eq('selector', selector)
      .single();

    const cleanUrl = url.split('?')[0];

    if (existing) {
      const isNewPage = existing.last_used_url !== cleanUrl;
      const newPageCount = isNewPage ? (existing.unique_page_count || 1) + 1 : (existing.unique_page_count || 1);
      
      const successCount = (existing.success_count || 0) + 1;
      const failureCount = existing.failure_count || 0;
      const successRate = successCount / (successCount + failureCount || 1);
      
      // Auto promote to active if verified across 3+ unique pages and success rate > 80%
      const shouldBeActive = newPageCount >= 3 && successRate >= 0.8;

      await supabase
        .from('scraping_selectors')
        .update({
          success_count: successCount,
          unique_page_count: newPageCount,
          last_used_url: cleanUrl,
          last_used: new Date().toISOString(),
          last_verified_at: new Date().toISOString(),
          is_active: shouldBeActive
        })
        .eq('id', existing.id);
    } else {
      // Register new self-learned selector in DRAFT mode (is_active = false) until verified across pages
      await supabase
        .from('scraping_selectors')
        .insert([{
          platform,
          selector_type: type,
          selector,
          success_count: 1,
          failure_count: 0,
          unique_page_count: 1,
          last_used_url: cleanUrl,
          is_active: false, // starts false, requires verification
          last_used: new Date().toISOString(),
          last_verified_at: new Date().toISOString()
        }]);
    }
    // Clear local cache for this key so it fetches fresh working candidates next time
    delete SELECTOR_CACHE[`${platform}:${type}`];
  } catch {
    // Fail silently to keep crawling robust
  }
}

/**
 * Logs a selector failure. If consecutive failures exceed threshold or rate drops, deactivates selector.
 */
export async function logSelectorFailure(platform: PlatformType, type: SelectorType, selector: string) {
  try {
    const { data: existing } = await supabase
      .from('scraping_selectors')
      .select('id, failure_count, success_count')
      .eq('platform', platform)
      .eq('selector_type', type)
      .eq('selector', selector)
      .single();

    if (existing) {
      const failures = (existing.failure_count || 0) + 1;
      const success = existing.success_count || 0;
      const successRate = success / (success + failures || 1);
      
      // Deactivate if consecutive failures exceed threshold or success rate falls below 80%
      const isStillActive = failures < 5 && successRate >= 0.8;
      
      await supabase
        .from('scraping_selectors')
        .update({
          failure_count: failures,
          is_active: isStillActive,
          last_used: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (!isStillActive) {
        // Clear local cache for this key so it fetches fresh working candidates next time
        delete SELECTOR_CACHE[`${platform}:${type}`];
        console.warn(`[Self-Healing] Deactivated broken selector: ${selector} for ${platform} (${type})`);
      }
    }
  } catch {
    // Fail silently
  }
}

/**
 * Self-Learning Engine: Analyzes page DOM dynamically using Cheerio to extract new CSS paths
 */
export function learnNewSelectors(
  htmlContent: string, 
  platform: PlatformType, 
  parsedTitle: string,
  parsedPrice?: number
): Record<SelectorType, string[]> {
  const candidates: Record<SelectorType, string[]> = {
    title: [],
    price: [],
    original_price: [],
    image: [],
    specs: []
  };

  if (!htmlContent) return candidates;

  try {
    const $ = cheerio.load(htmlContent);

    // 1. Dynamic Title Selector Heuristic
    if (parsedTitle) {
      $('*').each((_, elem) => {
        const text = $(elem).text().trim();
        if (text === parsedTitle) {
          const tagName = (elem as any).name || 'div';
          const className = $(elem).attr('class')?.trim().split(/\s+/)[0];
          const id = $(elem).attr('id')?.trim();

          if (id) {
            candidates.title.push(`${tagName}#${id}`);
          } else if (className) {
            candidates.title.push(`${tagName}.${className}`);
          }
        }
      });
    }

    // 2. Dynamic Price Selector Heuristic
    if (parsedPrice && parsedPrice > 0) {
      $('*').each((_, elem) => {
        const text = $(elem).text().trim();
        const cleanedPrice = normalizePrice(text);
        if (cleanedPrice === parsedPrice) {
          const tagName = (elem as any).name || 'div';
          const className = $(elem).attr('class')?.trim().split(/\s+/)[0];
          const id = $(elem).attr('id')?.trim();

          if (id) {
            candidates.price.push(`${tagName}#${id}`);
          } else if (className) {
            candidates.price.push(`${tagName}.${className}`);
          }
        }
      });
    }
  } catch (err: any) {
    console.error("[Self-Learning] Selector learning failed:", err.message);
  }

  return candidates;
}

export function invalidateCache() {
  Object.keys(SELECTOR_CACHE).forEach(key => delete SELECTOR_CACHE[key]);
}
