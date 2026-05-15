import { supabase, Product } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: searchQuery } = await searchParams;

  if (!supabase) return null;

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data } = await query.order("created_at", { ascending: false });
  const products = (data as Product[]) || [];

  return (
    <main className="min-h-screen bg-[#fafafa] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {searchQuery ? (
              <>
                <span className="text-orange-500">"{searchQuery}"</span> Sonuçları
              </>
            ) : (
              <>
                Tüm <span className="text-orange-500">Fırsatlar</span>
              </>
            )}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {searchQuery 
              ? `${products.length} sonuç bulundu` 
              : "En yeni teknoloji fırsatlarını keşfedin"}
          </p>
        </header>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900">Aradığınız kriterlere uygun ürün bulunamadı</h3>
            <p className="text-gray-500 mt-1">Lütfen farklı kelimelerle tekrar deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}