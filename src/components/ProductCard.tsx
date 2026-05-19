"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, memo } from "react";
import {
  Product,
  getDiscountPercent,
  formatPrice,
  getProductImage,
} from "@/lib/supabase";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "featured";
}

const ProductCard = memo(function ProductCard({
  product,
  variant = "default",
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isInCompare, setIsInCompare] = useState(false);

  const discount = getDiscountPercent(
    product.original_price || 0,
    product.current_price || 0
  );

  const imgSrc = !imgError
    ? getProductImage(product)
    : `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800`;

  // Check initial compare state on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("yakala_compare_list");
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setIsInCompare(list.some((item: any) => item.id === product.id));
        } catch (e) {}
      }
    }
  });

  // Listen for compare list changes
  useState(() => {
    if (typeof window !== "undefined") {
      const checkCompare = () => {
        const saved = localStorage.getItem("yakala_compare_list");
        if (saved) {
          try {
            const list = JSON.parse(saved);
            setIsInCompare(list.some((item: any) => item.id === product.id));
          } catch (e) {
            setIsInCompare(false);
          }
        } else {
          setIsInCompare(false);
        }
      };
      window.addEventListener("yakala-compare-changed", checkCompare);
      return () => window.removeEventListener("yakala-compare-changed", checkCompare);
    }
  });

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const saved = localStorage.getItem("yakala_compare_list");
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {}
    }

    const exists = list.some((item: any) => item.id === product.id);
    if (exists) {
      list = list.filter((item: any) => item.id !== product.id);
    } else {
      if (list.length >= 3) {
        alert("En fazla 3 ürünü karşılaştırabilirsiniz.");
        return;
      }
      list.push({
        id: product.id,
        title: product.title,
        price: product.current_price,
        original_price: product.original_price,
        image: getProductImage(product),
        source_platform: product.source_platform,
        currency: product.currency || "TRY"
      });
    }

    localStorage.setItem("yakala_compare_list", JSON.stringify(list));
    window.dispatchEvent(new Event("yakala-compare-changed"));
  };

  return (
    <div
      className={`
        group
        relative
        flex
        flex-col
        h-full
        bg-white
        border border-gray-100
        rounded-2xl
        overflow-hidden
        transition-all duration-300
        hover:shadow-lg
        hover:border-orange-200
        ${variant === "featured" ? "ring-2 ring-orange-500 shadow-md" : "shadow-sm"}
      `}
    >
      {/* Invisible link overlay covering the card */}
      <Link
        href={`/product/${product.id}`}
        className="absolute inset-0 z-10"
        aria-label={product.title}
      />

      {/* IMAGE SECTION */}
      <div className="relative aspect-[4/5] w-full bg-white flex items-center justify-center p-4">
        {/* Compare Toggle Button */}
        <button 
          className={`absolute top-2 left-2 z-20 w-7 h-7 rounded-full shadow-sm transition-all duration-300 border flex items-center justify-center active:scale-90 ${
            isInCompare 
              ? "bg-orange-500 text-white border-orange-500 scale-105" 
              : "bg-white/80 text-gray-400 hover:text-orange-500 border-gray-100"
          }`}
          onClick={toggleCompare}
          title="Karşılaştır"
        >
          <span className="text-[11px] font-bold leading-none">⚖️</span>
        </button>

        {/* Top Badges */}
        {discount > 0 && (
          <div className="absolute top-2 left-10 z-20">
            <div className="bg-[#FF6000] text-white text-[9px] font-black px-2 py-1 rounded-full shadow-sm">
              AVANTAJLI
            </div>
          </div>
        )}
        
        {/* Heart Icon (Favorite) */}
        <button 
          className="absolute top-2 right-2 z-20 bg-white p-1.5 rounded-full shadow-sm text-gray-400 hover:text-rose-500 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <Image
          src={imgSrc}
          alt={product.title}
          fill
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
          sizes="(max-width: 640px) 50vw, 250px"
        />
      </div>

      {/* CONTENT SECTION */}
      <div className="flex flex-col flex-1 p-3 border-t border-gray-50">
        {/* TITLE */}
        <h3 className="text-[13px] text-gray-800 leading-snug line-clamp-2 min-h-[38px] group-hover:text-[#FF6000] transition-colors">
          {product.title}
        </h3>

        {/* RATING */}
        {(product.rating > 0 || product.review_count > 0) && (
          <div className="flex items-center gap-1 mt-1 mb-2">
            <span className="text-[#FF6000] text-[12px]">★</span>
            <span className="text-[11px] font-bold text-gray-700">
              {product.rating > 0 ? product.rating.toFixed(1) : ""}
            </span>
            {product.review_count > 0 && (
              <span className="text-[10px] text-gray-400">
                ({product.review_count > 1000
                  ? (product.review_count / 1000).toFixed(1) + "K"
                  : product.review_count})
              </span>
            )}
          </div>
        )}

        <div className="flex-1"></div>

        {/* BOTTOM PRICE ROW */}
        <div className="mt-auto flex justify-between items-end">
          <div className="flex flex-col">
            {discount > 0 && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] text-gray-400 line-through decoration-gray-400">
                  {formatPrice(product.original_price, product.currency)}
                </span>
                <span className="bg-[#00B500] text-white text-[9px] font-bold px-1 rounded-sm">
                  %{discount}
                </span>
              </div>
            )}
            <div className="text-[15px] sm:text-base font-black text-[#00B500]">
              {formatPrice(product.current_price, product.currency)}
            </div>
          </div>
          
          <a
            href={product.affiliate_link || product.source_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-20 text-gray-600 hover:text-[#FF6000] transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;