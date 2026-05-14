import { supabase, Product } from "@/lib/supabase";
import FeaturedSlider from "@/components/FeaturedSlider";
import FeaturedGrid from "@/components/FeaturedGrid";
import ClientProductList from "@/components/ClientProductList";
import Link from "next/link";
import { Suspense } from "react";

// ISR - revalidate every 60 seconds
export const revalidate = 60;

const CATCH_CONFIG = {
  cheapest:   { label: "En Uygun",    icon: "💰", color: "from-green-600 to-emerald-500",  desc: "En düşük fiyat garantisi" },
  bestseller: { label: "Çok Satılan", icon: "🏆", color: "from-yellow-600 to-amber-500",   desc: "En çok tercih edilen ürün" },
  expert:     { label: "Uzman Seçimi",icon: "⭐", color: "from-purple-600 to-violet-500",  desc: "Editörlerimizin tavsiyesi" },
};

async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products fetch error:", error);
    return [];
  }
  return (data as Product[]) || [];
}

export default async function HomePage() {
  const allProducts = await getProducts();
  const featuredProducts = allProducts.filter((p) => p.is_featured);

  return (
    <div className="min-h-screen pt-24 sm:pt-28 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        
        {/* ========== FEATURED SLIDER (Banner) ========== */}
        {featuredProducts.length > 0 && (
          <FeaturedSlider products={featuredProducts} />
        )}

        <div className="px-4 sm:px-0">
          {/* ========== FEATURED GRID (4 Squares) ========== */}
          {featuredProducts.length > 0 && (
            <FeaturedGrid products={featuredProducts} />
          )}

          {/* ========== PRODUCT LIST WITH SEARCH ========== */}
          <section id="products">
            <Suspense fallback={<div className="py-20 text-center font-bold text-gray-400">Yükleniyor...</div>}>
              <ClientProductList initialProducts={allProducts} />
            </Suspense>
          </section>
        </div>

      </div>
    </div>
  );
}
