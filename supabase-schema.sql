-- ===================================================
-- YAKALA PLATFORM - COMPLETE DATABASE RESET & BUILD SCRIPT
-- Run this script in the Supabase SQL Editor to wipe
-- all existing tables and rebuild the schema from scratch.
-- ===================================================

-- 1. DROP ALL EXISTING TABLES & TRIGGERS IN CORRECT CASCADE ORDER
DROP TRIGGER IF EXISTS products_updated_at ON products CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS scraping_logs CASCADE;
DROP TABLE IF EXISTS page_hashes CASCADE;
DROP TABLE IF EXISTS scraping_selectors CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS site_visits CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ===================================================
-- 2. CREATE BASE PROJECT TABLES
-- ===================================================

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  original_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  rating DECIMAL(2,1) DEFAULT 4.5,
  source_url TEXT DEFAULT '',
  affiliate_link TEXT NOT NULL DEFAULT '',
  source_platform TEXT DEFAULT 'hepsiburada',
  scarcity_level INT DEFAULT 10,
  social_proof_count INT DEFAULT 0,
  countdown_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  is_featured BOOLEAN DEFAULT FALSE,
  featured_type TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  fingerprint TEXT DEFAULT '',
  specs JSONB DEFAULT '{}',
  comparison_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Visits Table
CREATE TABLE site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  page TEXT DEFAULT '/'
);

-- Site Settings Table
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- 3. CREATE SCRAPING ENGINE V2 TABLES
-- ===================================================

-- Learned Selectors Table
CREATE TABLE scraping_selectors (
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
  last_used_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_platform_selector UNIQUE (platform, selector_type, selector)
);

-- Page Hash Tracker Table
CREATE TABLE page_hashes (
  url TEXT PRIMARY KEY,
  content_hash VARCHAR(64) NOT NULL,
  last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Audit logs Table
CREATE TABLE scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  pipeline_path VARCHAR(100) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT DEFAULT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Price History Table
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- 4. CONFIGURE SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_selectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Products publicly readable" ON products 
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admin can manage products" ON products 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Site Visits Policies
CREATE POLICY "Anyone can log visits" ON site_visits 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Visits readable by public/admin" ON site_visits 
  FOR SELECT TO anon, authenticated USING (true);

-- Site Settings Policies
CREATE POLICY "Settings publicly readable" ON site_settings 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Settings editable by admin" ON site_settings 
  FOR ALL TO anon, authenticated USING (true);

-- Scraping Selectors Policies
CREATE POLICY "Selectors readable by authenticated" ON scraping_selectors 
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Selectors managed by system" ON scraping_selectors 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Page Hashes Policies
CREATE POLICY "Hashes readable" ON page_hashes 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Hashes managed" ON page_hashes 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Scraping Logs Policies
CREATE POLICY "Logs managed by system" ON scraping_logs 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Product Prices Policies
CREATE POLICY "Prices readable by public" ON product_prices 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Prices managed by system" ON product_prices 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ===================================================
-- 5. CREATE AUTOMATIC UPDATED_AT TRIGGER
-- ===================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================================================
-- 6. CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_products_fingerprint ON products(fingerprint);
CREATE INDEX IF NOT EXISTS idx_selectors_platform ON scraping_selectors(platform, is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_prices(product_id, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_platform ON scraping_logs(platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_hashes_url ON page_hashes(url);

-- ===================================================
-- 7. SEED INITIAL DATA
-- ===================================================
INSERT INTO site_settings (key, value) 
VALUES ('marquee_text', '🔥 En büyük indirimler — ⚡ Günlük fırsatlar — 💸 Kaçırılmayacak kampanyalar — ⏳ Fiyatlar anlık değişebilir')
ON CONFLICT (key) DO NOTHING;

-- ===================================================
-- END OF RESET SCHEMA SQL
-- ===================================================
