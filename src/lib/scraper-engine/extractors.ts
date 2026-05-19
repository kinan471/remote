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
 * 2. Hyper-Optimized Hepsiburada Native Extractor
 * specifically targeted at Hepsiburada's DOM, __NEXT_DATA__, and schema.org formats.
 */
export async function extractHepsiburadaNative(html: string): Promise<ExtractionResult> {
  const result: ExtractionResult = { data: {}, confidence: 0.0, extractor: 'Hepsiburada-Native' };

  try {
    const $ = cheerio.load(html);
    
    let title = '';
    let current_price = 0;
    let original_price = 0;
    const images: string[] = [];
    let rating = 4.5;
    let reviewCount = 0;
    let category = "Genel";
    const specs: Record<string, string> = {};

    // 1. Try to find Hepsiburada's specific JSON-LD Product schema
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const parsed = JSON.parse($(elem).html() || '{}');
        if (parsed['@type'] === 'Product') {
          title = title || parsed.name;
          const offer = Array.isArray(parsed.offers) ? parsed.offers[0] : parsed.offers;
          if (offer) {
            current_price = current_price || normalizePrice(offer.price || '0');
            original_price = original_price || normalizePrice(offer.highPrice || offer.price || '0');
          }
          if (parsed.aggregateRating) {
            rating = Number(parsed.aggregateRating.ratingValue) || rating;
            reviewCount = Number(parsed.aggregateRating.reviewCount) || reviewCount;
          }
        }
      } catch (e) {}
    });

    // 2. Try Hepsiburada's specific CSS classes (Fallback)
    if (!title) title = $('h1#product-name, h1.product-name').text().trim();
    if (!current_price) {
      const pText = $('span[data-bind*="currentPrice"], #offering-price, span.price').first().text();
      if (pText) current_price = normalizePrice(pText);
    }
    if (!original_price) {
      const opText = $('del#originalPrice, del.price-old').first().text();
      if (opText) original_price = normalizePrice(opText);
    }

    // Extract images (Hepsiburada usually has a carousel)
    $('img.product-image, img[itemprop="image"], .owl-item img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('base64') && src.includes('http')) {
        images.push(src);
      }
    });

    // Extract basic specs from their table
    $('table.data-list tbody tr').each((_, row) => {
      const k = $(row).find('th').text().trim();
      const v = $(row).find('td').text().trim();
      if (k && v) specs[k] = v;
    });

    // Try to extract stock/scarcity level dynamically
    let scarcity_level = 10;
    const stockMatch = html.match(/(?:son|sadece)\s*(\d+)\s*(?:adet|ürün|tane)/i);
    if (stockMatch) {
      scarcity_level = parseInt(stockMatch[1]);
    } else {
      const jsonStockMatch = html.match(/"(?:stock|inventory|qty|quantity|remaining)"\s*:\s*"?(\d+)"?/i);
      if (jsonStockMatch) {
        scarcity_level = parseInt(jsonStockMatch[1]);
      }
    }

    result.data = {
      title,
      current_price,
      original_price: original_price || current_price * 1.25,
      images: optimizeImages([...new Set(images)]),
      rating,
      review_count: reviewCount,
      category,
      specs,
      scarcity_level
    };

    result.confidence = title && current_price ? 0.95 : 0.10;
  } catch (e) {
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
