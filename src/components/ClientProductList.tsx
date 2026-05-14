"use client";
import { useState, useEffect } from "react";
import { Product } from "@/lib/supabase";
import ProductCard from "./ProductCard";

import { useSearchParams } from "next/navigation";

export default function ClientProductList({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);

  const normalize = (text: string) => {
    return text
      .toLocaleLowerCase("tr-TR")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9 ]/g, "");
  };

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(initialProducts);
      return;
    }

    const q = normalize(searchQuery);
    const filtered = initialProducts.filter((p) => {
      const title = normalize(p.title);
      const category = normalize(p.category || "");
      const desc = normalize(p.description || "");
      const platform = normalize(p.source_platform || "");
      
      return title.includes(q) || category.includes(q) || desc.includes(q) || platform.includes(q);
    });
    setFilteredProducts(filtered);
  }, [searchQuery, initialProducts]);

  return (
    <section id="products" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center mb-10 text-center w-full">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            {searchQuery ? `"${searchQuery}" için sonuçlar` : "Tüm Fırsatlar"}
          </h2>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
          <div className="text-6xl mb-6 grayscale">🔍</div>
          <h3 className="text-2xl font-black text-gray-800">Üzgünüz, bir şey bulamadık</h3>
          <p className="text-gray-500 mt-3 font-medium max-w-xs mx-auto">Aradığınız kriterlere uygun ürün şu an için mevcut değil. Başka bir kelime deneyebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
