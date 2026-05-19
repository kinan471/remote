import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialize with a check to prevent hanging if variables are missing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; 

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
  review_count: number;
  specs?: Record<string, string>;
  is_lowest_price?: boolean;
  comparison_data?: any;
  image_url?: string;
  price_history?: Array<{ price: number; scraped_at: string }>;
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function cleanImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.png";

  if (url.startsWith("data:") || url.includes("supabase.co/storage")) {
    return url;
  }

  // 1. Hepsiburada
  if (url.includes("hepsiburada.net")) {
    return url.replace(/\/(\d+-\d+)\//, "/1000-1414/");
  }

  // 2. Trendyol
  if (url.includes("dsmcdn.com")) {
    return url.replace(/\/mnresize\/[^/]+\/[^/]+\//, "/");
  }

  // 3. Amazon
  if (url.includes("media-amazon.com") || url.includes("images-amazon.com")) {
    return url.replace(/\._[A-Z0-9_,-]+\./i, ".");
  }

  return url;
}

export function getProductImage(product: Product | null | undefined): string {
  if (!product) return "/placeholder.png";
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
    return cleanImageUrl(product.images[0]);
  }
  if (product.image_url) {
    return cleanImageUrl(product.image_url);
  }
  return "/placeholder.png";
}

export function getProductGalleryImages(product: Product | null | undefined): string[] {
  if (!product) return ["/placeholder.png"];
  
  const list: string[] = [];
  
  // Add main image_url first if it exists
  if (product.image_url) {
    list.push(cleanImageUrl(product.image_url));
  }
  
  // Add other images
  if (Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (img) {
        const cleaned = cleanImageUrl(img);
        if (!list.includes(cleaned)) {
          list.push(cleaned);
        }
      }
    });
  }
  
  return list.length > 0 ? list : ["/placeholder.png"];
}
