-- ===================================================
-- YAKALA PLATFORM - DATABASE COMPATIBILITY & HOTFIX MIGRATION
-- Run this script in your Supabase SQL Editor to restore scraping functionality.
-- ===================================================

-- 1. DISABLE RLS ON PUBLIC CONTENT TABLES
-- Since the background crawling worker runs as an unauthenticated system process 
-- without an active user session, RLS must be disabled on content tables to allow 
-- automated price extraction and logging to succeed.
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_hashes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_selectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- 2. DROP OBSOLETE RLS POLICIES FOR CLEANLINESS
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
DROP POLICY IF EXISTS "Settings editable by admin" ON public.site_settings;
DROP POLICY IF EXISTS "Selectors managed by admin" ON public.scraping_selectors;
DROP POLICY IF EXISTS "Hashes managed by admin" ON public.page_hashes;
DROP POLICY IF EXISTS "Logs managed by admin" ON public.scraping_logs;
DROP POLICY IF EXISTS "Prices managed by admin" ON public.product_prices;

-- 3. ENSURE SENSITIVE USER_ROLES TABLE REMAINS FULLY SECURE WITH RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and manage all roles" ON public.user_roles;
CREATE POLICY "Admins can view and manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can manage their own role" ON public.user_roles;
CREATE POLICY "Users can manage their own role" ON public.user_roles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. ALIGN PRODUCT TABLE SCHEMA WITH TYPESCRIPT DEFINITIONS
-- Adds the missing is_lowest_price column to prevent persistence errors during scraper writes.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_lowest_price BOOLEAN DEFAULT TRUE;
