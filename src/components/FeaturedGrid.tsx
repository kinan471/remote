"use client";
import { Product, formatPrice, getProductImage } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function FeaturedGrid({ products }: { products: Product[] }) {
  // Show all featured products in a sleek horizontal scrolling ribbon
  return (
    <div className="mb-10 mt-2 px-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight uppercase">
          Günün Öne Çıkan Fırsatları
        </h2>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-3 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
        {products.map((p) => {
          const discount = p.original_price > p.current_price 
            ? Math.round(((p.original_price - p.current_price) / p.original_price) * 100) 
            : 0;
            
          return (
            <Link 
              key={p.id} 
              href={`/product/${p.id}`}
              className="group bg-white p-3 rounded-2xl shadow-sm border border-orange-100/60 hover:shadow-md transition-all relative overflow-hidden flex flex-col w-[160px] sm:w-[190px] shrink-0 snap-start"
            >
              <div className="relative aspect-square mb-2.5 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
                <Image 
                  src={getProductImage(p)} 
                  alt={p.title} 
                  fill 
                  className="object-contain p-2.5 group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                
                {/* Compact Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                    -%{discount}
                  </div>
                )}
              </div>

              <h3 className="text-xs font-black text-gray-800 line-clamp-2 leading-tight mb-2 min-h-[32px] group-hover:text-orange-500 transition-colors">
                {p.title}
              </h3>

              <div className="mt-auto">
                <div className="flex flex-col gap-0.5">
                  {discount > 0 && (
                    <span className="text-gray-400 text-[10px] line-through font-bold">
                      {formatPrice(p.original_price, p.currency)}
                    </span>
                  )}
                  <span className="text-orange-600 font-black text-sm">
                    {formatPrice(p.current_price, p.currency)}
                  </span>
                </div>
                
                <div className="mt-2 text-[10px] font-black text-blue-600 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                  Yakala <span>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
