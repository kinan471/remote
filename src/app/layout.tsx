import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Yakala | Türkiye'nin En İyi Teknoloji Fırsat Platformu",
  description:
    "Yakala ile Trendyol, Hepsiburada ve Amazon'daki en iyi teknoloji fırsatlarını kaçırma! Gerçek indirimler, sınırlı stok, anında teslimat.",
  keywords: "yakala, trendyol fırsatlar, indirim, kampanya, hepsiburada, amazon türkiye, teknoloji fırsatları",
  openGraph: {
    title: "Yakala | Türkiye'nin En İyi Fırsat Platformu",
    description: "Günün en iyi teknoloji fırsatlarını yakala! Sınırlı stok, gerçek indirimler.",
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
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <Suspense fallback={null}>
          <main className="flex-1">{children}</main>
        </Suspense>
        <Footer />
      </body>
    </html>
  );
}
