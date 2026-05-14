"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase, Product, formatPrice } from "@/lib/supabase";
import Image from "next/image";

const normalizeTurkish = (str: string) =>
  str
    .replace(/[şŞ]/g, "s")
    .replace(/[ıİ]/g, "i")
    .replace(/[çÇ]/g, "c")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[ğĞ]/g, "g")
    .toLowerCase();

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Record<string, string[]>>({});
  const [selectedParent, setSelectedParent] = useState<string>("Kategoriler");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  const categoryRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    
    if (pathname.startsWith("/category/")) {
      const catName = decodeURIComponent(pathname.split("/").pop() || "");
      setSelectedParent(catName);
    } else if (!q) {
      setSelectedParent("Kategoriler");
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("category")
          .eq("is_active", true);
        if (error) throw error;

        const tree: Record<string, Set<string>> = {};
        data?.forEach((item) => {
          if (!item.category) return;
          const parts = item.category.split(">").map((s: string) => s.trim());
          const parent = parts[0];
          const child = parts[1];
          if (!tree[parent]) tree[parent] = new Set();
          if (child) tree[parent].add(child);
        });

        const finalTree: Record<string, string[]> = {};
        Object.keys(tree).forEach((k) => (finalTree[k] = Array.from(tree[k]).sort()));
        setHierarchy(finalTree);
        setCategories(Object.keys(finalTree).sort());
      } catch (err) {
        console.error("❌ Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const terms = query.trim().split(/\s+/).filter(Boolean);
        let s = supabase.from("products").select("*").eq("is_active", true).limit(6);
        
        terms.forEach(t => {
          const norm = normalizeTurkish(t);
          s = s.or(`title.ilike.%${t}%,title.ilike.%${norm}%,category.ilike.%${t}%`);
        });

        const { data, error } = await s;
        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error("❌ Search error:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
        setActiveSubCategory(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmitSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    
    router.push(`/?${params.toString()}`, { scroll: false });
    setSuggestions([]);
    searchInputRef.current?.blur();
  }, [query, router, searchParams]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmitSearch();
    if (e.key === "Escape") {
      setSuggestions([]);
      searchInputRef.current?.blur();
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedParent(cat);
    setIsCategoryOpen(false);
    if (cat === "Kategoriler") {
      router.push("/");
    } else {
      router.push(`/category/${encodeURIComponent(cat)}`);
    }
  };

  const handleSubCategorySelect = (parent: string, child: string) => {
    setSelectedParent(child);
    setIsCategoryOpen(false);
    router.push(`/category/${encodeURIComponent(child)}`);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* الحاوية الرئيسية: flex-row دائماً */}
        <div className="flex flex-row items-center h-16 gap-2 sm:gap-4">
          
          {/* الشعار - يختفي في الجوال الصغير جداً لتوفير مساحة أو يصغر */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-lg sm:text-2xl font-black text-orange-500 font-poppins tracking-tighter">Yakala.</span>
          </Link>

          {/* حاوية البحث الكبرى (تشمل التصنيف والحقل والزر) */}
          <div className="flex-1 flex items-center h-10 sm:h-12 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all overflow-visible">
            
            {/* قسم التصنيفات: يأخذ 25% في الموبايل */}
            <div ref={categoryRef} className="relative h-full w-1/4 min-w-[70px] sm:w-auto">
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full h-full px-2 sm:px-5 flex items-center justify-between gap-1 border-r border-gray-200 text-[9px] sm:text-xs font-black text-gray-700 uppercase tracking-wider hover:bg-gray-100 transition-colors rounded-l-xl sm:rounded-l-2xl"
              >
                <span className="truncate">{selectedParent}</span>
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform shrink-0 ${isCategoryOpen ? "rotate-180" : ""}`}>
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>

              {/* القائمة المنسدلة */}
              <div
                className={`absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-200 origin-top z-[70] py-3 w-64
                  ${isCategoryOpen ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible -translate-y-2"}
                `}
              >
                <button
                  onClick={() => handleCategorySelect("Kategoriler")}
                  className="w-full text-left px-4 py-2 text-xs font-black text-gray-400 hover:bg-orange-50 hover:text-orange-600 border-b border-gray-50"
                >
                  KATEGORİLER
                </button>
                <div className="max-h-72 overflow-y-auto">
                  {categories.map((parent) => (
                    <div key={parent}>
                      <button
                        onClick={() => setActiveSubCategory(activeSubCategory === parent ? null : parent)}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-between"
                      >
                        {parent}
                        {hierarchy[parent]?.length > 0 && <span className="text-[10px]">▶</span>}
                      </button>
                      {activeSubCategory === parent && hierarchy[parent]?.map((child) => (
                        <button
                          key={child}
                          onClick={() => handleSubCategorySelect(parent, child)}
                          className="w-full text-left pl-8 pr-4 py-1.5 text-xs font-medium text-gray-500 hover:text-orange-600 bg-gray-50/50"
                        >
                          {child}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* حقل الإدخال: يأخذ بقية المساحة */}
            <div ref={searchRef} className="flex-1 relative h-full flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm px-3 focus:outline-none text-gray-900 placeholder:text-gray-400 font-medium"
              />

              {/* اقتراحات البحث */}
              {(suggestions.length > 0 || (isSearching && query.length > 1)) && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[140%] sm:w-full bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50">
                   {isSearching ? (
                    <div className="p-4 text-center text-xs text-gray-400">Yükleniyor...</div>
                  ) : (
                    suggestions.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        onClick={() => setSuggestions([])}
                        className="flex items-center gap-3 p-3 hover:bg-orange-50 border-b last:border-0 border-gray-50"
                      >
                        <div className="w-8 h-8 relative rounded bg-gray-100 overflow-hidden shrink-0">
                          {p.images?.[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-gray-900 truncate">{p.title}</div>
                          <div className="text-orange-500 font-bold text-[9px]">{formatPrice(p.current_price, p.currency)}</div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* زر البحث: أيقونة فقط في الموبايل لتوفير مساحة */}
            <button
              onClick={handleSubmitSearch}
              className="h-full px-3 sm:px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-r-xl sm:rounded-r-2xl transition-all flex items-center justify-center shrink-0"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}