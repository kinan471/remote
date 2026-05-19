import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompareDrawer from "@/components/CompareDrawer";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    default: "Yakala | Türkiye'nin En İyi Teknoloji Fırsat Platformu",
    template: "%s | Yakala",
  },
  description:
    "Yakala ile Trendyol, Hepsiburada ve Amazon'daki en iyi teknoloji fırsatlarını kaçırma! Gerçek indirimler, sınırlı stok, anında teslimat.",
  keywords: "yakala, trendyol fırsatlar, indirim, kampanya, hepsiburada, amazon türkiye, teknoloji fırsatları, laptop, telefon, elektronik",
  manifest: "/manifest.json",
  openGraph: {
    title: "Yakala | Türkiye'nin En İyi Fırsat Platformu",
    description: "Günün en iyi teknoloji fırsatlarını yakala! Sınırlı stok, gerçek indirimler.",
    type: "website",
    locale: "tr_TR",
    siteName: "Yakala",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Yakala - En İyi Teknoloji Fırsatları",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yakala | En İyi Teknoloji Fırsatları",
    description: "Günün en iyi teknoloji fırsatlarını yakala!",
    images: ["/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://yakala.com",
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
        <link rel="canonical" href="https://yakala.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
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
