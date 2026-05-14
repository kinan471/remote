import { supabase, Product } from "@/lib/supabase";
import CompareView from "./CompareView";
import Link from "next/link";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; p2Name?: string }>;
}) {
  const params = await searchParams;
  const p1Id = params.p1;
  const p2Id = params.p2;
  const p2Name = params.p2Name;

  // Fetch all active products
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products = (data as Product[]) || [];
  
  const p1 = products.find(p => p.id === p1Id);
  const p2 = products.find(p => p.id === p2Id);

  return (
    <div className="min-h-screen pt-24 pb-24 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/#products" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-orange-500 shadow-sm border border-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">
              Ürün <span className="text-orange-500">Karşılaştırma</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
              Fiyat, özellikler ve müşteri puanlarını detaylı inceleyin
            </p>
          </div>
        </div>

        <CompareView allProducts={products} p1={p1} p2={p2} p2Name={p2Name} />
      </div>
    </div>
  );
}
