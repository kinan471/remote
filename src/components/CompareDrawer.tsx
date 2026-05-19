"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function CompareDrawer() {
  const [items, setItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const loadCompare = () => {
      const saved = localStorage.getItem("yakala_compare_list");
      if (saved) {
        try { setItems(JSON.parse(saved)); }
        catch (e) { setItems([]); }
      } else {
        setItems([]);
      }
    };

    loadCompare();
    window.addEventListener("yakala-compare-changed", loadCompare);
    return () => window.removeEventListener("yakala-compare-changed", loadCompare);
  }, []);

  const handleRemove = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    localStorage.setItem("yakala_compare_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("yakala-compare-changed"));
  };

  const handleClear = () => {
    localStorage.removeItem("yakala_compare_list");
    window.dispatchEvent(new Event("yakala-compare-changed"));
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?redirect=/compare");
    }
  };

  if (!mounted || items.length === 0) return null;

  const compareUrl = `/compare?p1=${items[0]?.id}${items[1] ? `&p2=${items[1].id}` : ""}`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[94%] max-w-2xl bg-white/95 backdrop-blur-xl border border-orange-100 rounded-[24px] shadow-[0_20px_50px_rgba(249,115,22,0.18)] px-4 py-3 sm:px-5 sm:py-3.5 transition-all duration-300 flex flex-col gap-1.5 animate-[slideUp_0.4s_ease-out]">
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4">
        {/* Product Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
          {items.map((item, idx) => (
            <div key={item.id} className="relative flex items-center flex-shrink-0">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-orange-100 bg-white flex items-center justify-center p-1 shadow-sm">
                <img src={item.image || "/placeholder.png"} alt={item.title} className="object-contain w-full h-full" />
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] sm:text-xs font-black shadow-md border border-white transition-transform active:scale-75"
                title="Çıkar"
              >✕</button>
              {idx < items.length - 1 && (
                <span className="text-[10px] font-black text-orange-500 mx-1.5 sm:mx-2 select-none uppercase tracking-wider">VS</span>
              )}
            </div>
          ))}

          {items.length < 2 && (
            <>
              <span className="text-[9px] sm:text-[10px] font-black text-gray-300 mx-1.5 sm:mx-2 select-none uppercase tracking-wider">VS</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-base text-gray-300 select-none bg-gray-50/50">+</div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {items.length >= 2 ? (
            <Link
              href={user ? compareUrl : "/login?redirect=/compare"}
              onClick={handleCompareClick}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all duration-300 active:scale-95 whitespace-nowrap"
            >
              {!user && <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded-md">🔒</span>}
              <span>⚖️ Karşılaştır</span>
              <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-md text-[9px] sm:text-xs font-black leading-none">{items.length}</span>
            </Link>
          ) : (
            <div className="text-[10px] sm:text-xs font-bold text-orange-500 max-w-[120px] leading-tight text-right select-none pr-1">
              Bir ürün daha seçin
            </div>
          )}

          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 text-xs font-semibold hover:bg-gray-50 rounded-xl"
            title="Tümünü Temizle"
          >🗑️</button>
        </div>
      </div>
    </div>
  );
}
