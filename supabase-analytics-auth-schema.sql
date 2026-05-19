-- ============================================================
-- YAKALA Platform - Analytics, Reviews & Notifications Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ① Page Views
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  referrer text,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ② Product Clicks
CREATE TABLE IF NOT EXISTS product_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_title text,
  click_type text CHECK (click_type IN ('view', 'affiliate', 'compare', 'wishlist', 'price_alert')) DEFAULT 'view',
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ③ Search Queries
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results_count int DEFAULT 0,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ④ Category Interests
CREATE TABLE IF NOT EXISTS category_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ⑤ Platform Reviews (Footer feedback)
CREATE TABLE IF NOT EXISTS platform_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  rating int CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  experience_text text,
  feature_suggestion text,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ⑥ Push Subscriptions (Web Push notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ⑦ Notifications Log
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('price_alert', 'new_product', 'new_deal', 'system')) DEFAULT 'system',
  title text NOT NULL,
  body text NOT NULL,
  url text,
  product_id text,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

-- ⑧ Price Alerts (DB-backed, replacing localStorage)
CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_title text,
  product_image text,
  target_price numeric NOT NULL,
  current_price numeric,
  is_triggered boolean DEFAULT false,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Page views: admin reads all, anyone can insert
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read page_views" ON page_views FOR SELECT USING (true);

-- Product clicks: anyone can insert, admin reads all
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert product_clicks" ON product_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read product_clicks" ON product_clicks FOR SELECT USING (true);

-- Search queries: anyone can insert
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert search_queries" ON search_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read search_queries" ON search_queries FOR SELECT USING (true);

-- Category interests: anyone can insert
ALTER TABLE category_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert category_interests" ON category_interests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read category_interests" ON category_interests FOR SELECT USING (true);

-- Platform reviews: authenticated users insert/update their own, all can read
ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can insert reviews" ON platform_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can update own review" ON platform_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read approved reviews" ON platform_reviews FOR SELECT USING (is_approved = true);

-- Price alerts: users manage their own
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications: users read own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Push subscriptions: users manage own
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs" ON push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_clicks_product ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_created ON product_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_created ON platform_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);
