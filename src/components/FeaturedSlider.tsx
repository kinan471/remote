"use client";
import { useState, useEffect } from "react";
import { Product } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function FeaturedSlider({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden sm:rounded-3xl bg-[#EAEDED] mt-6 mb-8 group">
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-full flex-shrink-0 relative aspect-[16/10] sm:aspect-[21/7] overflow-hidden">
            <Image
              src={product.images?.[0] || ""}
              alt={product.title}
              fill
              className="object-cover"
              priority
              quality={100}
              unoptimized
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-6 sm:p-16">
              <div className="max-w-xl">
                <span className="inline-block bg-orange-600 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-sm uppercase tracking-widest mb-2 sm:mb-4">
                  Günün Fırsatı
                </span>
                <h2 className="text-xl sm:text-5xl font-black text-white mb-2 sm:mb-6 leading-tight drop-shadow-lg">
                  {product.title}
                </h2>
                <div className="flex items-center gap-4 mb-4 sm:mb-8">
                  <div className="text-2xl sm:text-4xl font-black text-orange-400">
                    {formatPrice(product.current_price, product.currency)}
                  </div>
                  {product.original_price > product.current_price && (
                    <div className="text-sm sm:text-lg text-white/60 line-through font-bold">
                      {formatPrice(product.original_price, product.currency)}
                    </div>
                  )}
                </div>
                <Link 
                  href={`/product/${product.id}`}
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-md text-sm font-black transition-all shadow-xl active:scale-95"
                >
                  Şimdi Yakala →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={() => setCurrent((prev) => (prev - 1 + products.length) % products.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button 
        onClick={() => setCurrent((prev) => (prev + 1) % products.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      {/* Indicators */}
      {products.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                current === i ? "w-6 bg-orange-500" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(price);
}
