"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, memo } from "react";
import {
  Product,
  getDiscountPercent,
  formatPrice,
} from "@/lib/supabase";
import { computeDealScore, getSignalClasses } from "@/lib/deal-score";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "featured";
}

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  trendyol: {
    label: "Trendyol",
    color: "from-[#F27A1A] to-orange-600",
    icon: "🧡",
  },
  hepsiburada: {
    label: "Hepsiburada",
    color: "from-[#FF6000] to-orange-700",
    icon: "🟠",
  },
  amazon: {
    label: "Amazon",
    color: "from-[#232F3E] to-black",
    icon: "📦",
  },
};

const persuasionMessages = [
  "🔥 Bugün en çok ilgi gören ürünlerden",
  "⚡ Popüler Seçim: Teknoloji meraklıları inceliyor",
  "💸 Fiyat/Performans dengesi çok yüksek",
  "⏳ Fırsat sona ermeden göz atın",
];

const ProductCard = memo(function ProductCard({
  product,
  variant = "default",
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const discount = getDiscountPercent(
    product.original_price || 0,
    product.current_price || 0
  );

  const savings =
    (product.original_price || 0) -
    (product.current_price || 0);

  // Compute deal score once per render
  const deal = useMemo(() => computeDealScore(product), [product]);
  const classes = useMemo(() => getSignalClasses(deal.signal), [deal.signal]);

  const platform =
    PLATFORM_CONFIG[
      product.source_platform?.toLowerCase()
    ] || {
      label: product.source_platform || "Mağaza",
      color: "from-gray-700 to-gray-900",
      icon: "🔗",
    };

  const imgSrc =
    !imgError && product.images?.length > 0
      ? product.images[0]
      : `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800`;

  return (
    <div
      className={`
        group
        relative
        flex
        flex-col
        h-full
        overflow-hidden
        rounded-[28px]
        border border-orange-100/60
        bg-gradient-to-b from-white via-white to-orange-50/40
        shadow-[0_10px_40px_rgba(0,0,0,0.04)]
        transition-all duration-500 ease-out
        hover:-translate-y-3
        hover:rotate-[0.3deg]
        hover:shadow-[0_25px_70px_rgba(249,115,22,0.18)]
        ${
          variant === "featured"
            ? "ring-2 ring-orange-500"
            : ""
        }
      `}
    >
      {/* Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_top,rgba(255,115,0,0.12),transparent_60%)] pointer-events-none" />

      {/* TOP BADGES */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
        {product.is_lowest_price && (
          <div className="animate-pulse rounded-full bg-emerald-500 px-4 py-2 text-[10px] font-black text-white shadow-xl">
            🏆 TÜRKİYE'NİN EN UCUZU
          </div>
        )}

        {discount >= 40 && (
          <div className="rounded-full bg-rose-600 px-4 py-2 text-[10px] font-black text-white shadow-lg">
            🔥 SÜPER FIRSAT
          </div>
        )}
      </div>

      {/* PLATFORM RATING - Real rating badge */}
      {product.rating > 0 && (
        <div className="absolute top-3 right-3 z-30">
          <div className="rounded-full bg-black/80 backdrop-blur-md px-3 py-1.5 text-[10px] font-black text-white shadow-xl">
            ⭐ {product.rating.toFixed(1)}
          </div>
        </div>
      )}

      {/* IMAGE */}
      <Link
        href={`/product/${product.id}`}
        className="
          relative
          aspect-square
          overflow-hidden
          bg-gradient-to-b
          from-gray-50
          to-orange-50/30
          flex
          items-center
          justify-center
        "
      >
        {/* shine */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10" />

        <Image
          src={imgSrc}
          alt={product.title}
          fill
          className="
            object-contain
            p-7
            transition-all
            duration-700
            group-hover:scale-110
            group-hover:rotate-1
          "
          onError={() => setImgError(true)}
          sizes="(max-width: 640px) 100vw, 300px"
          priority={variant === "featured"}
        />

        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Link>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 gap-3">
        {/* PLATFORM + RATING */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 max-w-[70%] truncate">
            <div
              className={`h-2 w-2 rounded-full bg-gradient-to-r ${platform.color}`}
            />

            <span className="truncate text-[11px] font-black uppercase tracking-widest text-gray-500">
              {platform.icon} {platform.label}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 shrink-0">
            <span>⭐</span>

            <span className="text-xs font-black text-amber-700">
              {product.rating || "4.5"}
            </span>

            {product.review_count > 0 && (
              <span className="text-[10px] text-amber-600">
                ({product.review_count > 1000 ? (product.review_count/1000).toFixed(1) + 'K' : product.review_count})
              </span>
            )}
          </div>
        </div>

        {/* BUY SIGNAL BADGE - The Decision Engine */}
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black ${classes.badge} mb-0.5`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-white/70 ${deal.signal === 'BUY_NOW' ? 'animate-pulse' : ''}`} />
          {deal.signalEmoji} {deal.signalLabel}
        </div>

        {/* TITLE */}
        <Link href={`/product/${product.id}`}>
          <h3 className="
            min-h-[40px]
            text-[13px]
            sm:text-[14px]
            leading-snug
            font-black
            text-gray-800
            line-clamp-2
            transition-colors
            group-hover:text-orange-600
          ">
            {product.title}
          </h3>
        </Link>



        {/* PRICE */}
        <div className="space-y-2">
          {discount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-gray-400 line-through decoration-rose-400">
                {formatPrice(
                  product.original_price,
                  product.currency
                )}
              </span>

              <div className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-600">
                -%{discount}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
              {formatPrice(
                product.current_price,
                product.currency
              )}
            </span>

            {discount > 0 && (
              <div className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                ₺{Math.round(savings)} TASARRUF
              </div>
            )}
          </div>

        </div>

        {/* REAL CLICK COUNT - only show if we have real data */}
        {product.click_count > 0 && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs">👁️</span>
            <p className="text-[11px] font-bold text-gray-500">
              Bu hafta <span className="text-orange-600 font-black">{product.click_count}</span> kez görüntülendi
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto flex flex-col gap-1.5 pt-2">
          {/* View Details Button */}
          <Link
            href={`/product/${product.id}`}
            className="w-full text-center py-1 text-[10px] sm:text-[11px] font-bold text-gray-500 hover:text-orange-600 transition-colors"
          >
            Ürün Detayları
          </Link>
          
          <div className="flex gap-2">
            {/* Compare Button - shows text on all screens */}
            <Link
              href={`/compare?p1=${product.id}`}
              className="
                flex
                h-9 sm:h-10
                flex-1
                items-center
                justify-center
                rounded-xl
                border-2
                border-gray-100
                bg-white
                text-[10px] sm:text-xs
                font-black
                text-gray-700
                transition-all duration-300
                hover:border-orange-500
                hover:bg-orange-50
                hover:text-orange-600
                active:scale-95
              "
            >
              Karşılaştır
            </Link>

            {/* CTA BUTTON */}
            <a
              href={product.affiliate_link || product.source_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="
                relative
                overflow-hidden
                flex-[1.5]
                h-9 sm:h-10
                rounded-xl
                bg-gradient-to-r
                from-orange-500
                via-orange-600
                to-red-500
                px-4
                text-white
                shadow-[0_12px_30px_rgba(249,115,22,.30)]
                transition-all
                duration-300
                hover:scale-[1.02]
                hover:shadow-[0_18px_40px_rgba(249,115,22,.45)]
                active:scale-95
                flex
                items-center
                justify-center
                group
              "
            >
              <span className="relative z-10 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-black">
                YAKALA
              </span>

              {/* shine animation */}
              <div className="
                absolute inset-0
                translate-x-[-100%]
                bg-white/20
                transition-transform
                duration-1000
                group-hover:translate-x-[100%]
              " />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;