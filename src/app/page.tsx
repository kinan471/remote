import { getFeaturedProducts, getActiveProducts, DEFAULT_REVALIDATE } from "@/lib/products";
import FeaturedSlider from "@/components/FeaturedSlider";
import FeaturedGrid from "@/components/FeaturedGrid";
import ClientProductList from "@/components/ClientProductList";
import Marquee from "@/components/Marquee";
import { Suspense } from "react";

// ISR - revalidate every 60 seconds
export const revalidate = DEFAULT_REVALIDATE;

export default async function HomePage() {
  // Fetch data via Service Layer
  const allProducts = await getActiveProducts();
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="min-h-screen pt-16 sm:pt-16 bg-[#F8F9FA]">
      <Marquee />
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-4">
        
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
            <Suspense fallback={<div className="py-10 text-center font-bold text-gray-400">Yükleniyor...</div>}>
              <ClientProductList initialProducts={allProducts} />
            </Suspense>
          </section>
        </div>

      </div>
    </div>
  );
}
