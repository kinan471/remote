"use client";
import { useEffect, useState } from "react";
import { Product, formatPrice, getDiscountPercent } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type Stats = { visits: number; products: number; clicks: number };

const FEATURED_TYPE_LABELS = {
  cheapest:   { label: "💰 En Uygun",    color: "text-green-600" },
  bestseller: { label: "🏆 Çok Satılan", color: "text-orange-600" },
  expert:     { label: "⭐ Uzman Seçimi", color: "text-purple-600" },
};

export default function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ visits: 0, products: 0, clicks: 0 });
  const [loading, setLoading] = useState(true);
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);
  const [marqueeText, setMarqueeText] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState<string | null>(null);
  const [botLog, setBotLog] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | null }>({ message: "", type: null });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 5000);
  };

  const loadData = async () => {
    if (!isAuth) return;
    setLoading(true);
    try {
      const [productsRes, statsRes, settingsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/stats").catch(() => null),
        fetch("/api/settings").catch(() => null),
      ]);
      const productsData = await productsRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
      
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData?.visits !== undefined ? statsData : { visits: 0, products: 0, clicks: 0 });
      }

      if (settingsRes && settingsRes.ok) {
        const settings = await settingsRes.json();
        setMarqueeText(settings.marquee_text || "");
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const saved = localStorage.getItem("admin_auth");
    if (saved === "true") setIsAuth(true);
  }, []);

  useEffect(() => { 
    if (isAuth) loadData(); 
  }, [isAuth]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "yakala2024") { // Matches .env.local
      setIsAuth(true);
      localStorage.setItem("admin_auth", "true");
    } else {
      alert("Hatalı şifre!");
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md admin-card animate-slide-down">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 mb-4 border border-orange-500/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6000" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900">YAKALA Admin</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Lütfen yönetici şifresini girin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Şifre"
              className="admin-input text-center text-lg tracking-widest"
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

  const toggleFeature = async (product: Product, type: "cheapest" | "bestseller" | "expert") => {
    setFeatureLoading(product.id);
    const isCurrentlyFeatured = product.is_featured && product.featured_type === type;
    const is_featured = !isCurrentlyFeatured;
    const featured_type = isCurrentlyFeatured ? null : type;

    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, is_featured, featured_type } : p
    ));

    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured, featured_type }),
    });
    setFeatureLoading(null);
  };

  const toggleActive = async (product: Product) => {
    const is_active = !product.is_active;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active } : p));

    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== deleteId));
        showToast("Ürün başarıyla silindi!", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Ürün silinirken bir hata oluştu!", "error");
      }
    } catch (err: any) {
      showToast("Bağlantı hatası: " + err.message, "error");
    } finally {
      setDeleteId(null);
    }
  };

  const updateSettings = async (key: string, value: string) => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        showToast("Ayarlar başarıyla güncellendi!", "success");
      } else {
        showToast("Ayarlar güncellenirken hata oluştu!", "error");
      }
    } catch (e: any) {
      showToast("Hata oluştu: " + e.message, "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const runCrawlerAction = async (action: "discover" | "process" | "all") => {
    setCrawlLoading(action);
    showToast(`${action === "discover" ? "Yeni indirim keşfi" : action === "process" ? "Kuyruktaki ürünleri işleme" : "Tam akış keşfi"} süreci başlatıldı...`, "success");
    try {
      const limitVal = action === "process" ? 100 : (action === "all" ? 25 : "");
      const res = await fetch(`/api/discover?action=${action}&limit=${limitVal}&secret=yakala2024`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let msg = "";
        if (action === "discover") msg = `Keşif tamamlandı! ${data.discovered} yeni ürün sıraya eklendi.`;
        else if (action === "process") msg = `İşleme tamamlandı! ${data.processed} ürün başarıyla işlendi ve Günün En İyi 3 Yakalası güncellendi.`;
        else msg = `Tam akış tamamlandı! ${data.discovered} keşfedildi, ${data.processed} işlendi.`;
        showToast(msg, "success");
        loadData(); // Reload stats and products list dynamically!
      } else {
        showToast(data.error || "İşlem sırasında bir hata oluştu!", "error");
      }
    } catch (err: any) {
      showToast("İletişim hatası: " + err.message, "error");
    } finally {
      setCrawlLoading(null);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#FF6000" opacity="0.15" />
              <path d="M18 6 L18 26 M10 18 L18 28 L26 18" stroke="#FF6000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="28" r="3" fill="#FF6000" />
            </svg>
            <span className="text-xl font-black text-gray-900 tracking-tight">yakala<span className="text-orange-500">.</span></span>
          </Link>
          <span className="text-gray-300 font-bold">/</span>
          <span className="text-gray-500 font-black text-xs uppercase tracking-widest">Yönetim Paneli</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/add-product" className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            🚀 Yeni Ürün
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">




        <div className="admin-card mb-6 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/20">
          <h3 className="text-gray-900 font-black text-lg mb-4 flex items-center gap-2">
            📢 Duyuru Bandı (Marquee)
          </h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              className="admin-input flex-1 font-medium"
              placeholder="Duyuru metnini girin..."
            />
            <button
              onClick={() => updateSettings("marquee_text", marqueeText)}
              disabled={settingsLoading}
              className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all disabled:opacity-50"
            >
              {settingsLoading ? "..." : "Kaydet"}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Bu metin sayfanın en üstünde kayan yazı olarak görünecektir.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Toplam Ziyaret", value: stats.visits.toLocaleString("tr-TR"), icon: "👁", color: "text-blue-600" },
            { label: "Aktif Ürünler",  value: stats.products.toLocaleString("tr-TR"), icon: "📦", color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="admin-card flex items-center gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <div className={`text-2xl font-black ${s.color} font-poppins`}>{s.value}</div>
                <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* YAKALA Ultra Scraper Kontrol Merkezi */}
        <div className="admin-card mb-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-900 font-black text-base flex items-center gap-2">
              🤖 YAKALA Ultra Scraper Kontrol Merkezi
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black border border-blue-100 uppercase tracking-widest animate-pulse">
              Aktif Güvenli Mod
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mb-5">
            Otomatik ürün keşif aramasını başlatabilir, sıradaki bekleyen indirimli ürünleri (örneğin 100 ürün) paralel kanallarla veritabanına aktarabilir ve Günün En İyi 3 Yakalası'nı tamamen yapay zeka ile otomatik atayabilirsiniz.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => runCrawlerAction("discover")}
              disabled={crawlLoading !== null}
              className="py-4 px-6 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {crawlLoading === "discover" ? "🔍 Aranıyor..." : "🔍 1. Adım: Yeni Ürün Keşfet"}
            </button>
            <button
              onClick={() => runCrawlerAction("process")}
              disabled={crawlLoading !== null}
              className="py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {crawlLoading === "process" ? "⚡ İşleniyor..." : "⚡ 2. Adım: Kuyruğu Sür (100 Ürün)"}
            </button>
            <button
              onClick={() => runCrawlerAction("all")}
              disabled={crawlLoading !== null}
              className="py-4 px-6 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
            >
              {crawlLoading === "all" ? "🔥 Tam Akış Çalışıyor..." : "🔥 Tam Akış (Keşfet + İşle)"}
            </button>
          </div>
        </div>

        {/* Featured Status */}
        <div className="admin-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-black text-base flex items-center gap-2">
              🏅 Günün En İyi 3 Yakalası — Durum
            </h3>
            {products.filter(p => p.is_featured).length < 3 && (
              <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-lg font-black border border-red-100 animate-bounce">
                ⚠️ Eksik! 3 Seçim Yapmalısın
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["cheapest", "bestseller", "expert"] as const).map((type) => {
              const featured = products.find((p) => p.is_featured && p.featured_type === type);
              const config = FEATURED_TYPE_LABELS[type];
              return (
                <div key={type}
                  className={`rounded-2xl p-4 border transition-all ${featured ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-gray-50/50"}`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${config.color}`}>{config.label}</div>
                  <div className="text-xs text-gray-900 font-bold truncate">
                    {featured ? featured.title : <span className="text-gray-400 italic">Atanmadı</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products Table */}
        <div className="admin-card overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900 font-black text-2xl">📦 Tüm Ürünler ({products.length})</h2>
            <div className="flex gap-2">
              <button onClick={loadData} className="btn-outline text-xs px-4 py-2">
                ↻ Yenile
              </button>
              <Link href="/admin/add-product" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                + Hızlı Ekle
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 font-medium">Henüz ürün eklenmedi.</p>
              <Link href="/admin/add-product" className="btn-yakala inline-flex mt-4">
                İlk Ürünü Ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[10px] text-gray-400 font-black uppercase tracking-widest pb-3 pr-4">Ürün</th>
                    <th className="text-left text-[10px] text-gray-400 font-black uppercase tracking-widest pb-3 pr-4">Fiyat</th>
                    <th className="text-left text-[10px] text-gray-400 font-black uppercase tracking-widest pb-3 pr-4">İstatistik</th>
                    <th className="text-left text-[10px] text-gray-400 font-black uppercase tracking-widest pb-3 pr-4">Öne Çıkar</th>
                    <th className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest pb-3">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const discount = getDiscountPercent(product.original_price, product.current_price);
                    const img = product.images?.[0];
                    return (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Product */}
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {img ? (
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                                <Image src={img} alt={product.title} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">📦</div>
                            )}
                            <div>
                              <div className="text-gray-900 text-sm font-bold line-clamp-1 max-w-[250px]">
                                {product.title}
                              </div>
                              <div className="text-gray-500 text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 mt-1">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{product.source_platform}</span>
                                <span>•</span>
                                <span className={product.is_active ? "text-green-600" : "text-red-500"}>
                                  {product.is_active ? "Aktif" : "Pasif"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 pr-4">
                          <div className="text-orange-600 font-black text-sm">
                            {formatPrice(product.current_price, product.currency)}
                          </div>
                          <div className="text-gray-400 text-[10px] line-through font-medium">
                            {formatPrice(product.original_price, product.currency)}
                          </div>
                          {discount > 0 && (
                            <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-md font-black border border-orange-100 mt-1 inline-block">
                              -%{discount}
                            </span>
                          )}
                        </td>

                        {/* Stats */}
                        <td className="py-3 pr-4">
                          <div className="text-[10px] text-gray-500 font-bold space-y-1">
                            <div className="flex items-center gap-1.5">🎯 <span className="text-gray-700">{product.click_count}</span> tık</div>
                            <div className="flex items-center gap-1.5">📦 <span className="text-gray-700">{product.scarcity_level}</span> stok</div>
                          </div>
                        </td>

                        {/* Feature Controls */}
                        <td className="py-3 pr-4">
                          <div className="flex flex-col gap-1.5">
                            {(["cheapest", "bestseller", "expert"] as const).map((type) => {
                              const config = FEATURED_TYPE_LABELS[type];
                              const isSet = product.is_featured && product.featured_type === type;
                              return (
                                <button
                                  key={type}
                                  onClick={() => toggleFeature(product, type)}
                                  disabled={featureLoading === product.id}
                                  className={`text-[10px] px-2 py-1.5 rounded-xl font-black uppercase tracking-tighter transition-all border-2 ${
                                    isSet
                                      ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                      : "bg-white text-gray-400 border-gray-100 hover:border-orange-500 hover:text-orange-500"
                                  }`}
                                >
                                  {config.label.split(" ")[1]}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/edit-product/${product.id}`}
                              className="text-[10px] px-3 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 font-black uppercase tracking-widest transition-all"
                            >
                              Düzenle
                            </Link>
                            <button
                              onClick={() => toggleActive(product)}
                              className={`text-[10px] px-3 py-2 rounded-xl font-black uppercase tracking-widest transition-all ${
                                product.is_active
                                  ? "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100"
                                  : "bg-green-50 text-green-600 border border-green-100 hover:bg-green-100"
                              }`}
                            >
                              {product.is_active ? "Gizle" : "Göster"}
                            </button>
                            <button
                              onClick={() => setDeleteId(product.id)}
                              className="text-[10px] px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-black uppercase tracking-widest transition-all"
                            >
                              Sil
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modern Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 border border-gray-100 shadow-2xl animate-scale-up">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-2xl bg-red-50 text-red-500 mb-4 border border-red-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-black text-xl mb-2">Ürünü Silmek İstiyor Musunuz?</h3>
              <p className="text-gray-500 text-sm font-medium mb-6">
                Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ürün veritabanından kalıcı olarak kaldırılacaktır.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-sm font-black transition-all border border-gray-100"
                >
                  İptal Et
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-red-100"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Glassmorphic Toast Notification */}
      {toast.type && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-slide-up">
          <div className={`p-2 rounded-xl flex-shrink-0 ${toast.type === "success" ? "bg-green-50 text-green-500 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
            {toast.type === "success" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="text-gray-900 text-xs font-black uppercase tracking-wider">Sistem Bildirimi</div>
            <div className="text-gray-500 text-xs mt-0.5 font-medium">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
