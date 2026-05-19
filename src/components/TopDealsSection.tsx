"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, formatPrice, getDiscountPercent } from "@/lib/supabase";
import { computeDealScore, getSignalClasses, sortByDealScore } from "@/lib/deal-score";

interface TopDealsSectionProps {
  products: Product[];
}

export default function TopDealsSection({ products }: TopDealsSectionProps) {
  const topDeals = useMemo(() => sortByDealScore(products).slice(0, 6), [products]);

  if (topDeals.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-200">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Bugünün En İyi Fırsatları
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Deal Score'a göre sıralanmış — şimdi al kaçırma
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Şimdi Al
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Normal
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Bekle
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topDeals.map((product, index) => {
          const deal = computeDealScore(product);
          const classes = getSignalClasses(deal.signal);
          const discount = getDiscountPercent(product.original_price, product.current_price);
          const isTopDeal = index === 0;

          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className={`
                group relative flex items-center gap-4 p-4 rounded-3xl border
                bg-white hover:shadow-lg transition-all duration-300
                hover:-translate-y-1
                ${isTopDeal ? "ring-2 ring-orange-500 shadow-md shadow-orange-100" : "border-gray-100"}
              `}
            >
              {/* Rank Badge */}
              {index < 3 && (
                <div className={`
                  absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full
                  flex items-center justify-center text-[11px] font-black text-white shadow-md z-10
                  ${index === 0 ? "bg-orange-500" : index === 1 ? "bg-gray-700" : "bg-amber-600"}
                `}>
                  #{index + 1}
                </div>
              )}

              {/* Image */}
              <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📦</div>
                )}
                {discount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-[9px] font-black text-center py-0.5">
                    -%{discount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Signal Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black mb-2 ${classes.badge}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                  {deal.signalLabel}
                </div>

                {/* Title */}
                <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-orange-600 transition-colors">
                  {product.title}
                </p>

                {/* Price + Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-gray-900">
                      {formatPrice(product.current_price, product.currency)}
                    </div>
                    {product.original_price > product.current_price && (
                      <div className="text-[11px] text-gray-400 line-through">
                        {formatPrice(product.original_price, product.currency)}
                      </div>
                    )}
                  </div>

                  {/* Score Circle */}
                  <div className={`
                    flex flex-col items-center justify-center w-12 h-12 rounded-2xl
                    ${classes.bgLight} border ${classes.border}
                  `}>
                    <span className={`text-lg font-black leading-none ${classes.text}`}>
                      {deal.score}
                    </span>
                    <span className={`text-[8px] font-black uppercase ${classes.text} opacity-70`}>
                      score
                    </span>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${classes.bar}`}
                    style={{ width: `${deal.score}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
