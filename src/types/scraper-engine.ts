/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - TYPES & INTERFACES
 * Enterprise-grade Type Definitions for High-Confidence Product Crawling
 */

export type PlatformType = 'trendyol' | 'hepsiburada' | 'amazon' | 'n11' | 'aliexpress' | 'other';
export type SelectorType = 'title' | 'price' | 'original_price' | 'image' | 'specs';
export type ScraperPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScrapedProduct {
  title: string;
  description: string;
  current_price: number;
  original_price: number;
  images: string[];
  category: string;
  rating: number;
  review_count: number;
  scarcity_level: number;
  social_proof_count: number;
  specs: Record<string, string>;
  source_url: string;
  source_platform: PlatformType;
  currency: string;
  is_lowest_price: boolean;
  comparison_data: any;
  affiliate_link: string;
}

export interface ExtractionResult {
  data: Partial<ScrapedProduct>;
  confidence: number; // 0.00 to 1.00
  extractor: 'JSON-LD' | 'CSS-Selector' | 'Regex' | 'AI-Fallback' | 'Vision-OCR';
}

export interface SmartRouteConfig {
  platform: PlatformType;
  requiresJS: boolean;
  priorityOrder: ('JSON-LD' | 'CSS-Selector' | 'Regex' | 'AI-Fallback' | 'Vision-OCR')[];
  antiBotRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface SelectorRecord {
  id?: string;
  platform: PlatformType;
  selector_type: SelectorType;
  selector: string;
  success_count: number;
  failure_count: number;
  is_active: boolean;
  last_used?: string;
}

export interface PriceAnomalyReport {
  isAnomaly: boolean;
  reason?: string;
  confidenceScore: number;
}

export interface ScrapingJob {
  id: string;
  url: string;
  priority: ScraperPriority;
  attempts: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  last_error?: string;
  created_at: string;
}

export interface ScrapingLogEntry {
  url: string;
  platform: PlatformType;
  pipeline_path: string;
  success: boolean;
  error_message?: string;
  confidence_score: number;
  duration_ms: number;
}
