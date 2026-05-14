"use client";
import { useEffect, useState } from "react";
import { supabase, Product } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import { useParams } from "next/navigation";

export default function CategoryPage() {
  const params = useParams();
  const name = params?.name as string;
  const categoryName = name ? decodeURIComponent(name) : "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryName) return;
    
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("category", `%${categoryName}%`)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    }
    
    fetchProducts();
  }, [categoryName]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 capitalize tracking-tight">
            {categoryName}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {products.length} ürün bulundu
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900">Bu kategoride ürün bulunamadı</h3>
            <p className="text-gray-500 mt-1">Lütfen daha sonra tekrar kontrol edin.</p>
          </div>
        )}
      </div>
    </main>
  );
}
