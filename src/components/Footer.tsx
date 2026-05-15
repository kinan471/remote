"use client";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = [
    "Akıllı Mutfak",
    "Ev Temizliği",
    "Beyaz Eşya",
    "Teknoloji",
    "Hava Temizleme"
  ];

  const platforms = [
    { name: "Trendyol", url: "https://www.trendyol.com" },
    { name: "Hepsiburada", url: "https://www.hepsiburada.com" },
    { name: "Amazon.tr", url: "https://www.amazon.com.tr" }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-black text-white font-poppins tracking-tighter">
                Yakala<span className="text-orange-500">.</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Türkiye'nin en gelişmiş yapay zeka destekلي تقنية صيد الصفقات. En ucuz fiyatları, en büyük indirimleri anlık olarak sizin için yakalıyoruz.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all">
                <span className="text-lg">📱</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all">
                <span className="text-lg">📧</span>
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Popüler Kategoriler</h4>
            <ul className="space-y-4">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/category/${encodeURIComponent(cat)}`} className="text-sm hover:text-orange-500 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Platforms */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Desteklenen Mağazalar</h4>
            <ul className="space-y-4">
              {platforms.map((p) => (
                <li key={p.name}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-orange-500 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">İletişim & Haberler</h4>
            <p className="text-sm text-gray-400 mb-4 italic">
              "Fırsatları kaçırmayın, en iyi teknoloji fırsatları e-postanıza gelsin."
            </p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="E-posta adresiniz" 
                className="w-full bg-gray-800 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-orange-500 transition-all text-white"
              />
              <button className="absolute right-2 top-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all">
                KAYDOL
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-gray-500 font-medium">
            © {currentYear} Yakala. Tüm hakları saklıdır. | Türkiye'nin En Ucuz Fırsat Platformu
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-600">
            <Link href="#" className="hover:text-white transition-colors">Gizlilik</Link>
            <Link href="#" className="hover:text-white transition-colors">Kullanım Şartları</Link>
            <Link href="#" className="hover:text-white transition-colors">Künye</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
