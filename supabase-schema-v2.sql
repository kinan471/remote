-- ===================================================
-- YAKALA PLATFORM - ENTERPRISE CRAWLER SCHEMA V2
-- Run this in Supabase SQL Editor
-- Active Ref: vvxuahkmbzucccztbvod
-- ===================================================

-- 1. Learned Selectors Table for Self-Healing System
CREATE TABLE IF NOT EXISTS scraping_selectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  selector_type VARCHAR(50) NOT NULL, -- 'title', 'price', 'original_price', 'image', 'specs'
  selector TEXT NOT NULL,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  unique_page_count INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_platform_selector UNIQUE (platform, selector_type, selector)
);

-- Enable RLS for selectors
ALTER TABLE scraping_selectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Selectors readable by authenticated" ON scraping_selectors;
CREATE POLICY "Selectors readable by authenticated" ON scraping_selectors
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Selectors managed by system" ON scraping_selectors;
CREATE POLICY "Selectors managed by system" ON scraping_selectors
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- 2. Page Hash Tracker Table for Cache Intelligence Layer
CREATE TABLE IF NOT EXISTS page_hashes (
  url TEXT PRIMARY KEY,
  content_hash VARCHAR(64) NOT NULL,
  last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for page_hashes
ALTER TABLE page_hashes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hashes readable" ON page_hashes;
CREATE POLICY "Hashes readable" ON page_hashes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Hashes managed" ON page_hashes;
CREATE POLICY "Hashes managed" ON page_hashes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- 3. Comprehensive Audit Log Table for Analytics & Block Tracking
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  pipeline_path VARCHAR(100) NOT NULL, -- e.g., 'SmartRouter -> StealthPlaywright -> CSS'
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT DEFAULT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for scraping_logs
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logs managed by system" ON scraping_logs;
CREATE POLICY "Logs managed by system" ON scraping_logs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- 4. Product Price History Tracker for Analytics & Dynamic Alerts
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for product_prices
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prices readable by public" ON product_prices;
CREATE POLICY "Prices readable by public" ON product_prices
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Prices managed by system" ON product_prices;
CREATE POLICY "Prices managed by system" ON product_prices
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- 5. Creating lightning-fast indexes for analytics and learning queries
CREATE INDEX IF NOT EXISTS idx_selectors_platform ON scraping_selectors(platform, is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_prices(product_id, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_platform ON scraping_logs(platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_hashes_url ON page_hashes(url);

-- 6. Dynamic schema updates for V2.1
ALTER TABLE scraping_selectors ADD COLUMN IF NOT EXISTS unique_page_count INT DEFAULT 1;
ALTER TABLE scraping_selectors ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE scraping_selectors ADD COLUMN IF NOT EXISTS last_used_url TEXT;

-- ===================================================
-- END OF V2 SCHEMA MIGRATION
-- ===================================================
