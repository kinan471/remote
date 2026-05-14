import { supabase, formatPrice, getDiscountPercent } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    return (
      <div className="pt-32 text-center">
        <h1 className="text-2xl font-bold">Ürün Bulunamadı</h1>
        <Link href="/" className="text-orange-500 underline mt-4 inline-block">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  const discount = getDiscountPercent(product.original_price, product.current_price);
  const scarcityPct = Math.max(0, Math.min(100, ((15 - product.scarcity_level) / 15) * 100));

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
          <Link href="/" className="hover:text-orange-500 transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-600">{product.category}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Images */}
          <div className="w-full lg:w-1/2 relative">
            <ImageGallery images={product.images || []} title={product.title} />
            {discount > 0 && (
              <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white font-black px-4 py-2 rounded-2xl shadow-xl shadow-orange-200 animate-bounce text-sm">
                %{discount} İndirim
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-orange-50 text-orange-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-orange-100">
                  {product.source_platform}
                </span>
                <div className="flex items-center gap-1">
                  <span className="stars text-sm">{"★".repeat(Math.round(product.rating))}</span>
                  <span className="text-sm font-bold text-gray-600">{product.rating.toFixed(1)} / 5</span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
                {product.title}
              </h1>
              
              <p className="text-gray-500 leading-relaxed text-lg">
                {product.description}
              </p>
            </div>

            {/* Pricing Section */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-gray-400 line-through text-lg font-medium">
                    {formatPrice(product.original_price, product.currency)}
                  </div>
                  <div className="text-orange-500 text-5xl font-black font-poppins">
                    {formatPrice(product.current_price, product.currency)}
                  </div>
                </div>
                <div className="bg-green-50 text-green-600 text-xs font-black px-3 py-1.5 rounded-xl border border-green-100 uppercase tracking-wider mb-2">
                  En Düşük Fiyat
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-bold">Stok Durumu:</span>
                  <span className="text-red-500 font-black">Son {product.scarcity_level} adet!</span>
                </div>
                <div className="scarcity-bar h-2.5 bg-gray-100 rounded-full">
                  <div className="scarcity-fill rounded-full" style={{ width: `${scarcityPct}%` }} />
                </div>
              </div>


              <div className="pt-4">
                <Link 
                  href={product.affiliate_link || product.source_url || "#"} 
                  target="_blank"
                  className="btn-yakala w-full py-5 text-xl flex items-center justify-center gap-3 shadow-xl shadow-orange-100"
                >
                  🎯 Şimdi Yakala
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                  Seni otomatik olarak satıcı sayfasına yönlendireceğiz
                </p>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-xl">🛡️</div>
                <div className="text-xs">
                  <div className="font-black text-gray-900">Güvenli Yönlendirme</div>
                  <div className="text-gray-500">Resmi Satıcı Sayفası</div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-xl">✅</div>
                <div className="text-xs">
                  <div className="font-black text-gray-900">Doğrulanmış Fırsat</div>
                  <div className="text-gray-500">Ekibimiz Tarafından Seçildi</div>
                </div>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-orange-50/50 p-4 rounded-2xl border border-orange-100/30">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <span className="font-bold">
                <span className="text-orange-600">{product.social_proof_count} kişi</span> bu fırsatla ilgileniyor
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
