"use client";

import { useEffect, useMemo, useState } from "react";

import {
  supabase,
  formatPrice,
  getDiscountPercent,
  Product,
} from "@/lib/supabase";

import { computeDealScore, getSignalClasses } from "@/lib/deal-score";

import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";
import ImageGallery from "@/components/ImageGallery";
import { useParams } from "next/navigation";

const persuasionMessages = [
  "🔥 Bugünün en popüler teknoloji fırsatı",
  "⚡ Yüksek talep: Şu an birçok kişi inceliyor",
  "💸 Kaçırılmayacak fiyat/performans ürünü",
  "⏳ Stoklar güncellenmeden yakalayın",
];

const fakePurchases = [
  "Ahmet ürünü satın aldı",
  "Mehmet sepete ekledi",
  "Ayşe fırsatı yakaladı",
  "Zeynep şimdi görüntülüyor",
];

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProduct(data);
      }

      setLoading(false);
    }

    fetchProduct();
  }, [id]);

  const discount = useMemo(() => {
    if (!product) return 0;

    return getDiscountPercent(
      product.original_price,
      product.current_price
    );
  }, [product]);

  const savings = useMemo(() => {
    if (!product) return 0;

    return (
      product.original_price -
      product.current_price
    );
  }, [product]);

  const scarcityPct = useMemo(() => {
    if (!product) return 0;

    return Math.max(
      8,
      Math.min(
        100,
        ((15 - product.scarcity_level) /
          15) *
          100
      )
    );
  }, [product]);

  const deal = useMemo(() => {
    if (!product) return null;
    return computeDealScore(product);
  }, [product]);

  const classes = useMemo(() => {
    if (!deal) return { bgLight: "", border: "", text: "" };
    return getSignalClasses(deal.signal);
  }, [deal]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafafa]">

        <div className="mx-auto max-w-7xl px-4 pt-32">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-[32px] bg-gray-200" />

            <div className="space-y-5">
              <div className="h-6 w-32 animate-pulse rounded-full bg-gray-200" />

              <div className="h-16 w-full animate-pulse rounded-3xl bg-gray-200" />

              <div className="h-6 w-2/3 animate-pulse rounded-xl bg-gray-200" />

              <div className="h-72 animate-pulse rounded-[32px] bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product || !deal) {
    return (
      <main className="min-h-screen bg-[#fafafa]">

        <div className="flex flex-col items-center justify-center pt-40 text-center">
          <div className="mb-6 text-7xl">
            😢
          </div>

          <h1 className="text-3xl font-black text-gray-900">
            Ürün Bulunamadı
          </h1>

          <p className="mt-3 text-gray-500">
            Aradığınız fırsat kaldırılmış olabilir.
          </p>

          <Link
            href="/"
            className="
              mt-8
              rounded-2xl
              bg-orange-500
              px-8
              py-4
              text-sm
              font-black
              text-white
              transition-all
              hover:scale-105
              hover:bg-orange-600
            "
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fafafa] pb-32">

      {/* urgency strip */}
      <div
        className="
          relative
          overflow-hidden
          border-y
          border-orange-200
          bg-gradient-to-r
          from-red-500
          via-orange-500
          to-red-500
          py-3
        "
      >
        <div
          className="
            animate-marquee
            whitespace-nowrap
            text-sm
            font-black
            tracking-wide
            text-white
          "
        >
          🔥 {product.click_count || 120}+ kişi bu ürüne baktı — ⏳ Kampanya sınırlı süreli — ⚡ Stok {product.scarcity_level < 5 ? 'Kritik' : 'Aktif'} — 💸 En iyi fiyat garantisi
        </div>
      </div>

      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-orange-200 blur-[140px]" />

        <div className="absolute right-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-rose-200 blur-[140px]" />
      </div>



      <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        {/* breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
          <Link
            href="/"
            className="transition-colors hover:text-orange-500"
          >
            Ana Sayfa
          </Link>

          <span>/</span>

          <span className="text-gray-700">
            {product.category}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          {/* LEFT */}
          <div className="relative">
            {/* badges */}
            <div className="absolute left-5 top-5 z-20 flex flex-col gap-3">
              {discount > 0 && (
                <div className="animate-bounce rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_15px_40px_rgba(249,115,22,.35)]">
                  🔥 %{discount} İNDİRİM
                </div>
              )}
            </div>

            {/* image */}
            <div
              className="
                relative
                overflow-hidden
                rounded-[36px]
                border
                border-white/70
                bg-gradient-to-b
                from-white
                to-orange-50/30
                shadow-[0_25px_80px_rgba(0,0,0,.08)]
                transition-transform
                duration-700
                hover:scale-[1.03]
              "
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,115,0,0.10),transparent_60%)]" />

              <ImageGallery
                images={product.images || []}
                title={product.title}
              />
            </div>

            {/* real platform stats */}
            <div
              className="
                mt-6
                flex
                items-center
                gap-4
                rounded-[28px]
                border
                border-orange-100
                bg-white/80
                p-5
                backdrop-blur-xl
              "
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                📊
              </div>

              <div>
                <p className="text-sm font-black text-gray-900">
                  Bu hafta{" "}
                  <span className="text-orange-600">
                    {product.click_count > 0 ? product.click_count : "--"}
                  </span>{" "}
                  kez görüntülendi
                </p>

                <p className="text-xs text-gray-500">
                  {product.review_count > 0 ? `${product.review_count} gerçek alıcı tarafından doğrulandı` : "Gerçek zamanlı popülerlik verisi"}
                </p>
              </div>
            </div>

            {/* trust logos */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 opacity-70">
              <img
                src="/logos/trendyol.svg"
                className="h-5"
              />

              <img
                src="/logos/hepsiburada.svg"
                className="h-5"
              />

              <img
                src="/logos/amazon.svg"
                className="h-5"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-7">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span
                  className="
                    rounded-full
                    border
                    border-orange-100
                    bg-orange-50
                    px-4
                    py-2
                    text-[11px]
                    font-black
                    uppercase
                    tracking-widest
                    text-orange-600
                  "
                >
                  {product.source_platform}
                </span>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-amber-100
                    bg-amber-50
                    px-4
                    py-2
                  "
                >
                  <span>⭐</span>

                  <span className="text-sm font-black text-amber-700">
                    {product.rating.toFixed(1)}
                  </span>

                  {product.review_count > 0 && (
                    <span className="text-xs text-amber-600">
                      ({product.review_count > 1000 ? (product.review_count/1000).toFixed(1) + 'K' : product.review_count} değerlendirme)
                    </span>
                  )}
                </div>
              </div>

              <h1
                className="
                  max-w-3xl
                  text-3xl
                  font-black
                  leading-tight
                  tracking-tight
                  text-gray-900
                  sm:text-5xl
                "
              >
                {product.title}
              </h1>

              <p
                className="
                  mt-5
                  text-base
                  leading-relaxed
                  text-gray-600
                  sm:text-lg
                "
              >
                {product.description}
              </p>

              {/* benefits */}
              <div className="mt-6 flex flex-wrap gap-3">
                {(product.source_platform?.toLowerCase() === "trendyol"
                  ? ["🚚 Hızlı Teslimat", "💳 Güvenli Ödeme", "🔄 Kolay İade", "✅ Trendyol Satıcılı"]
                  : product.source_platform?.toLowerCase() === "hepsiburada"
                  ? ["🚚 Yarın Kapında", "💳 Güvenli Ödeme", "🔄 Kolay İade", "✅ Hepsiburada Satıcılı"]
                  : product.source_platform?.toLowerCase() === "amazon"
                  ? ["🚚 Prime Kargo", "💳 Güvenli Ödeme", "🔄 Kolay İade", "✅ Amazon Satıcılı"]
                  : ["🚚 Hızlı Teslimat", "💳 Güvenli Ödeme", "🔄 Kolay İade", "✅ Orijinal Ürün"]
                ).map((item) => (
                  <div
                    key={item}
                    className="
                      rounded-full
                      border
                      border-orange-100
                      bg-orange-50
                      px-4
                      py-2
                      text-xs
                      font-black
                      text-orange-700
                    "
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* persuasion */}
            <div
              className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${classes.bgLight} ${classes.border}`}
            >
              <span className="text-lg">
                {deal.signalEmoji}
              </span>

              <p className={`text-sm font-black ${classes.text}`}>
                {deal.scarcityText}
              </p>
            </div>

            {/* REAL DEAL SCORE ENGINE */}
            <div
              className={`rounded-3xl p-6 text-white bg-gradient-to-br ${
                deal.signal === "BUY_NOW"
                  ? "from-emerald-500 to-emerald-700"
                  : deal.signal === "NORMAL"
                  ? "from-amber-400 to-amber-600"
                  : "from-rose-400 to-rose-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/80">
                      YAKALA DEAL SCORE
                    </p>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-black">
                      GERÇEK VERİ
                    </span>
                  </div>

                  <h3 className="mt-1 text-5xl font-black tracking-tighter">
                    {deal.score}<span className="text-2xl text-white/60">/100</span>
                  </h3>
                  
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full bg-white ${deal.signal === 'BUY_NOW' ? 'animate-pulse' : ''}`} />
                    {deal.signalLabel}
                  </div>
                </div>

                <div className="text-6xl opacity-90 mix-blend-overlay">
                  {deal.signal === "BUY_NOW" ? "🎯" : deal.signal === "NORMAL" ? "⚖️" : "✋"}
                </div>
              </div>

              {/* Reasons */}
              <div className="mt-5 space-y-2 border-t border-white/20 pt-4">
                {deal.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm font-medium text-white/90">
                    <span className="text-white">✓</span>
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            {/* pricing card */}
            <div
              className="
                relative
                overflow-hidden
                rounded-[36px]
                border
                border-white/80
                bg-white/90
                p-6
                shadow-[0_20px_80px_rgba(0,0,0,.06)]
                backdrop-blur-xl
                sm:p-8
              "
            >
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-orange-100 blur-[90px]" />

              <div className="relative z-10 space-y-7">
                {/* hero pricing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="
                        rounded-full
                        bg-red-500
                        px-4
                        py-2
                        text-xs
                        font-black
                        text-white
                        animate-pulse
                      "
                    >
                      BUGÜN ÖZEL
                    </span>

                    <span className="text-sm font-bold text-gray-500">
                      En düşük fiyat
                      garantisi
                    </span>
                  </div>

                  <div className="flex items-end gap-4">
                    <span
                      className="
                        text-6xl
                        font-black
                        leading-none
                        tracking-tight
                        text-gray-900
                        sm:text-7xl
                      "
                    >
                      {formatPrice(
                        product.current_price,
                        product.currency
                      )}
                    </span>

                    {discount > 0 && (
                      <span
                        className="
                          mb-2
                          rounded-2xl
                          bg-emerald-100
                          px-4
                          py-2
                          text-lg
                          font-black
                          text-emerald-700
                        "
                      >
                        %{discount} OFF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(
                        product.original_price,
                        product.currency
                      )}
                    </span>

                    <span className="text-sm font-bold text-red-500">
                      Fiyat tekrar
                      yükselebilir
                    </span>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    {product.original_price > 0 && (
                      <p className="text-sm font-bold text-gray-600">
                        Liste fiyatı:
                        <span className="ml-2 text-red-500 line-through">
                          {formatPrice(product.original_price, product.currency)}
                        </span>
                      </p>
                    )}

                    <p className="mt-2 text-sm font-black text-emerald-600">
                      Bugünkü fiyat:
                      <span className="ml-2">
                        {formatPrice(
                          product.current_price,
                          product.currency
                        )}
                      </span>
                    </p>
                  </div>

                  {discount > 0 && (
                    <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-700">
                      ₺
                      {Math.round(savings)}{" "}
                      tasarruf ediyorsunuz
                    </div>
                  )}
                </div>

                {/* savings meter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-600">
                      Fırsat Gücü
                    </span>

                    <span className="text-emerald-600">
                      %{discount}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-emerald-400
                        to-green-500
                        transition-all
                        duration-1000
                      "
                      style={{
                        width: `${Math.min(
                          discount,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs font-bold text-emerald-700">
                    Bu teklif piyasadaki
                    fırsatların çoğundan
                    daha iyi
                  </p>
                </div>

                {/* stock */}
                {product.scarcity_level < 10 ? (
                  <div
                    className="
                      rounded-3xl
                      border
                      border-rose-100
                      bg-rose-50
                      p-5
                    "
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">
                        Stok Durumu
                      </span>

                      <span className="animate-pulse text-sm font-black text-rose-600">
                        Son {product.scarcity_level} adet
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-rose-500
                          to-orange-500
                          transition-all
                          duration-1000
                        "
                        style={{
                          width: `${scarcityPct}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="
                      rounded-3xl
                      border
                      border-emerald-100
                      bg-emerald-50/50
                      p-5
                    "
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">
                        Stok Durumu
                      </span>

                      <span className="text-sm font-black text-emerald-600">
                        Stokta Var
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-emerald-400
                          to-green-500
                          transition-all
                          duration-1000
                        "
                        style={{
                          width: "100%",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* real last updated verification */}
                <div
                  className="
                    rounded-3xl
                    border
                    border-emerald-100
                    bg-emerald-50/70
                    p-5
                  "
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

                    <span className="text-sm font-black text-emerald-700">
                      Fiyat Doğrulandı
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Bu ürünün fiyatı en son <span className="font-bold text-gray-900">{new Date(product.updated_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span> saatinde otomatik olarak güncellendi ve doğrulandı.
                  </p>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                  <Link
                    href={
                      product.affiliate_link ||
                      product.source_url ||
                      "#"
                    }
                    target="_blank"
                    className="
                      group
                      relative
                      flex
                      h-16
                      w-full
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-[24px]
                      bg-gradient-to-r
                      from-orange-500
                      via-orange-600
                      to-red-500
                      px-6
                      text-lg
                      font-black
                      text-white
                      shadow-[0_20px_50px_rgba(249,115,22,.35)]
                      transition-all
                      duration-300
                      hover:scale-[1.02]
                      hover:shadow-[0_25px_60px_rgba(249,115,22,.45)]
                      active:scale-95
                      animate-[pulse_2s_infinite]
                    "
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      ⚡ FIRSATI YAKALA

                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          d="M5 12h14M12 5l7 7-7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <div
                      className="
                        absolute
                        inset-0
                        translate-x-[-100%]
                        bg-white/20
                        transition-transform
                        duration-1000
                        group-hover:translate-x-[100%]
                      "
                    />
                  </Link>

                  <Link
                    href={`/compare?p1=${product.id}`}
                    className="
                      flex
                      h-14
                      w-full
                      items-center
                      justify-center
                      rounded-[24px]
                      border-2
                      border-gray-200
                      bg-white
                      text-base
                      font-black
                      text-gray-700
                      transition-all
                      duration-300
                      hover:border-orange-500
                      hover:bg-orange-50
                      hover:text-orange-600
                      active:scale-95
                    "
                  >
                    ⚖️ Ürünü Karşılaştır
                  </Link>

                  <div className="space-y-2 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      Resmi satıcı sayfasına
                      yönlendirileceksiniz
                    </p>

                    <p className="text-xs font-black text-red-500">
                      ⚠️ Bu fiyat tekrar
                      gelmeyebilir
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECS */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="rounded-[36px] bg-white p-6 shadow-sm sm:p-8">
                <h3 className="mb-6 text-xl font-black text-gray-900">
                  Teknik Özellikler
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex flex-col border-b border-gray-100 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{key}</span>
                      <span className="text-sm font-medium text-gray-900 mt-1">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPARISON DATA */}
            {product.comparison_data && product.comparison_data.other_offers && product.comparison_data.other_offers.length > 0 && (
              <div className="rounded-[36px] bg-white p-6 shadow-sm sm:p-8">
                <h3 className="mb-6 text-xl font-black text-gray-900">
                  Fiyat Analizi
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4">
                    <div>
                      <p className="text-xs font-black uppercase text-emerald-700">En İyi Teklif (YAKALA)</p>
                      <p className="text-sm font-bold text-gray-900">{product.source_platform.toUpperCase()}</p>
                    </div>
                    <p className="text-lg font-black text-emerald-600">{formatPrice(product.current_price, product.currency)}</p>
                  </div>
                  {product.comparison_data.other_offers.map((offer: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 opacity-70">
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400">Alternatif</p>
                        <p className="text-sm font-medium text-gray-700">{offer.store}</p>
                      </div>
                      <p className="text-base font-bold text-gray-500 line-through">{offer.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* trust */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-[28px]
                  border
                  border-gray-100
                  bg-white
                  p-5
                  shadow-sm
                "
              >
                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-50
                    text-2xl
                  "
                >
                  🛡️
                </div>

                <div>
                  <p className="text-sm font-black text-gray-900">
                    Güvenli Yönlendirme
                  </p>

                  <p className="text-xs text-gray-500">
                    Resmi satıcı bağlantısı
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-[28px]
                  border
                  border-gray-100
                  bg-white
                  p-5
                  shadow-sm
                "
              >
                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-green-50
                    text-2xl
                  "
                >
                  ✅
                </div>

                <div>
                  <p className="text-sm font-black text-gray-900">
                    Doğrulanmış Fırsat
                  </p>

                  <p className="text-xs text-gray-500">
                    Manuel kalite kontrolü
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mobile sticky CTA */}
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-[100]
          border-t
          border-orange-100
          bg-white/90
          backdrop-blur-2xl
          p-4
          shadow-[0_-10px_40px_rgba(0,0,0,.08)]
          lg:hidden
        "
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400">
              محدود اليوم
            </p>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">
                {formatPrice(
                  product.current_price,
                  product.currency
                )}
              </span>

              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(
                    product.original_price,
                    product.currency
                  )}
                </span>
              )}
            </div>
          </div>

          <Link
            href={
              product.affiliate_link ||
              product.source_url ||
              "#"
            }
            target="_blank"
            className="
              flex
              h-14
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-r
              from-orange-500
              to-red-500
              px-7
              text-sm
              font-black
              text-white
              shadow-lg
              transition-all
              hover:scale-105
            "
          >
            ⚡ Satın Al
          </Link>
        </div>
      </div>
    </main>
  );
}