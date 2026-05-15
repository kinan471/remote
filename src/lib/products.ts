import { supabase, Product } from "./supabase";

export const DEFAULT_REVALIDATE = 60;

/**
 * Fetch all active products
 */
export async function getActiveProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching active products:", error);
    return [];
  }
  return (data as Product[]) || [];
}

/**
 * Fetch only featured products
 */
export async function getFeaturedProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
  return (data as Product[]) || [];
}

/**
 * Fetch products by category name (partial match)
 */
export async function getProductsByCategory(categoryName: string) {
  if (!supabase || !categoryName) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("category", `%${categoryName}%`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching products for category ${categoryName}:`, error);
    return [];
  }
  return (data as Product[]) || [];
}

/**
 * Search products by title
 */
export async function searchProducts(query: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("title", `%${query}%`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error searching products for query ${query}:`, error);
    return [];
  }
  return (data as Product[]) || [];
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
  return data as Product;
}
