-- ===================================================
-- YAKALA PLATFORM - ROLE-BASED ACCESS CONTROL (RBAC) & SECURITY UPGRADE
-- Run this script in your Supabase SQL Editor.
-- ===================================================

-- 1. CREATE USER_ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_admin_email CHECK (is_admin = FALSE OR LOWER(email) = 'hallabkinan@gmail.com')
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. CREATE HELPER FUNCTION TO IDENTIFY ADMINS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLICIES FOR USER_ROLES
DROP POLICY IF EXISTS "Admins can view and manage all roles" ON public.user_roles;
CREATE POLICY "Admins can view and manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. UPGRADE RLS POLICIES FOR PRODUCTS TABLE
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. UPGRADE RLS POLICIES FOR SITE SETTINGS TABLE
DROP POLICY IF EXISTS "Settings editable by admin" ON public.site_settings;
CREATE POLICY "Settings editable by admin" ON public.site_settings 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. UPGRADE RLS POLICIES FOR SCRAPING SELECTORS TABLE
DROP POLICY IF EXISTS "Selectors managed by system" ON public.scraping_selectors;
DROP POLICY IF EXISTS "Selectors managed by admin" ON public.scraping_selectors;
CREATE POLICY "Selectors managed by admin" ON public.scraping_selectors 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. UPGRADE RLS POLICIES FOR PAGE HASHES TABLE
DROP POLICY IF EXISTS "Hashes managed" ON public.page_hashes;
DROP POLICY IF EXISTS "Hashes managed by admin" ON public.page_hashes;
CREATE POLICY "Hashes managed by admin" ON public.page_hashes 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. UPGRADE RLS POLICIES FOR SCRAPING LOGS TABLE
DROP POLICY IF EXISTS "Logs managed by system" ON public.scraping_logs;
DROP POLICY IF EXISTS "Logs managed by admin" ON public.scraping_logs;
CREATE POLICY "Logs managed by admin" ON public.scraping_logs 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9. UPGRADE RLS POLICIES FOR PRODUCT PRICES TABLE
DROP POLICY IF EXISTS "Prices managed by system" ON public.product_prices;
DROP POLICY IF EXISTS "Prices managed by admin" ON public.product_prices;
CREATE POLICY "Prices managed by admin" ON public.product_prices 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
