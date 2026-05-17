/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - CONFIGURATION PANEL
 */

import { PlatformType } from '@/types/scraper-engine';

export const ENGINE_CONFIG = {
  // Credentials
  firecrawlKey: process.env.FIRECRAWL_API_KEY || '',
  deepseekKey: process.env.DEEPSEEK_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
  groqKey: process.env.GROQ_API_KEY || '',
  
  // Redis Settings (BullMQ)
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || undefined,
  },

  // Crawling Rate Limiting & Delays (ms)
  delays: {
    min: 1500,
    max: 6000,
  },

  // Integrity Thresholds
  anomaly: {
    maxPriceDropRatio: 0.85,  // Rejects drops of > 85% (likely an installment/fake price trap)
    maxPriceSpikeRatio: 4.0,  // Warns on spikes of > 400%
    minimumPriceTRY: 100.0,   // General pricing floor
    techProductFloorTRY: 500.0 // Pricing floor for laptops, vacuums, phones
  },

  // Default User Agents pool to evade fingerprinters
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ],

  // Platform Specific Target Patterns
  selectors: {
    trendyol: {
      title: 'h1.pr-new-br',
      price: 'span.prc-dsc',
      originalPrice: 'span.prc-org',
      image: 'img.p-card-img',
    },
    hepsiburada: {
      title: 'h1#product-name',
      price: 'span[data-bind="text: product.price.currentPrice"]',
      originalPrice: 'del#originalPrice',
      image: 'img.product-image',
    },
    amazon: {
      title: 'span#productTitle',
      price: 'span.a-price-whole',
      originalPrice: 'span.a-text-price span[aria-hidden="true"]',
      image: 'img#landingImage',
    }
  }
};

/**
 * Normalizes url to lowercase platform identifier
 */
export function getPlatformFromUrl(url: string): PlatformType {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('trendyol.com')) return 'trendyol';
  if (lowercaseUrl.includes('hepsiburada.com')) return 'hepsiburada';
  if (lowercaseUrl.includes('amazon.com') || lowercaseUrl.includes('amazon.com.tr')) return 'amazon';
  if (lowercaseUrl.includes('n11.com')) return 'n11';
  if (lowercaseUrl.includes('aliexpress.com')) return 'aliexpress';
  return 'other';
}
