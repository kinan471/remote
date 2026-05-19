"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Product, formatPrice, getDiscountPercent } from "@/lib/supabase";
import { computeDealScore, getSignalClasses } from "@/lib/deal-score";
import { useRouter } from "next/navigation";

interface CompareViewProps {
  allProducts: Product[];
  p1?: Product;
  p2?: Product;
  p2Name?: string;
}

type CellHighlight = "left" | "right" | "equal" | "none";

function CompareRow({
  label,
  v1,
  v2,
  highlight = "none",
  unit = "",
  isHeader = false,
}: {
  label: string;
  v1: React.ReactNode;
  v2: React.ReactNode;
  highlight?: CellHighlight;
  unit?: string;
  isHeader?: boolean;
}) {
  if (isHeader) {
    return (
      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
        <td colSpan={3} className="py-2 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
          {label}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 group hover:bg-orange-50/20 transition-colors">
      <td className="py-4 px-6 text-gray-500 font-semibold text-sm w-[30%] bg-gray-50/30 group-hover:bg-orange-50/30">
        {label}
      </td>
      <td
        className={`py-4 px-6 text-sm font-bold border-l border-gray-100 w-[35%] transition-colors ${
          highlight === "left"
            ? "text-green-700 bg-green-50"
            : "text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          {highlight === "left" && (
            <span className="text-[10px] bg-green-500 text-white font-black px-1.5 py-0.5 rounded-md">✓ İyi</span>
          )}
          {v1}{unit && <span className="text-gray-400 font-normal text-xs">{unit}</span>}
        </div>
      </td>
      <td
        className={`py-4 px-6 text-sm font-bold border-l border-gray-100 w-[35%] transition-colors ${
          highlight === "right"
            ? "text-green-700 bg-green-50"
            : "text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          {highlight === "right" && (
            <span className="text-[10px] bg-green-500 text-white font-black px-1.5 py-0.5 rounded-md">✓ İyi</span>
          )}
          {v2}{unit && <span className="text-gray-400 font-normal text-xs">{unit}</span>}
        </div>
      </td>
    </tr>
  );
}

export default function CompareView({ allProducts, p1, p2, p2Name }: CompareViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [customP2Name, setCustomP2Name] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (p1 && (p2 || p2Name)) {
      const fetchAiComparison = async () => {
        setAiLoading(true);
        setAiResult(null);
        try {
          const res = await fetch("/api/compare-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ p1, p2, p2Name }),
          });
          const data = await res.json();
          setAiResult(data);
        } catch (error) {
          console.error("AI fetch error:", error);
        } finally {
          setAiLoading(false);
        }
      };
      fetchAiComparison();
    }
  }, [p1?.id, p2?.id, p2Name]);

  const handleSelectP2 = (id: string) => {
    if (p1) router.push(`/compare?p1=${p1.id}&p2=${id}`);
    else router.push(`/compare?p1=${id}`);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customP2Name.trim()) return;
    router.push(`/compare?p1=${p1?.id}&p2Name=${encodeURIComponent(customP2Name.trim())}`);
  };

  const filteredProducts = allProducts.filter(p => {
    if (p.id === p1?.id) return false;
    if (p1) {
      const p1Cat = p1.category.split(">")[0]?.trim();
      const pCat = p.category.split(">")[0]?.trim();
      if (pCat !== p1Cat && p1Cat && pCat) return false;
    }
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  // AI handles score and specs now

  // AI handles score now

  const renderProductCard = (product?: Product, isP2 = false) => {
    if (!product) {
      return (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-6 flex flex-col min-h-[340px]">
          <div className="text-center mb-5">
            <div className="text-5xl mb-3 opacity-30">🔍</div>
            <h3 className="font-black text-gray-700 mb-1 text-base">Karşılaştırılacak Ürün Seç</h3>
            <p className="text-gray-400 text-xs">Platformdan seçin veya adını yazın</p>
          </div>
          
          <form onSubmit={handleCustomSearch} className="mb-4 relative">
            <input
              type="text"
              placeholder="Dışarıdan ürün adı yazın... (Örn: iPhone 15)"
              value={customP2Name}
              onChange={e => setCustomP2Name(e.target.value)}
              className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-orange-900 placeholder:text-orange-300"
            />
            <button type="submit" className="absolute right-2 top-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">Yapay Zeka Sor</button>
          </form>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">VEYA YAKALA'DAN SEÇ</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <input
            type="text"
            placeholder="Platformda ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs mb-3 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
          />
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[360px] flex-1">
            {filteredProducts.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">
                {search ? "Ürün bulunamadı" : "Aynı kategoride başka ürün yok"}
              </div>
            )}
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectP2(p.id)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all text-left w-full group"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                  {p.images?.[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-orange-600 transition-colors">{p.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-orange-600 font-black">{formatPrice(p.current_price, p.currency)}</span>
                    <span className="text-[10px] text-gray-400">⭐ {p.rating}</span>
                  </div>
                </div>
                <div className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (isP2 && p2Name && !product) {
      return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col">
          <button
            onClick={() => router.push(`/compare?p1=${p1?.id}`)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-gray-400 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-6xl opacity-20">🤖</div>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">YAPAY ZEKA VERİSİ</div>
              <h2 className="font-bold text-gray-900 text-sm leading-snug mb-3">{p2Name}</h2>
              <div className="text-xs text-gray-500 italic">Bu ürünün detayları Gemini AI tarafından web verilerinden çekilerek analiz edilmektedir. Sitenin stoklarında bulunmayabilir.</div>
            </div>
          </div>
        </div>
      );
    }

    const discount = getDiscountPercent(product!.original_price, product!.current_price);
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
        {isP2 && (
          <button
            onClick={() => router.push(`/compare?p1=${p1?.id}`)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-gray-400 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <div className="relative w-full aspect-[4/3] bg-gray-50">
          {product.images?.[0] && (
            <Image src={product.images[0]} alt={product.title} fill className="object-contain p-4" />
          )}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-lg">
              %{discount} İndirim
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">{product.source_platform}</div>
          <h2 className="font-bold text-gray-900 text-sm leading-snug mb-3 line-clamp-3">{product.title}</h2>
          <div className="flex items-end gap-2 mb-1">
            <div className="text-2xl font-black text-gray-900">{formatPrice(product.current_price, product.currency)}</div>
          </div>
          {product.original_price > product.current_price && (
            <div className="text-xs text-gray-400 line-through mb-3">{formatPrice(product.original_price, product.currency)}</div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            {/* Real Deal Score Badge */}
            {(() => {
              const deal = computeDealScore(product);
              const classes = getSignalClasses(deal.signal);
              return (
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black ${classes.bgLight} ${classes.text} ${classes.border} border`}>
                  <span>{deal.signalEmoji} {deal.score}/100</span>
                </div>
              );
            })()}

            <div className="flex items-center gap-1 text-xs font-bold text-amber-500 border-l border-gray-100 pl-3">
              {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
              <span className="text-gray-500 ml-1">{product.rating.toFixed(1)}</span>
            </div>
          </div>
          <a
            href={product.affiliate_link || product.source_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-yakala block text-center w-full py-3 text-sm"
          >
            🎯 Şimdi Yakala
          </a>
        </div>
      </div>
    );
  };

  const renderVerdict = () => {
    if (!p1 || (!p2 && !p2Name)) return null;

    if (aiLoading) {
      return (
        <div className="mt-8 rounded-3xl overflow-hidden shadow-xl shadow-orange-500/15">
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-12 text-white relative flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <h4 className="text-xl font-black mb-2">Yakala Yapay Zeka Düşünüyor...</h4>
            <p className="text-orange-100 text-sm">Ürünler analiz ediliyor, en iyi fırsat belirleniyor.</p>
          </div>
        </div>
      );
    }

    if (!aiResult) return null;

    const winnerId = aiResult.winner;
    const { 
      p1Score, 
      p2Score, 
      reasoning, 
      isClose,
      p1Sentiment,
      p2Sentiment,
      p1TargetAudience,
      p2TargetAudience,
      actualPerformanceComparison
    } = aiResult;
    
    // Determine winner object correctly
    let winner = null;
    let p2DisplayTitle = p2?.title || p2Name || "Ürün 2";
    if (winnerId === 1) winner = p1;
    else if (winnerId === 2) winner = p2 || { title: p2Name, id: 2 } as any;
    else winner = p1; // fallback
    
    const s1 = p1Score || 50;
    const s2 = p2Score || 50;

    return (
      <div className="mt-8 space-y-6">
        <div className="rounded-3xl overflow-hidden shadow-xl shadow-orange-500/15">
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl -mr-20 -mt-20"/>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-300 rounded-full blur-3xl -ml-10 -mb-10"/>
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="text-7xl drop-shadow-lg">🤖</div>
              <div className="flex-1">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200 mb-2">
                  YAPAY ZEKA SONUÇ DEĞERLENDİRMESİ {isClose && "(BAŞA BAŞ MÜCADELE)"}
                </div>
                <h4 className="text-xl md:text-2xl font-black mb-3 leading-tight flex items-center gap-2">
                  🏆 Kesin Kazanan: <span className="underline decoration-orange-300 decoration-4 underline-offset-4">{winner.title}</span>
                </h4>
                <p className="text-orange-50 text-sm leading-relaxed font-medium max-w-2xl bg-black/10 p-4 rounded-xl border border-white/10">
                  {reasoning}
                </p>
              </div>
              {winner.id === p1.id || (p2 && winner.id === p2.id) ? (
                <a
                  href={winner.affiliate_link || winner.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 bg-white text-orange-600 px-8 py-5 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-transform flex flex-col items-center gap-1 border-b-4 border-orange-200"
                >
                  <span>Kazananı Yakala</span>
                  <span className="text-xs font-semibold text-gray-500">En İyi Fiyat/Performans</span>
                </a>
              ) : (
                <div className="flex-shrink-0 bg-gray-100 text-gray-400 px-8 py-5 rounded-2xl font-black text-sm border-b-4 border-gray-200 cursor-not-allowed">
                  Platform Dışı Ürün
                </div>
              )}
            </div>
          </div>
          {/* Score bar */}
          <div className="bg-white px-8 py-5 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-gray-700 line-clamp-1 max-w-[45%]">{p1.title}</span>
                <span className="text-gray-700 line-clamp-1 max-w-[45%] text-right">{p2DisplayTitle}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(s1 / (s1 + s2)) * 100}%` }}
                />
                <div
                  className="bg-gray-300 h-full flex-1 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1.5 text-gray-400">
                <span>{Math.round(s1)} puan</span>
                <span>{Math.round(s2)} puan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisCards = () => {
    if (!p1 || (!p2 && !p2Name) || !aiResult) return null;

    const winnerId = aiResult.winner;
    const { 
      p1Sentiment,
      p2Sentiment,
      p1TargetAudience,
      p2TargetAudience,
      actualPerformanceComparison
    } = aiResult;
    
    let winner = null;
    let p2DisplayTitle = p2?.title || p2Name || "Ürün 2";
    if (winnerId === 1) winner = p1;
    else if (winnerId === 2) winner = p2 || { title: p2Name, id: 2 } as any;
    else winner = p1;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actual Performance */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="text-3xl mb-4 bg-orange-50 w-12 h-12 flex items-center justify-center rounded-2xl text-orange-500">⚡</div>
            <h5 className="font-black text-sm text-gray-900 mb-3 uppercase tracking-widest">Gerçek Dünya Performansı</h5>
            <p className="text-sm text-gray-600 leading-relaxed flex-1">{actualPerformanceComparison}</p>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="text-3xl mb-4 bg-blue-50 w-12 h-12 flex items-center justify-center rounded-2xl text-blue-500">💬</div>
            <h5 className="font-black text-sm text-gray-900 mb-4 uppercase tracking-widest">Kullanıcı Yorumları (Duygu Analizi)</h5>
            <div className="space-y-4 flex-1">
              <div>
                <div className="text-[10px] font-black uppercase text-gray-400 mb-1.5 line-clamp-1">{p1.title}</div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">"{p1Sentiment}"</p>
              </div>
              <div className="h-px w-full bg-gray-100"></div>
              <div>
                <div className="text-[10px] font-black uppercase text-gray-400 mb-1.5 line-clamp-1">{p2DisplayTitle}</div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">"{p2Sentiment}"</p>
              </div>
            </div>
          </div>

          {/* Recommendation Engine (Target Audience) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="text-3xl mb-4 bg-green-50 w-12 h-12 flex items-center justify-center rounded-2xl text-green-500">🎯</div>
            <h5 className="font-black text-sm text-gray-900 mb-4 uppercase tracking-widest">Kimin İçin Uygun?</h5>
            <div className="space-y-3 flex-1">
              <div className={`p-4 rounded-2xl border ${winner.id === p1.id ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`text-[10px] font-black uppercase mb-1.5 line-clamp-1 ${winner.id === p1.id ? 'text-green-600' : 'text-gray-500'}`}>{p1.title}</div>
                <p className={`text-sm leading-relaxed ${winner.id === p1.id ? 'text-green-900 font-medium' : 'text-gray-600'}`}>{p1TargetAudience}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${winner.id !== p1.id ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`text-[10px] font-black uppercase mb-1.5 line-clamp-1 ${winner.id !== p1.id ? 'text-green-600' : 'text-gray-500'}`}>{p2DisplayTitle}</div>
                <p className={`text-sm leading-relaxed ${winner.id !== p1.id ? 'text-green-900 font-medium' : 'text-gray-600'}`}>{p2TargetAudience}</p>
              </div>
            </div>
          </div>
        </div>
    );
  };

  return (
    <div>
      {/* Product cards header row */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8">
        {renderProductCard(p1, false)}
        {renderProductCard(p2, true)}
      </div>

      {p1 && (p2 || p2Name) && (
        <>
          {/* AI Generated Dynamic Comparison Table */}
          {aiResult?.comparisonTable && aiResult.comparisonTable.length > 0 && (
            <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Sticky header */}
              <div className="grid grid-cols-[30%_35%_35%] bg-white border-b-2 border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-purple-500">✨</span> AI Analizi
                </div>
                <div className="py-4 px-6 border-l border-gray-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-0.5">{p1.source_platform}</div>
                  <div className="text-xs font-bold text-gray-800 line-clamp-2">{p1.title}</div>
                </div>
                <div className="py-4 px-6 border-l border-gray-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-0.5">{p2 ? p2.source_platform : "Dış Ürün"}</div>
                  <div className="text-xs font-bold text-gray-800 line-clamp-2">{p2?.title || p2Name}</div>
                </div>
              </div>

              <table className="w-full text-sm table-fixed">
                <tbody>
                  <CompareRow label="🧠 YAPAY ZEKA DONANIM TABLOSU" v1="" v2="" isHeader />
                  {aiResult.comparisonTable.map((row: any, i: number) => (
                    <CompareRow
                      key={i}
                      label={row.feature}
                      v1={row.p1Value}
                      v2={row.p2Value}
                      highlight={row.winner === 1 ? "left" : row.winner === 2 ? "right" : "equal"}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {renderAnalysisCards()}
          {renderVerdict()}
        </>
      )}
    </div>
  );
}
