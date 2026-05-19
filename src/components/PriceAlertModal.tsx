"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/supabase";

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  currentPrice: number;
  onAlertCreated: () => void;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  currentPrice,
  onAlertCreated,
}: PriceAlertModalProps) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState<string>(Math.floor(currentPrice * 0.9).toString());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Try to load email from localStorage if they have entered it before
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("yakala_alert_email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Lütfen geçerli bir hedef fiyat girin.");
      return;
    }

    if (priceNum >= currentPrice) {
      setError(`Hedef fiyat güncel fiyattan (${formatPrice(currentPrice, "TRY")}) düşük olmalıdır.`);
      return;
    }

    // Save alert locally
    const savedAlerts = localStorage.getItem("yakala_price_alerts");
    const alerts = savedAlerts ? JSON.parse(savedAlerts) : [];
    
    // Add new alert (or update if already exists)
    const newAlert = {
      productId,
      productTitle,
      email,
      targetPrice: priceNum,
      currentPriceAtSubscription: currentPrice,
      createdAt: new Date().toISOString(),
    };

    const existingIndex = alerts.findIndex((a: any) => a.productId === productId);
    if (existingIndex > -1) {
      alerts[existingIndex] = newAlert;
    } else {
      alerts.push(newAlert);
    }

    localStorage.setItem("yakala_price_alerts", JSON.stringify(alerts));
    localStorage.setItem("yakala_alert_email", email);

    setSuccess(true);
    setTimeout(() => {
      onAlertCreated();
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl border border-gray-100 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900">Takip Başlatıldı!</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-[280px]">
              Fiyat istediğiniz seviyeye düştüğünde size e-posta ile bildirim göndereceğiz.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                🔔 Fiyat Alarmı
              </span>
              <h3 className="mt-3 text-xl font-black text-gray-900 leading-tight">
                Fiyatı Düşünce Haber Ver
              </h3>
              <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
                {productTitle}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100/50">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Güncel Fiyat</span>
                <span>Hedef Fiyat</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-gray-400 line-through">
                  {formatPrice(currentPrice, "TRY")}
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {targetPrice ? formatPrice(parseFloat(targetPrice) || 0, "TRY") : "0 ₺"}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-100">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Hedef Fiyatınız (₺)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Hedeflediğiniz fiyatı girin"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    TRY
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  E-Posta Adresiniz
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="isim@örnek.com"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              Takibi Başlat
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
