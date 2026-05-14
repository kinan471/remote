import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Yakala | Türkiye'nin En İyi Fırsat Platformu",
  description:
    "Yakala ile Trendyol, Hepsiburada ve Amazon'daki en iyi fırsatları kaçırma! Gerçek indirimler, sınırlı stok, anında teslimat.",
  keywords: "yakala, trendyol fırsatlar, indirim, kampanya, hepsiburada, amazon türkiye",
  openGraph: {
    title: "Yakala | Türkiye'nin En İyi Fırsat Platformu",
    description: "Günün en iyi fırsatlarını yakala! Sınırlı stok, gerçek indirimler.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-dark-600 mt-20 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="18" fill="#FF6000" opacity="0.15" />
                  <path d="M18 6 L18 26 M10 18 L18 28 L26 18" stroke="#FF6000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="18" cy="28" r="3" fill="#FF6000" />
                </svg>
                <span className="font-black text-white text-lg">yakala<span className="text-orange-500">.</span></span>
              </div>
              <p className="text-dark-400 text-sm text-center">
                © 2025 Yakala. Tüm fırsatlar gerçek zamanlı güncellenmektedir.
              </p>
              <div className="flex items-center gap-4 text-dark-400 text-xs">
                <span>Trendyol Affiliatei</span>
                <span>•</span>
                <span>Gizlilik Politikası</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
