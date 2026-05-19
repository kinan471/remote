import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompareDrawer from "@/components/CompareDrawer";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Yakala | Türkiye'nin En İyi Teknoloji Fırsat Platformu",
  description:
    "Yakala ile Trendyol, Hepsiburada ve Amazon'daki en iyi teknoloji fırsatlarını kaçırma! Gerçek indirimler, sınırlı stok, anında teslimat.",
  keywords: "yakala, trendyol fırsatlar, indirim, kampanya, hepsiburada, amazon türkiye, teknoloji fırsatları",
  manifest: "/manifest.json",
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
        <meta name="theme-color" content="#FF6000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Yakala" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <Suspense fallback={null}>
          <main className="flex-1">{children}</main>
        </Suspense>
        <CompareDrawer />
        <Footer />
      </body>
    </html>
  );
}
