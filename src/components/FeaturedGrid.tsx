"use client";
import { Product, formatPrice } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function FeaturedGrid({ products }: { products: Product[] }) {
  // Show 4 products in the grid
  const displayProducts = products.slice(0, 4);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-12">
      {displayProducts.map((p) => (
        <Link 
          key={p.id} 
          href={`/product/${p.id}`}
          className="group bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden flex flex-col"
        >
          <h3 className="text-sm sm:text-base font-black text-gray-900 mb-3 line-clamp-2 leading-tight">
            {p.title}
          </h3>
          
          <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-50">
            <Image 
              src={p.images?.[0] || ""} 
              alt={p.title} 
              fill 
              className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
              unoptimized
            />
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-black text-sm sm:text-lg">
                {formatPrice(p.current_price, p.currency)}
              </span>
              {p.original_price > p.current_price && (
                <span className="text-gray-400 text-[10px] sm:text-xs line-through font-bold">
                  {formatPrice(p.original_price, p.currency)}
                </span>
              )}
            </div>
            <div className="mt-3 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
              Hemen Keşfet →
            </div>
          </div>

          {/* Discount Badge */}
          {p.original_price > p.current_price && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg">
              -%{Math.round(((p.original_price - p.current_price) / p.original_price) * 100)}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
