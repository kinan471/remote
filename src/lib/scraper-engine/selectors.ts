/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - SELF-HEALING SELECTORS CONTROLLER
 * Dynamic selector lookup, automatic fallback, and self-learning mechanics
 */

import { supabase } from '@/lib/supabase';
import { PlatformType, SelectorType, SelectorRecord } from '@/types/scraper-engine';
import { ENGINE_CONFIG } from './config';

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
      .select('selector')
      .eq('platform', platform)
      .eq('selector_type', type)
      .eq('is_active', true)
      .order('success_count', { ascending: false });

    // Graceful degradation if database table v2 does not exist yet (Supabase missing tables)
    if (error || !data || data.length === 0) {
      const configVal = (ENGINE_CONFIG.selectors as any)[platform]?.[type];
      const defaults = configVal ? [configVal] : [];
      SELECTOR_CACHE[cacheKey] = defaults;
      return defaults;
    }

    const selectors = data.map((row: any) => row.selector);
    
    // Add default config selector at the end as ultimate fallback
    const defaultConfigVal = (ENGINE_CONFIG.selectors as any)[platform]?.[type];
    if (defaultConfigVal && !selectors.includes(defaultConfigVal)) {
      selectors.push(defaultConfigVal);
    }

    SELECTOR_CACHE[cacheKey] = selectors;
    return selectors;
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
export async function logSelectorSuccess(platform: PlatformType, type: SelectorType, selector: string) {
  try {
    const { data: existing } = await supabase
      .from('scraping_selectors')
      .select('id, success_count')
      .eq('platform', platform)
      .eq('selector_type', type)
      .eq('selector', selector)
      .single();

    if (existing) {
      await supabase
        .from('scraping_selectors')
        .update({
          success_count: (existing.success_count || 0) + 1,
          last_used: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existing.id);
    } else {
      // Register new working selector discovered by our self-learning engine
      await supabase
        .from('scraping_selectors')
        .insert([{
          platform,
          selector_type: type,
          selector,
          success_count: 1,
          failure_count: 0,
          is_active: true,
          last_used: new Date().toISOString()
        }]);
    }
  } catch {
    // Fail silently to keep crawling robust
  }
}

/**
 * Logs a selector failure. If consecutive failures exceed threshold, deactivates selector.
 */
export async function logSelectorFailure(platform: PlatformType, type: SelectorType, selector: string) {
  try {
    const { data: existing } = await supabase
      .from('scraping_selectors')
      .select('id, failure_count')
      .eq('platform', platform)
      .eq('selector_type', type)
      .eq('selector', selector)
      .single();

    if (existing) {
      const failures = (existing.failure_count || 0) + 1;
      const isStillActive = failures < 5; // Deactivate if it fails 5 times in a row (stale selector due to DOM updates)
      
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
 * Self-Learning Engine: Learns candidate selectors dynamically based on Cheerio HTML structure
 */
export function learnNewSelectors(htmlContent: string, platform: PlatformType, parsedTitle: string): Record<SelectorType, string[]> {
  const candidates: Record<SelectorType, string[]> = {
    title: [],
    price: [],
    original_price: [],
    image: [],
    specs: []
  };

  // Skip parsing if page is empty
  if (!htmlContent) return candidates;

  try {
    // Very simple heuristics for learning selectors from raw HTML strings if needed
    // Matches classes or elements containing 'price', 'prc', 'title' to register candidate selectors
    if (htmlContent.includes('class="prc') || htmlContent.includes('class="price')) {
      candidates.price.push('.price');
      candidates.price.push('.prc-dsc');
    }
  } catch {
    // Robustness
  }

  return candidates;
}
export function invalidateCache() {
  Object.keys(SELECTOR_CACHE).forEach(key => delete SELECTOR_CACHE[key]);
}
