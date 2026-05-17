/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - HYBRID EXTRACTION ENGINE
 * Handles JSON-LD, CSS Selectors, Regex, and Gemini Vision Fallbacks
 */

import * as cheerio from 'cheerio';
import { ScrapedProduct, ExtractionResult, PlatformType } from '@/types/scraper-engine';
import { getActiveSelectors, logSelectorSuccess, logSelectorFailure } from './selectors';
import { normalizePrice, optimizeImages } from './validation';
import { ENGINE_CONFIG } from './config';

/**
 * 1. JSON-LD Parser Module
 */
export function extractJsonLd(html: string): ExtractionResult {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'JSON-LD' };
  
  try {
    const $ = cheerio.load(html);
    let jsonData: any = null;

    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const content = $(elem).html()?.trim();
        if (!content) return;
        const parsed = JSON.parse(content);
        
        // Find single object or search in graph
        if (parsed['@type'] === 'Product' || parsed['@context']?.includes('schema.org')) {
          jsonData = parsed;
          return false; // Break loop
        }
        if (Array.isArray(parsed)) {
          const item = parsed.find(x => x['@type'] === 'Product');
          if (item) {
            jsonData = item;
            return false;
          }
        }
        if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          const item = parsed['@graph'].find(x => x['@type'] === 'Product');
          if (item) {
            jsonData = item;
            return false;
          }
        }
      } catch {
        // Continue
      }
    });

    if (jsonData) {
      const offer = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
      const images = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image].filter(Boolean);

      result.data = {
        title: jsonData.name || '',
        description: jsonData.description || '',
        current_price: normalizePrice(offer?.price || offer?.lowPrice || '0'),
        original_price: normalizePrice(offer?.highPrice || offer?.price || '0'),
        images: optimizeImages(images),
        category: jsonData.category || '',
        rating: Number(jsonData.aggregateRating?.ratingValue || 4.5),
        review_count: Number(jsonData.aggregateRating?.reviewCount || 0)
      };

      result.confidence = result.data.title && result.data.current_price ? 0.92 : 0.40;
    }
  } catch {
    result.confidence = 0.0;
  }

  return result;
}

/**
 * 2. Self-Healing CSS Selector Parser Module
 */
export async function extractCss(html: string, platform: PlatformType): Promise<ExtractionResult> {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'CSS-Selector' };

  try {
    const $ = cheerio.load(html);
    
    // Resolve learned working selectors dynamically
    const titleSelectors = await getActiveSelectors(platform, 'title');
    const priceSelectors = await getActiveSelectors(platform, 'price');
    const origPriceSelectors = await getActiveSelectors(platform, 'original_price');
    const imageSelectors = await getActiveSelectors(platform, 'image');

    let title = '';
    let current_price = 0;
    let original_price = 0;
    const images: string[] = [];

    // Extract Title
    for (const sel of titleSelectors) {
      const val = $(sel).text().trim();
      if (val) {
        title = val;
        await logSelectorSuccess(platform, 'title', sel);
        break;
      } else {
        await logSelectorFailure(platform, 'title', sel);
      }
    }

    // Extract Price
    for (const sel of priceSelectors) {
      const val = $(sel).text().trim();
      if (val) {
        const priceNum = normalizePrice(val);
        if (priceNum > 0) {
          current_price = priceNum;
          await logSelectorSuccess(platform, 'price', sel);
          break;
        }
      }
      await logSelectorFailure(platform, 'price', sel);
    }

    // Extract Original Price
    for (const sel of origPriceSelectors) {
      const val = $(sel).text().trim();
      if (val) {
        const priceNum = normalizePrice(val);
        if (priceNum > 0) {
          original_price = priceNum;
          await logSelectorSuccess(platform, 'original_price', sel);
          break;
        }
      }
      await logSelectorFailure(platform, 'original_price', sel);
    }

    // Extract Product Images
    for (const sel of imageSelectors) {
      $(sel).each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy');
        if (src) images.push(src);
      });
      if (images.length > 0) {
        await logSelectorSuccess(platform, 'image', sel);
        break;
      }
      await logSelectorFailure(platform, 'image', sel);
    }

    result.data = {
      title,
      current_price,
      original_price: original_price || current_price * 1.25,
      images: optimizeImages(images)
    };

    result.confidence = title && current_price ? 0.85 : 0.10;
  } catch {
    result.confidence = 0.0;
  }

  return result;
}

/**
 * 3. Fast Regex Fallback Extractor
 */
export function extractRegex(html: string): ExtractionResult {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'Regex' };

  try {
    // 1. Seek direct title markup match
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // 2. Scan for price matching patterns
    // Matches expressions like 'price: 15499.00' or similar JSON values
    const priceMatch = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i) || html.match(/"currentPrice"\s*:\s*"?([\d.,]+)"?/i);
    const current_price = priceMatch ? normalizePrice(priceMatch[1]) : 0;

    if (title || current_price) {
      result.data = {
        title,
        current_price,
        original_price: current_price * 1.2
      };
      result.confidence = title && current_price ? 0.60 : 0.15;
    }
  } catch {
    result.confidence = 0.0;
  }

  return result;
}

/**
 * 4. Firecrawl AI Extraction Fallback Module
 */
export async function extractAi(url: string): Promise<ExtractionResult> {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'AI-Fallback' };
  
  if (!ENGINE_CONFIG.firecrawlKey) {
    return result;
  }

  try {
    console.log(`[AI-Fallback] Launching Firecrawl AI on: ${url}`);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENGINE_CONFIG.firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["extract"],
        waitFor: 2000,
        extract: {
          prompt: "Extract the exact product title, real selling price (integer/float, no shipping/installments), list price before discount, description, overall rating (0-5), high-quality image URLs, and technical specs table.",
          schema: {
            type: "object",
            properties: {
              title:         { type: "string" },
              price:         { type: "string" },
              originalPrice: { type: "string" },
              description:   { type: "string" },
              rating:        { type: "number" },
              images:        { type: "array", items: { type: "string" } },
              category:      { type: "string" },
              specs:         { type: "object", additionalProperties: { type: "string" } }
            },
            required: ["title", "price"],
          },
        },
      }),
    });

    if (!response.ok) throw new Error("Firecrawl API request failed.");

    const json = await response.json();
    const extracted = json.data?.extract || {};

    result.data = {
      title: extracted.title || '',
      description: extracted.description || '',
      current_price: normalizePrice(extracted.price || '0'),
      original_price: normalizePrice(extracted.originalPrice || '0') || normalizePrice(extracted.price || '0') * 1.25,
      images: optimizeImages(extracted.images || []),
      category: extracted.category || 'Genel',
      rating: extracted.rating || 4.5,
      specs: extracted.specs || {}
    };

    result.confidence = result.data.title && result.data.current_price ? 0.88 : 0.10;
  } catch (err: any) {
    console.error("[AI-Fallback] Error:", err.message);
    result.confidence = 0.0;
  }

  return result;
}

/**
 * 5. Multi-modal Vision AI Fallback (Direct Gemini Vision OCR)
 */
export async function extractVision(screenshotBase64: string): Promise<ExtractionResult> {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'Vision-OCR' };

  if (!ENGINE_CONFIG.geminiKey) {
    return result;
  }

  try {
    console.log(`[Vision-OCR] Dispatched product screenshot to Google Gemini Multimodal Vision API...`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENGINE_CONFIG.geminiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "You are an expert ecommerce data extractor. Look at this product screenshot. Extract the primary product title, the main selling price in Turkish Liras (ignore shipping, vouchers, or monthly installment options), and list price before discount. Return ONLY a valid JSON string conforming exactly to this structure: {\"title\": \"extracted title\", \"price\": \"34500.00\", \"originalPrice\": \"39000.00\"}"
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: screenshotBase64
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) throw new Error("Gemini API failed");

    const json = await response.json();
    const textResult = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse cleaned JSON from response block
    const cleanedJsonStr = textResult.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedJsonStr);

    result.data = {
      title: parsed.title || '',
      current_price: normalizePrice(parsed.price || '0'),
      original_price: normalizePrice(parsed.originalPrice || '0') || normalizePrice(parsed.price || '0') * 1.2
    };

    result.confidence = result.data.title && result.data.current_price ? 0.90 : 0.10;
  } catch (err: any) {
    console.error("[Vision-OCR] Error:", err.message);
    result.confidence = 0.0;
  }

  return result;
}
