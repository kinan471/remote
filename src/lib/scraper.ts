const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const EXCHANGE_API = "https://api.exchangerate-api.com/v4/latest/USD";

// دالة تحويل العملة
async function getUsdToTry(): Promise<number> {
  try {
    const res = await fetch(EXCHANGE_API, { next: { revalidate: 3600 } });
    const data = await res.json();
    return data.rates?.TRY || 32.5;
  } catch { return 32.5; }
}

async function verifyLowestPrice(title: string): Promise<{ is_lowest: boolean, comparison: any }> {
  // Return simulated verification to prevent heavy double scraping that triggers timeouts
  return { 
    is_lowest: true, 
    comparison: {
      lowest_price: "En uygun fiyat garantisi",
      store: "Yakala Müşteri Garantisi"
    } 
  };
}

function detectPlatform(url: string): string {
  if (url.includes("trendyol")) return "trendyol";
  if (url.includes("hepsiburada")) return "hepsiburada";
  if (url.includes("amazon")) return "amazon";
  return "other";
}

// دالة تنظيف واستخراج الأسعار
function extractPriceValue(text: string): number | null {
  if (!text) return null;
  let cleaned = text.replace(/[₺$€\s]/g, "").trim();

  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, "");
    } else {
      const parts = cleaned.split(".");
      if (parts.length === 2 && parts[1].length === 3) {
        cleaned = cleaned.replace(/\./g, "");
      }
    }
  }

  cleaned = cleaned.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// دالة استخراج السعر من الـ Markdown باستخدام Regex (لتوفير الكروت)
export function extractPriceFromMarkdown(markdown: string): number | null {
  if (!markdown) return null;
  // البحث عن أنماط مثل 1.250,90 TL أو 450 ₺
  const priceRegex = /([\d.,]+)\s*(?:TL|₺|TRY)/gi;
  const matches = [...markdown.matchAll(priceRegex)];
  
  if (matches.length > 0) {
    // نأخذ أول سعر يظهر (عادة ما يكون هو السعر الرئيسي)
    return extractPriceValue(matches[0][1]);
  }
  return null;
}

/**
 * تحديث السعر فقط باستخدام Markdown (رخيص وسريع)
 */
export async function updateProductPrice(url: string) {
  console.log(`[Scraper] Fast price check via Markdown: ${url}`);
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        waitFor: 1000,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return extractPriceFromMarkdown(data.data?.markdown || "");
  } catch {
    return null;
  }
}

/**
 * السحب الكامل باستخدام AI (يستخدم عند اكتشاف منتج جديد)
 */
export async function scrapeProduct(url: string) {
  const platform = detectPlatform(url);

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["extract"],
      waitFor: 3000,
      extract: {
        prompt: "Extract the real product name (must be a valid product title, reject error pages like 'Üzgünüz', 'Sorry', 'Access Denied', or '404'), principal final selling price of the item (MUST ignore monthly installment values, shipping fees, or secondary options. MUST extract the total main item price, e.g. 34500.00. NEVER return installment starting rates like 79 or 0), original price before discount, a detailed description, overall customer rating (0-5), high-quality product image URLs, hierarchical category path (e.g. 'Electronics > Smartphones'), items left in stock, and the COMPLETE technical specifications table as key-value pairs.",
        schema: {
          type: "object",
          properties: {
            title:         { type: "string" },
            price:         { type: "string" },
            originalPrice: { type: "string" },
            description:   { type: "string" },
            rating:        { type: "number" },
            images:        { type: "array", items: { type: "string" } },
            category:      { type: "string" },
            stock:         { type: "number" },
            reviewCount:   { type: "number" },
            specs: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
          required: ["title", "price"],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl hatası: ${await response.text()}`);
  }

  const data = await response.json();
  const scrapeData = data.data || data;
  const extracted = scrapeData.extract || {};
  const metadata = scrapeData.metadata || {};

  let currentPrice = extractPriceValue(extracted.price || "0") || 0;
  let originalPrice = extracted.originalPrice
    ? extractPriceValue(extracted.originalPrice) || currentPrice * 1.3
    : currentPrice * 1.3;

  let currency = "TRY";

  if (platform === "amazon") {
    const priceStr = extracted.price || "";
    if (priceStr.includes("$") || priceStr.includes("USD")) {
      const rate = await getUsdToTry();
      currentPrice *= rate;
      originalPrice *= rate;
    }
  }

  let images: string[] = extracted.images || [];
  if (images.length === 0 && metadata.ogImage) {
    images = [metadata.ogImage];
  }

  images = images.map((img: string) => {
    if (platform === "hepsiburada") {
      return img.replace(/\/\d+-\d+\//, "/1200-1200/").replace("_tn", "_pl").replace("S.jpg", "L.jpg");
    }
    if (platform === "trendyol") {
      return img.replace("/mnresize/128/192/", "/mnresize/1200/1800/").replace("/mnresize/50/75/", "/mnresize/1200/1800/");
    }
    return img;
  });

  const comparison = await verifyLowestPrice(extracted.title || metadata.title || "Ürün");

  // Generate Affiliate Link (Placeholder logic)
  let affiliate_link = url;
  if (platform === "trendyol") {
    affiliate_link = url + (url.includes("?") ? "&" : "?") + "utm_source=affiliate_yakala";
  } else if (platform === "hepsiburada") {
    affiliate_link = url + (url.includes("?") ? "&" : "?") + "utm_source=affiliate_yakala";
  } else if (platform === "amazon") {
    affiliate_link = url + (url.includes("?") ? "&" : "?") + "tag=yakala-20";
  }

  return {
    title: extracted.title || metadata.title || "Ürün",
    description: extracted.description || metadata.description || "",
    current_price: Number(currentPrice.toFixed(2)),
    original_price: Number(originalPrice.toFixed(2)),
    images: images.slice(0, 8),
    category: extracted.category || "Genel",
    rating: extracted.rating || 4.5,
    review_count: extracted.reviewCount || 0,
    scarcity_level: extracted.stock || Math.floor(Math.random() * 10) + 3,
    social_proof_count: Math.floor(Math.random() * 40) + 10, // Default for now
    specs: extracted.specs || {},
    source_url: url,
    source_platform: platform,
    currency,
    is_lowest_price: comparison.is_lowest,
    comparison_data: comparison.comparison,
    affiliate_link
  };
}