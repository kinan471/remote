"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type ScrapedData = {
  title: string;
  description: string;
  current_price: number;
  original_price: number;
  images: string[];
  category: string;
  rating: number;
  source_url: string;
  source_platform: string;
  currency: string;
  scarcity_level?: number;
  specs?: Record<string, string>;
};

const HOURS_OPTIONS = [
  { label: "6 saat", value: 6 },
  { label: "12 saat", value: 12 },
  { label: "24 saat", value: 24 },
  { label: "48 saat", value: 48 },
  { label: "72 saat", value: 72 },
];

export default function AddProductPage() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scraped, setScraped] = useState<ScrapedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [specList, setSpecList] = useState<{ k: string; v: string }[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    current_price: "",
    original_price: "",
    affiliate_link: "",
    scarcity_level: "8",
    social_proof_count: "24",
    countdown_hours: "24",
    is_featured: false,
    featured_type: "",
    category: "",
    rating: "4.5",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_auth");
      if (saved === "true") setIsAuth(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "yakala2024") {
      setIsAuth(true);
      localStorage.setItem("admin_auth", "true");
    } else {
      alert("Hatalı şifre!");
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 pt-28">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 mb-4 border border-orange-500/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6000" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900">YAKALA Admin</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Yönetici şifresini girin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Şifre"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-yakala w-full py-4 text-lg">
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleScrape = async () => {
    if (!url.trim()) return;
    setScraping(true);
    setScrapeError("");
    setScraped(null);
    try {
      const res = await fetch("/api/scrape?secret=yakala2024", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeError(data.error || "Hata oluştu");
        return;
      }
      setScraped(data);
      setForm((f) => ({
        ...f,
        title: data.title || "",
        description: data.description || "",
        current_price: String(data.current_price || ""),
        original_price: String(data.original_price || ""),
        category: data.category || "",
        rating: String(data.rating || "4.5"),
        scarcity_level: String(data.scarcity_level || "10"),
      }));
      const newSpecsList = data.specs ? Object.entries(data.specs).map(([k, v]) => ({ k, v: String(v) })) : [];
      setSpecList(newSpecsList);
      setSelectedImg(0);
    } catch {
      setScrapeError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setScraping(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.current_price || !form.affiliate_link) {
      alert("Zorunlu alanları doldurun: Başlık, Fiyat, Affiliate Link");
      return;
    }
    setSaving(true);
    const countdownEndsAt = new Date(
      Date.now() + parseInt(form.countdown_hours) * 3600000
    ).toISOString();

    const payload = {
      title: form.title,
      description: form.description,
      current_price: parseFloat(form.current_price),
      original_price: parseFloat(form.original_price) || parseFloat(form.current_price) * 1.3,
      images: scraped?.images || [],
      category: form.category || "Genel",
      rating: parseFloat(form.rating) || 4.5,
      source_url: scraped?.source_url || url,
      affiliate_link: form.affiliate_link,
      source_platform: scraped?.source_platform || "other",
      scarcity_level: parseInt(form.scarcity_level) || 10,
      social_proof_count: parseInt(form.social_proof_count) || 0,
      countdown_ends_at: countdownEndsAt,
      is_featured: form.is_featured,
      featured_type: form.featured_type || null,
      currency: scraped?.currency || "TRY",
      specs: specList.reduce((acc, curr) => {
        if (curr.k.trim()) acc[curr.k.trim()] = curr.v.trim();
        return acc;
      }, {} as Record<string, string>),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const err = await res.json();
      alert("Kaydetme hatası: " + err.error);
    }
    setSaving(false);
  };

  const update = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-4 bg-white shadow-sm">
        <Link href="/admin" className="text-gray-500 hover:text-orange-500 transition-colors font-bold text-sm">
          ← Geri
        </Link>
        <span className="font-bold text-gray-900">🚀 Yeni Ürün Ekle</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: URL + Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: URL */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">1</span>
                Ürün Linkini Yapıştır
              </h2>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                  placeholder="https://www.trendyol.com/... veya hepsiburada.com/..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  onClick={handleScrape}
                  disabled={scraping || !url.trim()}
                  className="btn-yakala px-5 whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                >
                  {scraping ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                      </svg>
                      Çekiliyor...
                    </>
                  ) : "🔍 Veri Çek"}
                </button>
              </div>
              {scrapeError && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  ⚠️ {scrapeError}
                </div>
              )}
              {scraping && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-orange-500 text-sm flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Firecrawl ile ürün bilgileri çekiliyor... 10-20 saniye sürebilir.
                </div>
              )}
            </div>

            {/* Step 2: Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 text-base mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">2</span>
                Ürün Bilgilerini Düzenle
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Ürün Başlığı *</label>
                  <input value={form.title} onChange={(e) => update("title", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
                    placeholder="Ürün adı..." />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Açıklama</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all min-h-[100px] resize-y"
                    placeholder="Ürün açıklaması..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">Fiyat (₺) *</label>
                    <input type="number" value={form.current_price} onChange={(e) => update("current_price", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
                      placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">Orijinal Fiyat (₺)</label>
                    <input type="number" value={form.original_price} onChange={(e) => update("original_price", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
                      placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">🔗 Affiliate Link *</label>
                  <input type="url" value={form.affiliate_link} onChange={(e) => update("affiliate_link", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
                    placeholder="https://ty.gl/..." />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">📦 Stok Adet</label>
                    <input type="number" min="1" max="99" value={form.scarcity_level} onChange={(e) => update("scarcity_level", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">⏱ Geri Sayım</label>
                    <select value={form.countdown_hours} onChange={(e) => update("countdown_hours", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all">
                      {HOURS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">⭐ Puan</label>
                    <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => update("rating", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Kategori</label>
                  <input value={form.category} onChange={(e) => update("category", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
                    placeholder="Elektronik > Telefonlar" />
                </div>

                {/* Featured */}
                <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id="is_featured" checked={form.is_featured}
                      onChange={(e) => update("is_featured", e.target.checked)}
                      className="w-4 h-4 accent-orange-500" />
                    <label htmlFor="is_featured" className="text-gray-900 font-bold text-sm cursor-pointer">
                      🏅 Günün En İyi 3 Yakalası&apos;na ekle
                    </label>
                  </div>
                  {form.is_featured && (
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { v: "cheapest", l: "💰 En Uygun" },
                        { v: "bestseller", l: "🏆 Çok Satılan" },
                        { v: "expert", l: "⭐ Uzman Seçimi" },
                      ].map(({ v, l }) => (
                        <button key={v} type="button"
                          onClick={() => update("featured_type", v)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                            form.featured_type === v ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                          }`}
                        >{l}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specs Editor */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-blue-600 text-sm uppercase tracking-widest">🔧 Teknik Özellikler (Spesifikasyonlar)</h3>
                <button 
                  type="button" 
                  onClick={() => setSpecList([...specList, { k: "", v: "" }])}
                  className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + Özellik Ekle
                </button>
              </div>
              
              <div className="space-y-2">
                {specList.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      value={spec.k}
                      onChange={(e) => {
                        const newSpecs = [...specList];
                        newSpecs[i].k = e.target.value;
                        setSpecList(newSpecs);
                      }}
                      className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-blue-500"
                      placeholder="Özellik (Örn: RAM)"
                    />
                    <input 
                      value={spec.v}
                      onChange={(e) => {
                        const newSpecs = [...specList];
                        newSpecs[i].v = e.target.value;
                        setSpecList(newSpecs);
                      }}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500"
                      placeholder="Değer (Örn: 8 GB)"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const newSpecs = [...specList];
                        newSpecs.splice(i, 1);
                        setSpecList(newSpecs);
                      }}
                      className="w-10 h-10 flex-shrink-0 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
                {specList.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-4">Henüz özellik eklenmedi.</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Image preview + Save ── */}
          <div className="space-y-6">
            {scraped?.images && scraped.images.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-bold text-gray-700 text-sm mb-3">📸 Ürün Görselleri</h3>
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                  <Image src={scraped.images[selectedImg]} alt="Ana Görsel" fill className="object-cover" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {scraped.images.slice(0, 8).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedImg === i ? "border-orange-500" : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <Image src={img} alt={`${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-3 sticky top-28">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-yakala w-full py-4 text-base font-black disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : "✅ Ürünü Kaydet"}
              </button>
              <Link href="/admin" className="block text-center text-gray-500 hover:text-orange-500 text-sm font-bold py-2 transition-colors">
                İptal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}