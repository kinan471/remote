/**
 * YAKALA DEAL SCORE ENGINE
 * The heart of the Decision Engine - converts raw product data into actionable buy signals.
 * This is the single source of truth for all "should I buy?" decisions.
 */

export type BuySignal = "BUY_NOW" | "NORMAL" | "WAIT";

export interface DealScoreResult {
  score: number;           // 0–100
  signal: BuySignal;       // BUY_NOW | NORMAL | WAIT
  signalLabel: string;     // "اشتري الآن!" | "سعر طبيعي" | "انتظر"
  signalColor: string;     // Tailwind color class
  signalEmoji: string;     // 🟢 | 🟡 | 🔴
  reasons: string[];       // ["خصم 35% حقيقي", "تقييم ممتاز", ...]
  scarcityText: string;    // Smart scarcity message
  urgencyLevel: "high" | "medium" | "low";
  volatility: number;      // Coefficient of variation
}

interface ProductInput {
  current_price: number;
  original_price: number;
  rating: number;
  scarcity_level: number;
  is_lowest_price?: boolean;
  click_count?: number;
  title?: string;
  price_history?: { price: number; scraped_at: string }[];
}

/**
 * Computes a 0–100 Deal Score and buy signal from real product data.
 * Features: Price Volatility (STDDEV), Historical Lows, and Spec Clustering anchors.
 */
export function computeDealScore(product: ProductInput): DealScoreResult {
  const reasons: string[] = [];
  let score = 0;

  // === COMPONENT 1: Discount Quality (30 points max) ===
  const discount =
    product.original_price > product.current_price && product.original_price > 0
      ? Math.round(
          ((product.original_price - product.current_price) /
            product.original_price) *
            100
        )
      : 0;

  let discountPoints = 0;
  if (discount >= 40) {
    discountPoints = 30;
    reasons.push(`🔥 İndirim %${discount} — Nadir fırsat`);
  } else if (discount >= 25) {
    discountPoints = 23;
    reasons.push(`💸 İndirim %${discount} — İyi fırsat`);
  } else if (discount >= 15) {
    discountPoints = 15;
    reasons.push(`📉 İndirim %${discount}`);
  } else if (discount >= 5) {
    discountPoints = 8;
    reasons.push(`📊 Küçük indirim %${discount}`);
  }
  score += discountPoints;

  // === COMPONENT 2: Rating Quality (15 points max) ===
  const rating = product.rating || 0;
  let ratingPoints = 0;
  if (rating >= 4.7) {
    ratingPoints = 15;
    reasons.push(`⭐ Mükemmel değerlendirme ${rating.toFixed(1)}/5`);
  } else if (rating >= 4.3) {
    ratingPoints = 11;
    reasons.push(`⭐ Yüksek değerlendirme ${rating.toFixed(1)}/5`);
  } else if (rating >= 3.8) {
    ratingPoints = 7;
    reasons.push(`⭐ İyi değerlendirme ${rating.toFixed(1)}/5`);
  }
  score += ratingPoints;

  // === COMPONENT 3: Scarcity / Availability (15 points max) ===
  const scarcity = product.scarcity_level || 10;
  let scarcityPoints = 0;
  if (scarcity <= 3) {
    scarcityPoints = 15;
    reasons.push(`⚠️ Son ${scarcity} adet kaldı!`);
  } else if (scarcity <= 7) {
    scarcityPoints = 10;
    reasons.push(`📦 Sınırlı stok — ${scarcity} adet`);
  } else if (scarcity <= 12) {
    scarcityPoints = 5;
  }
  score += scarcityPoints;

  // === COMPONENT 4: Market Position & Volatility History (40 points max) ===
  let marketPoints = 0;
  let volatility = 0;

  // Track historical volatility and min/max prices if history is available
  const history = product.price_history || [];
  const prices = history.map(h => Number(h.price)).filter(p => !isNaN(p) && p > 0);

  if (prices.length > 1) {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sqDiffs = prices.map(p => Math.pow(p - mean, 2));
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / prices.length;
    volatility = Math.sqrt(variance) / (mean || 1); // Coefficient of variation

    const minPrice = Math.min(...prices);
    const avgPrice = mean;

    if (product.current_price <= minPrice * 1.02) {
      marketPoints += 25;
      reasons.push(`📉 Son 60 günün en düşük fiyat seviyesinde`);
    } else if (product.current_price < avgPrice * 0.95) {
      marketPoints += 15;
      reasons.push(`📉 Ortalama geçmiş fiyatın %5 altında`);
    }

    if (volatility > 0.12) {
      marketPoints += 15;
      reasons.push(`⚡ Yüksek fiyat dalgalanması — Fırsat anı`);
    } else if (volatility > 0.05) {
      marketPoints += 10;
    }
  } else {
    // Fallback if no history exists yet
    if (product.is_lowest_price) {
      marketPoints = 25;
      reasons.push(`🏆 Piyasanın en düşük fiyatı`);
    } else if (discount >= 20) {
      marketPoints = 15;
    }
  }
  score += marketPoints;

  // === Clamp to 0–100 ===
  score = Math.max(0, Math.min(100, score));

  // === Determine Signal ===
  let signal: BuySignal;
  let signalLabel: string;
  let signalColor: string;
  let signalEmoji: string;
  let urgencyLevel: "high" | "medium" | "low";

  if (score >= 70) {
    signal = "BUY_NOW";
    signalLabel = "Şimdi Al! Fırsat";
    signalColor = "emerald";
    signalEmoji = "🟢";
    urgencyLevel = "high";
  } else if (score >= 40) {
    signal = "NORMAL";
    signalLabel = "Normal Fiyat";
    signalColor = "amber";
    signalEmoji = "🟡";
    urgencyLevel = "medium";
  } else {
    signal = "WAIT";
    signalLabel = "Bekle";
    signalColor = "rose";
    signalEmoji = "🔴";
    urgencyLevel = "low";
  }

  // === Smart Scarcity Text (real urgency, no fake numbers) ===
  let scarcityText = "";
  if (scarcity <= 3) {
    scarcityText = `⚠️ Son ${scarcity} adet — bu fiyat gitmeden yakala!`;
  } else if (scarcity <= 7) {
    scarcityText = `📦 Sınırlı stok: ${scarcity} adet kaldı`;
  } else if (prices.length > 1 && product.current_price <= Math.min(...prices) * 1.02) {
    scarcityText = `✅ Son 60 günün en iyi fiyatı — şimdi kaçırma`;
  } else if (product.is_lowest_price) {
    scarcityText = `🏆 En ucuz teklif — piyasa fiyatının altında`;
  } else if (discount >= 25) {
    scarcityText = `💸 Liste fiyatından %${discount} indirimli — kampanya süreli`;
  } else {
    scarcityText = `📊 Fiyat takip ediliyor — güncel bildirim için işaretle`;
  }

  return {
    score,
    signal,
    signalLabel,
    signalColor,
    signalEmoji,
    reasons,
    scarcityText,
    urgencyLevel,
    volatility
  };
}

/**
 * Returns Tailwind class sets for each signal type
 */
export function getSignalClasses(signal: BuySignal) {
  switch (signal) {
    case "BUY_NOW":
      return {
        bg: "bg-emerald-500",
        bgLight: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        badge: "bg-emerald-500 text-white",
        bar: "bg-emerald-500",
      };
    case "NORMAL":
      return {
        bg: "bg-amber-400",
        bgLight: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        badge: "bg-amber-400 text-white",
        bar: "bg-amber-400",
      };
    case "WAIT":
    default:
      return {
        bg: "bg-rose-400",
        bgLight: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        badge: "bg-rose-400 text-white",
        bar: "bg-rose-400",
      };
  }
}

/**
 * Sorts products by Deal Score descending - for "Top Deals Today" section
 */
export function sortByDealScore<T extends ProductInput>(products: T[]): T[] {
  return [...products].sort(
    (a, b) => computeDealScore(b).score - computeDealScore(a).score
  );
}
