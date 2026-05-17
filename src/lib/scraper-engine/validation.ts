/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - VALIDATION & PRICE INTEGRITY ENGINE
 * Protects against installment pricing traps, fake discounts, and data corruption
 */

import { PriceAnomalyReport } from '@/types/scraper-engine';
import { ENGINE_CONFIG } from './config';

/**
 * Normalizes a raw price string into a precise floating point number
 */
export function normalizePrice(text: string): number {
  if (!text) return 0;
  
  // Clean currencies and whitespace
  let cleaned = text.replace(/[₺$€\s]/g, "").trim();

  // Strip standard Turkish/European separators (e.g. "34.500,90" -> "34500.90")
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // If no comma, check if dot represents thousands separator (e.g. "34.500")
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, "");
    } else {
      const parts = cleaned.split(".");
      if (parts.length === 2 && parts[1].length === 3) {
        cleaned = cleaned.replace(/\./g, "");
      }
    }
  }

  cleaned = cleaned.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Price Integrity Engine: Evaluates a product's price for outliers, installments, and anomalies
 */
export function validatePriceIntegrity(
  title: string,
  currentPrice: number,
  originalPrice: number,
  historicalPrice?: number
): PriceAnomalyReport {
  const titleLower = title.toLowerCase();

  // 1. Block known Captcha or Page Errors
  const isErrorPage = ["üzgünüz", "sorry", "robot", "captcha", "access denied", "sayfa bulunamadı", "error"].some(kw => titleLower.includes(kw));
  if (isErrorPage) {
    return { isAnomaly: true, reason: "Error or captcha blocked page detected in title.", confidenceScore: 0.0 };
  }

  // 2. Reject zero or negative pricing
  if (currentPrice <= 0) {
    return { isAnomaly: true, reason: "Scraped price is zero or negative.", confidenceScore: 0.0 };
  }

  // 3. Category floors (E.g. laptops, phones, vacuums cannot be extremely cheap)
  const isTech = ["laptop", "dizüstü", "bilgisayar", "telefon", "akıllı telefon", "tablet", "süpürge", "tv", "televizyon", "playstation", "xbox", "monitor", "monitör", "ekran kartı"].some(kw => titleLower.includes(kw));
  if (isTech && currentPrice < ENGINE_CONFIG.anomaly.techProductFloorTRY) {
    return {
      isAnomaly: true,
      reason: `Installment or fake price anomaly detected! Tech product priced below ${ENGINE_CONFIG.anomaly.techProductFloorTRY} TRY. Current price scraped: ${currentPrice} TRY`,
      confidenceScore: 0.1
    };
  }

  // 4. Base price absolute floor
  if (currentPrice < ENGINE_CONFIG.anomaly.minimumPriceTRY && !isTech) {
    return {
      isAnomaly: true,
      reason: `Product price is below baseline floor of ${ENGINE_CONFIG.anomaly.minimumPriceTRY} TRY. Scraped: ${currentPrice} TRY`,
      confidenceScore: 0.2
    };
  }

  // 5. Detect fake discount anchors (e.g. 99% off)
  if (originalPrice > currentPrice) {
    const discountRatio = (originalPrice - currentPrice) / originalPrice;
    if (discountRatio > ENGINE_CONFIG.anomaly.maxPriceDropRatio) {
      return {
        isAnomaly: true,
        reason: `Fake discount anchor detected! Scraped discount is ${(discountRatio * 100).toFixed(0)}%, which exceeds maximum threshold of ${(ENGINE_CONFIG.anomaly.maxPriceDropRatio * 100)}%.`,
        confidenceScore: 0.3
      };
    }
  }

  // 6. Check historical deviations if available
  if (historicalPrice && historicalPrice > 0) {
    const variance = Math.abs(currentPrice - historicalPrice) / historicalPrice;
    if (variance > ENGINE_CONFIG.anomaly.maxPriceSpikeRatio) {
      return {
        isAnomaly: true,
        reason: `Extreme price spike detected! Scraped price (${currentPrice} TRY) deviates by ${(variance * 100).toFixed(0)}% from historical baseline (${historicalPrice} TRY).`,
        confidenceScore: 0.3
      };
    }
  }

  return { isAnomaly: false, confidenceScore: 0.95 };
}

/**
 * Image Optimizer: Sanitizes image URLs to yield high-resolution targets and strips icons
 */
export function optimizeImages(urls: string[]): string[] {
  if (!urls || urls.length === 0) return [];

  const sanitized = urls
    .map(url => {
      if (!url) return '';
      
      let clean = url.trim();
      
      // Ensure absolute URL
      if (clean.startsWith('//')) {
        clean = 'https:' + clean;
      }

      // 1. Clean Hepsiburada Image Resolutions (extract full resolution from thumbnail paths)
      if (clean.includes('hepsiburada.net/productimages/')) {
        clean = clean.replace(/\/s\/[^\/]+/, ''); // Strips small thumbnail sizes e.g. /s/90/
      }

      // 2. Clean Trendyol Image Resolution parameters
      if (clean.includes('trendyol.com/mnresize/')) {
        clean = clean.replace(/\/mnresize\/[^/]+\/[^/]+/, ''); // Strips resize sub-paths
      }

      // 3. Amazon high-res upgrades (strips thumbnail dimension tokens)
      if (clean.includes('media-amazon.com/images/I/')) {
        clean = clean.replace(/\._[A-Z0-9_,]+_\./g, '.'); // Strips scaling token like ._AC_UL320_.
      }

      return clean;
    })
    .filter(url => {
      if (!url) return false;
      // Strip typical tracker/spacer/logo icons
      const lower = url.toLowerCase();
      return !['logo', 'spacer', 'sprite', 'icon', 'arrow', 'banner'].some(kw => lower.includes(kw));
    });

  // Deduplicate matches while maintaining order
  return Array.from(new Set(sanitized));
}
