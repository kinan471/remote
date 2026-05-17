/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - SMART DECISION ENGINE ROUTER
 * Directs scraping requests through custom, cost-optimized pipelines
 */

import { PlatformType, SmartRouteConfig } from '@/types/scraper-engine';
import { getPlatformFromUrl } from './config';

/**
 * Intelligent Router Brain: Computes the optimal scraping pipeline configuration
 */
export function routeRequest(url: string): SmartRouteConfig {
  const platform = getPlatformFromUrl(url);

  // Default standard config
  const route: SmartRouteConfig = {
    platform,
    requiresJS: false,
    priorityOrder: ['JSON-LD', 'CSS-Selector', 'Regex', 'AI-Fallback'],
    antiBotRisk: 'LOW'
  };

  switch (platform) {
    case 'trendyol':
      route.requiresJS = false; // Trendyol SSR is highly structured, HTTP requests are highly optimized
      route.antiBotRisk = 'MEDIUM';
      route.priorityOrder = ['CSS-Selector', 'JSON-LD', 'Regex', 'AI-Fallback'];
      break;

    case 'hepsiburada':
      route.requiresJS = true; // Hepsiburada relies heavily on client-side JS hydrations
      route.antiBotRisk = 'HIGH';
      route.priorityOrder = ['JSON-LD', 'CSS-Selector', 'Regex', 'AI-Fallback', 'Vision-OCR'];
      break;

    case 'amazon':
      route.requiresJS = true; // Amazon Turkish domains are JS-heavy and actively deploy anti-bot captures
      route.antiBotRisk = 'EXTREME';
      route.priorityOrder = ['JSON-LD', 'CSS-Selector', 'Regex', 'AI-Fallback', 'Vision-OCR'];
      break;

    case 'n11':
      route.requiresJS = false;
      route.antiBotRisk = 'MEDIUM';
      route.priorityOrder = ['CSS-Selector', 'JSON-LD', 'Regex', 'AI-Fallback'];
      break;

    case 'aliexpress':
      route.requiresJS = true; // Fully JavaScript based application
      route.antiBotRisk = 'HIGH';
      route.priorityOrder = ['JSON-LD', 'CSS-Selector', 'AI-Fallback', 'Vision-OCR'];
      break;

    default:
      route.requiresJS = true;
      route.antiBotRisk = 'MEDIUM';
      route.priorityOrder = ['JSON-LD', 'CSS-Selector', 'Regex', 'AI-Fallback'];
      break;
  }

  return route;
}

/**
 * Builds affiliate-enriched links for the target platforms to monetize traffic
 */
export function applyAffiliateTag(url: string, platform: PlatformType): string {
  if (!url) return '';
  
  try {
    const cleanUrl = url.split('?')[0]; // Strip existing tracker queries

    switch (platform) {
      case 'amazon':
        // Append Amazon Associates tracking ID (Turkish Market tag)
        return `${cleanUrl}?tag=yakala03-21`;
        
      case 'trendyol':
        // Append Trendyol partner tracking
        return `${cleanUrl}?boutiqueId=613584&merchantId=106740&utm_source=affiliate&utm_medium=yakala-affiliate`;

      case 'hepsiburada':
        // Append Hepsiburada affiliate partner details
        return `${cleanUrl}?hb_utm=affiliate&hb_source=yakala-affiliate`;

      default:
        return url;
    }
  } catch {
    return url;
  }
}
