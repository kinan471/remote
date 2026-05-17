/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - CORE ENGINE COORDINATOR
 * Binds Smart Routing, Cryptographic Caching, Multi-layered Extraction, Vision Fallbacks, and Price Integrity
 */

import { ScrapedProduct, ExtractionResult } from '@/types/scraper-engine';
import { routeRequest, applyAffiliateTag } from './router';
import { fetchWithStealth } from './browser';
import { extractJsonLd, extractCss, extractRegex, extractAi, extractVision } from './extractors';
import { validatePriceIntegrity, normalizePrice } from './validation';
import { generateContentHash, isPageUnchanged, updatePageHash, logScrapingExecution, persistScrapedProduct } from './db';
import { getPlatformFromUrl } from './config';
import { learnNewSelectors, logSelectorSuccess } from './selectors';

export interface CrawlEngineResult {
  success: boolean;
  product?: ScrapedProduct;
  confidenceScore: number;
  pipelinePath: string;
  error?: string;
}

/**
 * Enterprise Crawler Brain: Orchestrates the multi-layered dynamic scraping sequence
 */
export async function runScraperEngine(url: string, bypassCache = false): Promise<CrawlEngineResult> {
  const startTime = Date.now();
  const platform = getPlatformFromUrl(url);
  const routerConfig = routeRequest(url);
  
  let pipelinePath = 'SmartRouter';
  let success = false;
  let errorMsg = '';
  let finalProduct: ScrapedProduct | undefined = undefined;
  let finalConfidence = 0.0;

  console.log(`[CrawlerBrain] Initialized crawl for: ${url} (Platform: ${platform})`);

  try {
    // 1. Fetch page using optimized dynamic browsers (Stealth vs cheap HTTP)
    const forceJS = routerConfig.requiresJS || routerConfig.antiBotRisk === 'HIGH' || routerConfig.antiBotRisk === 'EXTREME';
    const fetchResult = await fetchWithStealth(url, platform, forceJS);
    pipelinePath += forceJS ? ' -> StealthBrowser' : ' -> DirectHTTP';

    if (!fetchResult.html) {
      throw new Error(fetchResult.error || "Failed to load webpage content.");
    }

    // 2. Cache Intelligence Layer (MD5 Cryptographic Verification)
    const contentHash = generateContentHash(fetchResult.html);
    const unchanged = !bypassCache && await isPageUnchanged(url, contentHash);
    
    if (unchanged) {
      console.log(`[CacheLayer] MD5 Content Hash unchanged for ${url}. Skipping scraping task.`);
      pipelinePath += ' -> CacheHit(Skip)';
      
      await logScrapingExecution({
        url,
        platform,
        pipeline_path: pipelinePath,
        success: true,
        confidence_score: 1.0,
        duration_ms: Date.now() - startTime
      });

      return {
        success: true,
        confidenceScore: 1.0,
        pipelinePath,
        error: "Cache Hit: Content Unchanged."
      };
    }

    // Update page hash in database
    await updatePageHash(url, contentHash);

    // 3. Multi-Layered Parallel/Sequential Extraction Pipeline
    const extractionCandidates: ExtractionResult[] = [];

    // Prioritize extraction based on Smart Router configuration order
    for (const extractor of routerConfig.priorityOrder) {
      if (extractor === 'JSON-LD') {
        const res = extractJsonLd(fetchResult.html);
        if (res.confidence > 0.3) extractionCandidates.push(res);
      }
      
      else if (extractor === 'CSS-Selector') {
        const res = await extractCss(fetchResult.html, platform);
        if (res.confidence > 0.3) extractionCandidates.push(res);
      }
      
      else if (extractor === 'Regex') {
        const res = extractRegex(fetchResult.html);
        if (res.confidence > 0.3) extractionCandidates.push(res);
      }
      
      else if (extractor === 'AI-Fallback') {
        // Only run expensive Firecrawl AI scrape if other extractors failed (low confidence)
        const maxConfidence = Math.max(...extractionCandidates.map(c => c.confidence), 0);
        if (maxConfidence < 0.70) {
          const res = await extractAi(url);
          if (res.confidence > 0.3) extractionCandidates.push(res);
        }
      }

      else if (extractor === 'Vision-OCR' && fetchResult.screenshotBase64) {
        // Runs screenshot-to-text Vision AI if Captcha blocked or selectors completely failed
        const maxConfidence = Math.max(...extractionCandidates.map(c => c.confidence), 0);
        if (maxConfidence < 0.50) {
          const res = await extractVision(fetchResult.screenshotBase64);
          if (res.confidence > 0.3) extractionCandidates.push(res);
        }
      }
    }

    // 4. Confidence Scoring Evaluation System
    if (extractionCandidates.length === 0) {
      throw new Error("All data extractors failed to retrieve readable product structures.");
    }

    // Pick highest confidence extraction result
    const bestCandidate = extractionCandidates.reduce((prev, current) => 
      (prev.confidence > current.confidence) ? prev : current
    );

    pipelinePath += ` -> ${bestCandidate.extractor}(Score: ${bestCandidate.confidence})`;
    finalConfidence = bestCandidate.confidence;

    // 5. Price Integrity & Outlier Verification Engine
    const productPayload: ScrapedProduct = {
      title: bestCandidate.data.title || 'Ürün',
      description: bestCandidate.data.description || '',
      current_price: bestCandidate.data.current_price || 0,
      original_price: bestCandidate.data.original_price || bestCandidate.data.current_price || 0,
      images: bestCandidate.data.images || [],
      category: bestCandidate.data.category || 'Genel',
      rating: bestCandidate.data.rating || 4.5,
      review_count: bestCandidate.data.review_count || 0,
      scarcity_level: bestCandidate.data.scarcity_level || 10,
      social_proof_count: bestCandidate.data.social_proof_count || 0,
      specs: bestCandidate.data.specs || {},
      source_url: url,
      source_platform: platform,
      currency: 'TRY',
      is_lowest_price: true,
      comparison_data: { lowest_price: "En uygun fiyat garantisi", store: "Yakala" },
      affiliate_link: applyAffiliateTag(url, platform)
    };

    const integrityReport = validatePriceIntegrity(
      productPayload.title,
      productPayload.current_price,
      productPayload.original_price
    );

    if (integrityReport.isAnomaly) {
      throw new Error(`Price integrity check failed: ${integrityReport.reason}`);
    }

    // 6. Persist Validated Product to Database (Supabase)
    const persisted = await persistScrapedProduct(productPayload, finalConfidence);
    if (!persisted) {
      throw new Error("Failed to write validated product to Supabase storage cache.");
    }

    // 7. Dynamic Self-Learning Trigger: If AI or Vision succeeded with high confidence, analyze DOM to learn working CSS selectors!
    if ((bestCandidate.extractor === 'AI-Fallback' || bestCandidate.extractor === 'Vision-OCR') && finalConfidence >= 0.8) {
      console.log(`[Self-Learning] Initiating DOM analysis loop to extract candidate CSS tags for ${platform}...`);
      const learned = learnNewSelectors(
        fetchResult.html,
        platform,
        productPayload.title,
        productPayload.current_price
      );
      
      // Auto-save learned selectors
      for (const sel of learned.title) {
        await logSelectorSuccess(platform, 'title', sel);
      }
      for (const sel of learned.price) {
        await logSelectorSuccess(platform, 'price', sel);
      }
    }

    finalProduct = productPayload;
    success = true;

  } catch (err: any) {
    success = false;
    errorMsg = err.message;
    console.error(`[CrawlerBrain] [FAILED] runScraperEngine error for ${url}:`, errorMsg);
  }

  // 7. System Audit Log Loggings
  const duration = Date.now() - startTime;
  await logScrapingExecution({
    url,
    platform,
    pipeline_path: pipelinePath,
    success,
    error_message: success ? undefined : errorMsg,
    confidence_score: finalConfidence,
    duration_ms: duration
  });

  return {
    success,
    product: finalProduct,
    confidenceScore: finalConfidence,
    pipelinePath,
    error: success ? undefined : errorMsg
  };
}
