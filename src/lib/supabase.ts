import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  title: string;
  description: string;
  original_price: number;
  current_price: number;
  images: string[];
  category: string; // Hierarchical: "Parent > Child"
  rating: number;
  source_url: string;
  affiliate_link: string;
  source_platform: string;
  scarcity_level: number;
  social_proof_count: number;
  countdown_ends_at: string;
  is_featured: boolean;
  featured_type: "cheapest" | "bestseller" | "expert" | null;
  is_active: boolean;
  click_count: number;
  currency: string;
  specs?: Record<string, string>;
  is_lowest_price?: boolean;
  comparison_data?: any;
  created_at: string;
  updated_at: string;
};

export function getCategoryParts(catStr: string) {
  if (!catStr) return { parent: "Genel", child: null };
  const parts = catStr.split(">").map(s => s.trim());
  return {
    parent: parts[0] || "Genel",
    child: parts[1] || null
  };
}

export function getDiscountPercent(original: number, current: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function formatPrice(price: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}
