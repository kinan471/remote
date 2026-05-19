"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase, Product, formatPrice } from "@/lib/supabase";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";

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
  const { user, loading: authLoading, signOut, signInWithGoogle } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Record<string, string[]>>({});
  const [selectedParent, setSelectedParent] = useState<string>("Kategoriler");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  const categoryRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
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
        data?.forEach((item: { category: string | null }) => {
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
        if (terms.length === 0) return;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .ilike("title", `%${terms[0]}%`)
          .limit(20);

        if (error) throw error;

        const filtered = (data || []).filter((p: Product) => {
          const text = normalizeTurkish(`${p.title} ${p.category}`);
          return terms.every(t => text.includes(normalizeTurkish(t)));
        }).slice(0, 6);

        setSuggestions(filtered);
      } catch (err) {
        console.error("❌ Search error:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const inCategory = categoryRef.current?.contains(e.target as Node)
        || categoryDropdownRef.current?.contains(e.target as Node);
      if (!inCategory) setIsCategoryOpen(false);

      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-2xl">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-rose-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        {/* RESPONSIVE NAVBAR CONTAINER */}
        <div className="flex flex-col sm:flex-row sm:h-20 sm:items-center sm:gap-4 pb-3 pt-2 sm:py-0">
          
          {/* MOBILE TOP ROW / DESKTOP LOGO */}
          <div className="flex w-full items-center justify-between sm:w-auto sm:shrink-0 h-12 sm:h-auto">
            {/* MOBILE CATEGORY BUTTON */}
            <button
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                if (!isCategoryOpen) setActiveSubCategory(null);
              }}
              className="flex items-center gap-1 rounded-xl bg-[#2e82c3] px-2.5 py-1.5 text-[11px] font-black tracking-wide text-white transition-all active:scale-95 sm:hidden"
            >
              Kategoriler
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${isCategoryOpen ? "rotate-180" : ""}`}>
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>

            {/* LOGO */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 group flex shrink-0 items-center">
              <div className="relative">
                <span className="text-[24px] font-black tracking-tighter text-gray-900 sm:text-3xl">
                  Yakala<span className="text-orange-500">.</span>
                </span>
                <div className="absolute -bottom-1 left-0 h-[3px] w-0 rounded-full bg-orange-500 transition-all duration-300 group-hover:w-full" />
              </div>
            </Link>

            {/* MOBILE ICONS */}
            <div className="flex items-center gap-1 sm:hidden">
              <NotificationBell />
              {/* AUTH BUTTON (Mobile) */}
              <div className="relative shrink-0">
                {authLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                ) : user ? (
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[10px] font-black overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <Image src={user.user_metadata.avatar_url} alt="avatar" width={28} height={28} className="rounded-full" />
                      ) : (user.email || "U")[0].toUpperCase()}
                    </div>
                  </button>
                ) : (
                  <button onClick={() => signInWithGoogle("/")} className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 text-gray-700">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SEARCH WRAPPER */}
          <div ref={searchRef} className="relative mt-2 flex h-11 w-full flex-1 items-center overflow-visible rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 sm:bg-white/90 sm:mt-0 sm:h-14 sm:shadow-[0_8px_30px_rgba(0,0,0,.04)] transition-all duration-300 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/10">
            {/* DESKTOP CATEGORY BUTTON */}
            <div ref={categoryRef} className="hidden sm:block h-full min-w-[150px] shrink-0">
              <button onClick={() => { setIsCategoryOpen(!isCategoryOpen); if (!isCategoryOpen) setActiveSubCategory(null); }} className="flex h-full w-full items-center justify-between gap-1 rounded-l-2xl border-r border-gray-200 bg-gray-50/80 px-5 text-xs font-black uppercase tracking-wide text-gray-700 transition-all hover:bg-orange-50 hover:text-orange-600">
                <span className="truncate">{selectedParent}</span>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" className={`shrink-0 transition-transform duration-200 ${isCategoryOpen ? "rotate-180" : ""}`}><path d="M2 4l4 4 4-4" /></svg>
              </button>
            </div>

            {/* SEARCH INPUT AREA */}
            <div className="flex h-full flex-1 items-center flex-row-reverse sm:flex-row">
              {/* DESKTOP ICON (Left) */}
              <div className="hidden sm:block pl-3 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Neyi ucuza almak istersin?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-full w-full bg-transparent px-3 text-[13px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 sm:text-sm"
              />

              {/* MOBILE ICON (Right) */}
              <button onClick={handleSubmitSearch} className="flex h-full items-center justify-center px-3 text-gray-400 sm:hidden">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
            </div>

            {/* SEARCH SUGGESTIONS */}
            {(suggestions.length > 0 || (isSearching && query.length > 1)) && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[200] w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_25px_80px_rgba(0,0,0,.14)]">
                {isSearching ? (
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
                    <p className="text-xs font-bold text-gray-400">Yükleniyor...</p>
                  </div>
                ) : (
                  suggestions.map((p) => (
                    <Link key={p.id} href={`/product/${p.id}`} onClick={() => setSuggestions([])} className="flex items-center gap-3 border-b border-gray-50 p-3 transition-all hover:bg-orange-50 last:border-0">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-gray-100 shrink-0">
                        {p.images?.[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-bold text-gray-900 sm:text-sm">{p.title}</p>
                        <p className="mt-0.5 text-xs font-black text-orange-500 sm:text-sm">{formatPrice(p.current_price, p.currency)}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300"><path d="M9 18l6-6-6-6"/></svg>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* DESKTOP SEARCH BUTTON */}
            <button onClick={handleSubmitSearch} className="hidden sm:flex h-full shrink-0 items-center justify-center rounded-r-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 text-white shadow-[0_10px_25px_rgba(249,115,22,.25)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_15px_35px_rgba(249,115,22,.35)] active:scale-95">
              {isSearching ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>}
            </button>
          </div>

          {/* DESKTOP ICONS */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <NotificationBell />
            {/* AUTH BUTTON (Desktop) */}
            <div className="relative shrink-0" ref={userMenuRef}>
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
              ) : user ? (
                <>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 bg-orange-50 border border-orange-100 hover:border-orange-300 rounded-2xl px-3 py-1.5 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-black overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <Image src={user.user_metadata.avatar_url} alt="avatar" width={28} height={28} className="rounded-full" />
                      ) : (user.email || "U")[0].toUpperCase()}
                    </div>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" className={`text-orange-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}><path d="M2 4l4 4 4-4" /></svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-[300] w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-black text-gray-900 truncate">{user.user_metadata?.full_name || user.email}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                          <span>🔔</span> Fiyat Alarmlarım
                        </Link>
                        <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50">
                          <span>🚪</span> Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button onClick={() => signInWithGoogle("/")} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-4 py-2 text-xs font-black transition-all shadow-sm active:scale-95 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".9"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity=".8"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".8"/>
                  </svg>
                  <span>Giriş Yap</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY SIDE DRAWER ── */}
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm transition-opacity duration-300
          ${isCategoryOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={() => setIsCategoryOpen(false)}
      />

      {/* Drawer */}
      <div
        ref={categoryDropdownRef}
        className={`
          fixed top-0 left-0 z-[210] flex h-[100dvh] w-[85vw] max-w-[320px] flex-col
          bg-white shadow-2xl transition-transform duration-300 ease-out
          ${isCategoryOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">
            Kategoriler
          </h3>
          <button
            onClick={() => setIsCategoryOpen(false)}
            className="rounded-full bg-gray-200 p-2 text-gray-500 transition-colors hover:bg-orange-100 hover:text-orange-600"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" viewBox="0 0 24 24" />
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            {/* All products */}
            <button
              onClick={() => handleCategorySelect("Kategoriler")}
              className="
                flex w-full items-center gap-3 rounded-xl px-4 py-3
                text-left text-sm font-black text-orange-500
                transition-all hover:bg-orange-50
              "
            >
              <span className="text-lg">🏠</span>
              <span>Tüm Ürünler</span>
            </button>
          </div>

          <div className="border-t border-gray-50 px-3 py-2">
            {categories.map((parent) => {
              const hasSub = (hierarchy[parent]?.length ?? 0) > 0;
              const isActive = activeSubCategory === parent;
              return (
                <div key={parent} className="mb-1">
                  <button
                    onClick={() => {
                      if (hasSub) {
                        setActiveSubCategory(isActive ? null : parent);
                      } else {
                        handleCategorySelect(parent);
                      }
                    }}
                    className={`
                      flex w-full items-center justify-between rounded-xl px-4 py-3
                      text-left text-sm transition-all
                      ${isActive
                        ? "bg-orange-50 font-black text-orange-600"
                        : "font-bold text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className="truncate">{parent}</span>
                    {hasSub && (
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`shrink-0 transition-transform duration-300 ${
                          isActive ? "rotate-90 text-orange-500" : "text-gray-300"
                        }`}
                      >
                        <path d="M3 1.5l4 4-4 4" />
                      </svg>
                    )}
                  </button>

                  {/* Subcategories (Accordion) */}
                  {isActive && hasSub && (
                    <div className="mt-1 pb-2 pl-4 pr-2">
                      <div className="rounded-xl bg-gray-50/80 p-2">
                        <button
                          onClick={() => handleCategorySelect(parent)}
                          className="
                            mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2
                            text-xs font-black text-orange-600 transition-all hover:bg-orange-100/50
                          "
                        >
                          <span>📂</span>
                          <span>Tümünü Gör</span>
                        </button>

                        {hierarchy[parent].map((child) => (
                          <button
                            key={child}
                            onClick={() => handleSubCategorySelect(parent, child)}
                            className="
                              flex w-full items-center gap-3 rounded-lg px-3 py-2.5
                              text-left text-xs font-semibold text-gray-600
                              transition-all hover:bg-white hover:text-orange-600 hover:shadow-sm
                            "
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300" />
                            <span className="truncate">{child}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}