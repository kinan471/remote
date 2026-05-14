"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Product, getDiscountPercent, formatPrice } from "@/lib/supabase";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "featured";
}

const PLATFORM_ICONS: Record<string, string> = {
  trendyol: "🛍️",
  hepsiburada: "🟠",
  amazon: "📦",
};

export default function ProductCard({
  product,
  variant = "default",
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  
  const discount = getDiscountPercent(product.original_price, product.current_price);
  const savings = product.original_price - product.current_price;

  // توليد رقم عشوائي بعد التحميل لتجنب خطأ الـ Hydration
  useEffect(() => {
    setViewerCount(Math.floor(Math.random() * 50) + 15);
  }, []);

  const imgSrc =
    !imgError && product.images?.length > 0
      ? product.images[0]
      : `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800`;

  return (
    <div className={`group relative flex flex-col h-full bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 border border-gray-100 ${variant === "featured" ? "ring-2 ring-orange-500" : ""}`}>
      
      {/* 1. TOP BADGES */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {product.is_lowest_price && (
          <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
            🏆 TÜRKİYE'NİN EN UCUZU
          </div>
        )}
        {discount >= 40 && (
          <div className="bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
             🔥 SÜPER FIRSAT
          </div>
        )}
      </div>

      {/* 2. IMAGE SECTION */}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImgError(true)}
          sizes="(max-width: 640px) 100vw, 300px"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Savings Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-white/50">
           <span className="text-[10px] font-bold text-gray-500">Tasarruf:</span>
           <span className="text-sm font-black text-emerald-600 ml-1">-{formatPrice(savings, product.currency)}</span>
        </div>

        {/* Platform Badge */}
        <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-2xl border border-white/10">
          {PLATFORM_ICONS[product.source_platform.toLowerCase()] || "🔗"} {product.source_platform.toUpperCase()}
        </div>
      </Link>

      {/* 3. CONTENT SECTION */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category.split(">")[0]}</span>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-amber-700 text-[10px] font-bold">{product.rating || "4.8"}</span>
          </div>
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 min-h-[40px] group-hover:text-orange-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 line-through decoration-rose-400/50">{formatPrice(product.original_price, product.currency)}</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">{formatPrice(product.current_price, product.currency)}</span>
          </div>
          <div className="ml-auto bg-orange-100 text-orange-600 font-black text-lg px-3 py-2 rounded-2xl shadow-sm">
            %{discount}
          </div>
        </div>

        {/* SOCIAL PROOF: Fixed Hydration issue */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i + product.id}`} alt="user" />
              </div>
            ))}
          </div>
          {viewerCount > 0 && (
            <p className="text-[10px] text-gray-500 font-medium">
               <span className="text-orange-600 font-bold">+{viewerCount} kişi</span> şu an bu ürüne bakıyor
            </p>
          )}
        </div>

        {/* CTA SECTION */}
        <div className="mt-auto pt-2 flex gap-2">
          <Link 
            href={`/compare?p1=${product.id}`}
            className="flex-1 bg-white text-gray-700 border-2 border-gray-100 text-[11px] font-bold py-4 rounded-2xl text-center hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95"
          >
            Karşılaştır
          </Link>
          <a 
            href={product.affiliate_link || product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-[1.5] bg-orange-600 text-white text-xs font-black py-4 rounded-2xl text-center shadow-[0_10px_20px_rgba(234,88,12,0.3)] hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            HEMEN YAKALA 🚀
          </a>
        </div>
      </div>
    </div>
  );
}
