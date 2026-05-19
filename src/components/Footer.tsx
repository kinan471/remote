"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  display_name: string;
  rating: number;
  experience_text: string | null;
  created_at: string;
}

interface ReviewStats {
  count: number;
  avg: number;
}

function StarRating({ value, onChange, readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-2xl transition-all duration-150 ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
            (hover || value) >= star ? "text-amber-400" : "text-gray-200"
          }`}
        >★</button>
      ))}
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, signInWithGoogle } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ count: 0, avg: 0 });
  const [rating, setRating] = useState(0);
  const [experience, setExperience] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews || []);
        setStats(d.stats || { count: 0, avg: 0 });
      })
      .catch(() => {});
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { signInWithGoogle("/"); return; }
    if (rating === 0) { setError("Lütfen bir puan seçin"); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, experience_text: experience, feature_suggestion: suggestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata");
      setSubmitted(true);
      setRating(0);
      setExperience("");
      setSuggestion("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── PLATFORM REVIEW SECTION ── */}
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/50 to-white border border-orange-100 p-6 sm:p-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                  <span>⭐</span> Kullanıcı Görüşleri
                </div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  Yakala deneyiminizi<br />
                  <span className="text-orange-500">bizimle paylaşın!</span>
                </h2>
                <p className="mt-2 text-sm text-gray-500 font-medium max-w-sm leading-relaxed">
                  Görüşünüz platformu geliştirmemize yardımcı oluyor. En iyi fırsat deneyimi için birlikte çalışalım.
                </p>
              </div>

              {stats.count > 0 && (
                <div className="flex flex-col items-center bg-white rounded-2xl border border-orange-100 shadow-sm px-8 py-4 shrink-0">
                  <span className="text-5xl font-black text-gray-900">{stats.avg.toFixed(1)}</span>
                  <StarRating value={Math.round(stats.avg)} readonly />
                  <span className="text-xs text-gray-400 font-bold mt-1">{stats.count} değerlendirme</span>
                </div>
              )}
            </div>

            {/* Review Form */}
            {submitted ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-base font-black text-green-700">Teşekkürler!</h3>
                <p className="text-sm text-green-600 font-medium mt-1">Değerlendirmeniz kaydedildi. Platformumuzu geliştirmemize yardımcı olduğunuz için teşekkür ederiz.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 sm:p-6 space-y-4">
                {!user && (
                  <div className="flex items-center justify-between gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <p className="text-sm font-bold text-orange-700">
                      🔒 Değerlendirme yapmak için giriş yapmanız gerekiyor
                    </p>
                    <button
                      type="button"
                      onClick={() => signInWithGoogle("/")}
                      className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors"
                    >
                      Giriş Yap
                    </button>
                  </div>
                )}

                {/* Stars */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                    Genel Puanınız *
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                    Deneyiminizi Anlatın
                  </label>
                  <textarea
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="Yakala'yı nasıl kullanıyorsunuz? Ne işinize yarıyor? Neler beğeniyorsunuz?"
                    rows={3}
                    maxLength={500}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 placeholder:text-gray-400 transition-all"
                  />
                </div>

                {/* Suggestion */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                    💡 Eksik Gördüğünüz Özellik
                  </label>
                  <textarea
                    value={suggestion}
                    onChange={e => setSuggestion(e.target.value)}
                    placeholder="Platformda görmek istediğiniz özellikler neler? Hangi iyileştirmeleri yapmalıyız?"
                    rows={2}
                    maxLength={300}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 placeholder:text-gray-400 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 font-bold">⚠️ {error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gönderiliyor...
                    </span>
                  ) : (
                    "✨ Görüşümü Paylaş"
                  )}
                </button>
              </form>
            )}

            {/* Latest Reviews */}
            {reviews.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {(r.display_name || "K")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">{r.display_name || "Kullanıcı"}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(r.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </p>
                        </div>
                      </div>
                      <StarRating value={r.rating} readonly />
                    </div>
                    {r.experience_text && (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 italic">"{r.experience_text}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN FOOTER GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Logo & About */}
          <div className="col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-black text-orange-500 tracking-tighter">Yakala.</span>
            </Link>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Türkiye'nin en popüler fırsat takip platformu. En iyi kampanyaları ve indirimleri sizin için yakalıyoruz.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gray-900 font-black text-xs uppercase tracking-widest mb-6">Yasal</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-gray-500 hover:text-orange-500 text-sm font-bold transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-orange-500 text-sm font-bold transition-colors">Kullanım Şartları</Link></li>
            </ul>
          </div>

          {/* Social Follow */}
          <div>
            <h4 className="text-gray-900 font-black text-xs uppercase tracking-widest mb-6">Bizi Takip Et</h4>
            <div className="flex flex-wrap gap-4">
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF0000]/10 hover:bg-[#FF0000] transition-all group shadow-sm" title="YouTube">
                <svg width="20" height="20" fill="currentColor" className="text-[#FF0000] group-hover:text-white" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E4405F]/10 hover:bg-[#E4405F] transition-all group shadow-sm" title="Instagram">
                <svg width="18" height="18" fill="currentColor" className="text-[#E4405F] group-hover:text-white" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black transition-all group shadow-sm" title="TikTok">
                <svg width="18" height="18" fill="currentColor" className="text-black group-hover:text-white" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-4.17.07-8.33.07-12.5z"/>
                </svg>
              </Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] transition-all group shadow-sm" title="Facebook">
                <svg width="20" height="20" fill="currentColor" className="text-[#1877F2] group-hover:text-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
            </div>
            <p className="mt-4 text-gray-400 text-[11px] font-bold">@yakala.official</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-gray-400 text-xs font-bold">© {currentYear} Yakala. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sistem Aktif</span>
          </div>
        </div>
      </div>
    </footer>
  );
}