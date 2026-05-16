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
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
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
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-2xl">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-rose-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        {/* MOBILE HEIGHT IMPROVED */}
        <div className="flex h-[68px] items-center gap-2 sm:h-20 sm:gap-4">
          
          {/* LOGO */}
          <Link
            href="/"
            className="
              group
              flex
              shrink-0
              items-center
            "
          >
            <div className="relative">
              <span
                className="
                  text-[22px]
                  font-black
                  tracking-tighter
                  text-gray-900
                  sm:text-3xl
                "
              >
                Yakala
                <span className="text-orange-500">
                  .
                </span>
              </span>

              <div
                className="
                  absolute
                  -bottom-1
                  left-0
                  h-[3px]
                  w-0
                  rounded-full
                  bg-orange-500
                  transition-all
                  duration-300
                  group-hover:w-full
                "
              />
            </div>
          </Link>

          {/* SEARCH WRAPPER */}
          <div
            className="
              flex
              h-12
              flex-1
              items-center
              overflow-visible
              rounded-2xl
              border
              border-gray-200
              bg-white/90
              shadow-[0_8px_30px_rgba(0,0,0,.04)]
              transition-all
              duration-300
              focus-within:border-orange-400
              focus-within:ring-4
              focus-within:ring-orange-500/10
              sm:h-14
            "
          >
            {/* CATEGORY */}
            <div
              ref={categoryRef}
              className="
                relative
                h-full
                min-w-[84px]
                sm:min-w-[150px]
              "
            >
              <button
                onClick={() =>
                  setIsCategoryOpen(!isCategoryOpen)
                }
                className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-between
                  gap-1
                  rounded-l-2xl
                  border-r
                  border-gray-200
                  bg-gray-50/80
                  px-2
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wide
                  text-gray-700
                  transition-all
                  hover:bg-orange-50
                  hover:text-orange-600
                  sm:px-5
                  sm:text-xs
                "
              >
                <span className="truncate">
                  {selectedParent}
                </span>

                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={`shrink-0 transition-transform ${
                    isCategoryOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>

              {/* MOBILE FRIENDLY DROPDOWN */}
              <div
                className={`
                  absolute
                  left-0
                  top-[calc(100%+10px)]
                  z-[70]
                  w-[92vw]
                  max-w-[320px]
                  overflow-hidden
                  rounded-3xl
                  border
                  border-gray-100
                  bg-white
                  shadow-[0_30px_80px_rgba(0,0,0,.12)]
                  transition-all
                  duration-200
                  sm:w-80
                  ${
                    isCategoryOpen
                      ? "visible translate-y-0 opacity-100 scale-100"
                      : "invisible -translate-y-2 opacity-0 scale-95"
                  }
                `}
              >
                <div className="border-b border-gray-100 p-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Kategoriler
                  </h3>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {categories.map((parent) => {
                    const hasSub =
                      hierarchy[parent]?.length > 0;

                    const isActive =
                      activeSubCategory === parent;

                    return (
                      <div
                        key={parent}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <button
                          onClick={() => {
                            if (hasSub) {
                              setActiveSubCategory(
                                isActive
                                  ? null
                                  : parent
                              );
                            } else {
                              handleCategorySelect(
                                parent
                              );
                            }
                          }}
                          className="
                            flex
                            w-full
                            items-center
                            justify-between
                            px-5
                            py-4
                            text-left
                            transition-all
                            hover:bg-orange-50
                          "
                        >
                          <span className="text-sm font-bold text-gray-700">
                            {parent}
                          </span>

                          {hasSub && (
                            <svg
                              width="12"
                              height="12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              className={`transition-transform ${
                                isActive
                                  ? "rotate-180 text-orange-500"
                                  : "text-gray-300"
                              }`}
                            >
                              <path d="M2 4l4 4 4-4" />
                            </svg>
                          )}
                        </button>

                        {isActive && hasSub && (
                          <div className="bg-gray-50/70 py-2">
                            {hierarchy[parent].map(
                              (child) => (
                                <button
                                  key={child}
                                  onClick={() =>
                                    handleSubCategorySelect(
                                      parent,
                                      child
                                    )
                                  }
                                  className="
                                    block
                                    w-full
                                    px-8
                                    py-3
                                    text-left
                                    text-sm
                                    font-semibold
                                    text-gray-500
                                    transition-all
                                    hover:bg-orange-50
                                    hover:text-orange-600
                                  "
                                >
                                  {child}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div
              ref={searchRef}
              className="
                relative
                flex
                h-full
                flex-1
                items-center
              "
            >
              {/* ICON */}
              <div className="pl-3 text-gray-400">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ürün ara..."
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                onKeyDown={handleKeyDown}
                className="
                  h-full
                  w-full
                  bg-transparent
                  px-3
                  text-[13px]
                  font-semibold
                  text-gray-900
                  outline-none
                  placeholder:text-gray-400
                  sm:text-sm
                "
              />

              {/* SEARCH SUGGESTIONS */}
              {(suggestions.length > 0 ||
                (isSearching &&
                  query.length > 1)) && (
                <div
                  className="
                    absolute
                    left-0
                    top-[calc(100%+10px)]
                    z-50
                    w-[95vw]
                    max-w-full
                    overflow-hidden
                    rounded-3xl
                    border
                    border-gray-100
                    bg-white
                    shadow-[0_25px_80px_rgba(0,0,0,.12)]
                    sm:w-full
                  "
                >
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />

                      <p className="text-xs font-bold text-gray-400">
                        Yükleniyor...
                      </p>
                    </div>
                  ) : (
                    suggestions.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        onClick={() =>
                          setSuggestions([])
                        }
                        className="
                          flex
                          items-center
                          gap-3
                          border-b
                          border-gray-50
                          p-3
                          transition-all
                          hover:bg-orange-50
                        "
                      >
                        <div
                          className="
                            relative
                            h-14
                            w-14
                            overflow-hidden
                            rounded-2xl
                            bg-gray-100
                            shrink-0
                          "
                        >
                          {p.images?.[0] && (
                            <Image
                              src={p.images[0]}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold text-gray-900 sm:text-sm">
                            {p.title}
                          </p>

                          <p className="mt-1 text-sm font-black text-orange-500">
                            {formatPrice(
                              p.current_price,
                              p.currency
                            )}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* BUTTON */}
            <button
              onClick={handleSubmitSearch}
              className="
                flex
                h-full
                shrink-0
                items-center
                justify-center
                rounded-r-2xl
                bg-gradient-to-r
                from-orange-500
                to-red-500
                px-4
                text-white
                shadow-[0_10px_25px_rgba(249,115,22,.25)]
                transition-all
                duration-300
                hover:scale-[1.02]
                hover:shadow-[0_15px_35px_rgba(249,115,22,.35)]
                active:scale-95
                sm:px-6
              "
            >
              {isSearching ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />
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