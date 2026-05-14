-- =============================================
-- YAKALA PLATFORM - DATABASE SETUP
-- Run this in Supabase SQL Editor
-- Project: vvxuahkmbzucccztbvod
-- =============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
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
  source_platform TEXT DEFAULT 'trendyol',
  scarcity_level INT DEFAULT 10,
  social_proof_count INT DEFAULT 0,
  countdown_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  is_featured BOOLEAN DEFAULT FALSE,
  featured_type TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site visits table
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  page TEXT DEFAULT '/'
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- Public read policy for products
DROP POLICY IF EXISTS "Products publicly readable" ON products;
CREATE POLICY "Products publicly readable" ON products
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Admin write policy
DROP POLICY IF EXISTS "Admin can manage products" ON products;
CREATE POLICY "Admin can manage products" ON products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Visits policies
DROP POLICY IF EXISTS "Anyone can log visits" ON site_visits;
CREATE POLICY "Anyone can log visits" ON site_visits
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Visits readable" ON site_visits;
CREATE POLICY "Visits readable" ON site_visits
  FOR SELECT TO anon, authenticated USING (true);

-- Auto updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- END OF SCHEMA
-- =============================================
