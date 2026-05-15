"use client";

import { useEffect, useMemo, useState } from "react";

import {
  supabase,
  formatPrice,
  getDiscountPercent,
  Product,
} from "@/lib/supabase";

import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";
import ImageGallery from "@/components/ImageGallery";
import { useParams } from "next/navigation";

const persuasionMessages = [
  "🔥 Bugün en çok görüntülenen fırsat",
  "⚡ Son 1 saatte 27 kişi satın aldı",
  "💸 Fiyat düşüşü az önce gerçekleşti",
  "⏳ Stok hızla tükeniyor",
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

  const [liveViewers, setLiveViewers] =
    useState(0);

  const [persuasionText, setPersuasionText] =
    useState("");

  const [activity, setActivity] =
    useState("");

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

    setLiveViewers(
      Math.floor(Math.random() * 70) + 20
    );

    setPersuasionText(
      persuasionMessages[
        Math.floor(
          Math.random() *
            persuasionMessages.length
        )
      ]
    );
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivity(
        fakePurchases[
          Math.floor(
            Math.random() *
              fakePurchases.length
          )
        ]
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

  if (!product) {
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
      <Navbar />

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
          🔥 Son 24 saatte 312 sipariş
          verildi — ⏳ Kampanya bugün
          bitiyor — ⚡ Stok kritik
          seviyede — 💸 Fiyat tekrar
          yükselebilir
        </div>
      </div>

      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-orange-200 blur-[140px]" />

        <div className="absolute right-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-rose-200 blur-[140px]" />
      </div>

      {/* floating activity */}
      <div
        className="
          fixed
          bottom-24
          left-4
          z-50
          rounded-2xl
          border
          border-white/60
          bg-white/90
          px-4
          py-3
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <p className="text-xs font-black text-gray-800">
          🔥 {activity}
        </p>

        <p className="mt-1 text-[10px] text-gray-500">
          birkaç saniye önce
        </p>
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

              <div className="rounded-2xl bg-black/80 px-4 py-2 text-[11px] font-black text-white backdrop-blur-md">
                ⚡ TREND SCORE 9.8
              </div>
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

            {/* social proof */}
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
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="
                      h-10
                      w-10
                      overflow-hidden
                      rounded-full
                      border-2
                      border-white
                      shadow-md
                    "
                  >
                    <img
                      src={`https://i.pravatar.cc/150?u=${i}`}
                      alt="user"
                    />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-black text-gray-900">
                  <span className="text-orange-600">
                    {
                      product.social_proof_count
                    }
                    +
                  </span>{" "}
                  kişi bu fırsatı
                  inceliyor
                </p>

                <p className="text-xs text-gray-500">
                  Gerçek zamanlı kullanıcı
                  aktivitesi
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

                  <span className="text-xs text-amber-600">
                    (2.1K değerlendirme)
                  </span>
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
                {[
                  "🚚 Hızlı Teslimat",
                  "💳 Güvenli Ödeme",
                  "🔄 Kolay İade",
                  "⭐ Trend Ürün",
                ].map((item) => (
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
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-orange-100
                bg-gradient-to-r
                from-orange-50
                to-rose-50
                px-5
                py-4
              "
            >
              <span className="text-lg">
                ⚡
              </span>

              <p className="text-sm font-black text-orange-700">
                {persuasionText}
              </p>
            </div>

            {/* ai score */}
            <div
              className="
                rounded-3xl
                bg-gradient-to-r
                from-violet-500
                to-fuchsia-500
                p-5
                text-white
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase">
                    AI DEAL SCORE
                  </p>

                  <h3 className="mt-2 text-3xl font-black">
                    9.8 / 10
                  </h3>
                </div>

                <div className="text-5xl">
                  🤖
                </div>
              </div>

              <p className="mt-4 text-sm text-white/90">
                Yapay zekâ bu fırsatı son
                30 günün en güçlü
                tekliflerinden biri olarak
                analiz etti.
              </p>
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
                    <p className="text-sm font-bold text-gray-600">
                      Piyasa fiyatı:
                      <span className="ml-2 text-red-500 line-through">
                        ₺
                        {Math.round(
                          product.original_price +
                            700
                        )}
                      </span>
                    </p>

                    <p className="mt-2 text-sm font-black text-emerald-600">
                      Bugünkü fırsat:
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
                      Son{" "}
                      {
                        product.scarcity_level
                      }{" "}
                      adet
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

                {/* countdown */}
                <div
                  className="
                    rounded-3xl
                    border
                    border-orange-100
                    bg-orange-50/70
                    p-5
                  "
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="animate-pulse text-red-500">
                      ●
                    </span>

                    <span className="text-sm font-black text-orange-700">
                      Kampanya bitiyor
                    </span>
                  </div>

                  <CountdownTimer
                    endsAt={
                      product.countdown_ends_at
                    }
                  />
                </div>

                {/* viewers */}
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-orange-100
                    bg-orange-50
                    px-4
                    py-4
                  "
                >
                  <span className="text-orange-500">
                    👀
                  </span>

                  <p className="text-sm font-bold text-gray-700">
                    Şu anda{" "}
                    <span className="text-orange-600">
                      {liveViewers} kişi
                    </span>{" "}
                    bu ürünü inceliyor
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