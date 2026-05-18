import { scrapeProduct } from "./scraper";
import { supabase } from "./supabase";
import { autoClassifyFeaturedProducts } from "./products";
import { generateProductFingerprint } from "./scraper-engine/db";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

const DOMAINS = [
  { platform: "trendyol", url: "https://www.trendyol.com" },
  { platform: "hepsiburada", url: "https://www.hepsiburada.com" },
  { platform: "n11", url: "https://www.n11.com" },
];

const DISCOUNT_KEYWORDS = [
  "indirim", "firsat", "kampanya", "deals", "sale", "discount",
  "sepette-ek-indirim", "flas-indirim", "gunun-firsati", "fiyati-dusenler", "kuponlu",
  "elektronik-firsat", "teknoloji-indirimleri", "buyuk-indirim", "mega-indirim"
];

const CATEGORY_KEYWORDS = [
  // Teknoloji (التقنية الأساسية)
  "bilgisayar", "laptop", "dizustu", "telefon", "akilli-telefon", "tablet", "tv", "televizyon", 
  "oyun-konsolu", "playstation", "xbox", "nintendo", "monitor", "ekran-karti", "islemci",
  // Giyilebilir & Ses (الأجهزة الملبوسة والصوت)
  "akilli-saat", "smartwatch", "kulaklik", "bluetooth-kulaklik", "tws", "hoparlor", "soundbar",
  // Elektronik Ev Aletleri (الإلكترونيات المنزلية الذكية)
  "robot-supurge", "airfryer", "espresso", "akilli-ev", "kamera", "fotograf-makinesi"
];

const IGNORED_KEYWORDS = [
  // System/Legal pages
  "privacy", "contact", "about", "help", "account", "login", "kvkk", "yardim", "destek", "iade", "cerez", "membership",
  // Fashion & Accessories (not tech)
  "giyim", "ayakkabi", "moda", "parfum", "kozmetik", "aksesuar", "kilif", "kablo",
  // Baby & Diaper products - استبعاد منتجات الأطفال والحفوضات
  "bebek", "cocuk", "çocuk", "bez", "kulot-bez", "külot-bez", "alt-acma", "islak-mendil",
  "pampers", "sleepy", "molfix", "huggies", "bebiko", "mamurlu", "emzik", "mama",
  // Grocery & Food
  "gida", "gıda", "market", "supermarket", "atistirmalik", "icecek",
  // Clothing
  "tisort", "pantolon", "elbise", "gomlek", "gomlek", "ic-giyim", "sutyen", "corap"
];

/**
 * PHASE 1: DISCOVERY via Map
 * Scans the sitemap/map of the domain and filters for discount-related URLs.
 */
export async function discoverViaSitemap() {
  console.log("[Discovery] Starting Map Discovery Phase...");
  let totalDiscovered = 0;

  for (const domain of DOMAINS) {
    try {
      console.log(`[Discovery] Mapping domain: ${domain.url}`);
      
      // Focus heavily on Hepsiburada by requesting up to 1000 URLs with richer search metrics
      const limit = domain.platform === "hepsiburada" ? 1000 : 100;
      const searchTerms = domain.platform === "hepsiburada" 
        ? "indirim elektronik firsat cep telefonu laptop bilgisayar" 
        : DISCOUNT_KEYWORDS.join(" ");

      const response = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: domain.url,
          search: searchTerms, 
          limit: limit 
        }),
      });

      if (!response.ok) {
        console.error(`[Discovery] Map failed for ${domain.platform}:`, await response.text());
        continue;
      }

      const data = await response.json();
      const links: string[] = data.links || [];
      
      console.log(`[Discovery] Found ${links.length} potential links on ${domain.platform}`);

      const filteredLinks = links.filter(link => {
        const lower = link.toLowerCase();
        
        // 1. Core ignored paths
        const isIgnored = IGNORED_KEYWORDS.some(kw => lower.includes(kw));
        if (isIgnored) return false;

        // 2. Strict Product Page Patterns (Captures REAL product links only)
        if (domain.platform === "trendyol" && /-p-\d+/.test(lower)) {
          return true;
        }
        
        if (domain.platform === "hepsiburada" && /-p-hbcv[a-z0-9]+/i.test(lower)) {
          return true;
        }

        if (domain.platform === "n11" && /-p\d+/i.test(lower)) {
          return true; // e.g. n11 product links end with -PXXXXX usually, or -pXXXXX
        }

        if (domain.platform === "amazon" && /\/dp\/[a-z0-9]+/i.test(lower)) {
          return true;
        }

        // Drop anything else (categories, campaigns, landing pages)
        return false;
      });

      console.log(`[Discovery] Sample filtered links (first 50):`, filteredLinks.slice(0, 50));
      console.log(`[Discovery] Filtered to ${filteredLinks.length} strict product links on ${domain.platform}`);

      // Push to pending_scrapes table
      if (filteredLinks.length > 0) {
        const { error } = await supabase
          .from("pending_scrapes")
          .upsert(
            filteredLinks.map(link => ({
              url: link.split("?")[0], // Clean URL
              platform: domain.platform,
              status: "pending"
            })),
            { onConflict: "url" }
          );

        if (error) {
          console.error(`[Discovery] DB Error during queueing:`, error.message);
        } else {
          totalDiscovered += filteredLinks.length;
        }
      }

    } catch (err) {
      console.error(`[Discovery] Critical error on ${domain.platform}:`, err);
    }
  }

  return totalDiscovered;
}

/**
 * PHASE 2: WORKER
 * Processes the queue in parallel with a concurrency limit.
 */
export async function processQueue(limit = 3) {
  console.log(`[Worker] Processing queue with batch size limit: ${limit}`);
  
  // 1. Get pending and failed tasks (with retry limit)
  const { data: tasks, error } = await supabase
    .from("pending_scrapes")
    .select("*")
    .in("status", ["pending", "failed"])
    .or("attempts.lt.3,attempts.is.null")
    .order("status", { ascending: false }) // prioritize pending over failed
    .limit(limit); // Batch size

  if (error || !tasks || tasks.length === 0) {
    console.log("[Worker] No pending or retriable tasks found.");
    return 0;
  }

  // 2. Process in parallel (using Promise.all with simple chunking or just all since limit is small)
  // For a real production app, use a proper queue with p-limit
  const results = await Promise.allSettled((tasks as any[]).map(async (task: any) => {
    try {
      // Mark as processing
      await supabase.from("pending_scrapes").update({ status: "processing" }).eq("id", task.id);
      
      const product = await scrapeProduct(task.url);
      
      // Strict product validation checks
      const titleLower = product.title.toLowerCase();
      const isBlocked = [
        "üzgünüz", "sorry", "access denied", "robot", "captcha", "security check", 
        "sayfa bulunamadı", "giriş yap", "oturum aç", "404", "error", "sitemiz", "bulunamadı"
      ].some(kw => titleLower.includes(kw));

      if (isBlocked) {
        throw new Error("Scraped page is a block or error page instead of a real product.");
      }

      if (product.current_price <= 0) {
        throw new Error("Scraped price is zero or invalid.");
      }

      // Tech product validation (premium laptops/monitors/phones cannot be priced suspiciously low)
      const isTech = ["laptop", "dizüstü", "bilgisayar", "telefon", "akıllı telefon", "tablet", "süpürge", "tv", "televizyon", "playstation", "xbox", "monitor", "ekran kartı", "monitör"].some(kw => titleLower.includes(kw));
      if (isTech && product.current_price < 500) {
        throw new Error(`Scraped price for technology product is suspiciously low: ${product.current_price} TL`);
      }

      // Product is already persisted by scrapeProduct -> runScraperEngine.
      // We just validated it further above. If it was invalid, it would have thrown and been marked failed.

      // Mark as completed
      await supabase.from("pending_scrapes").update({ status: "completed" }).eq("id", task.id);
      return true;
    } catch (err: any) {
      console.error("[Worker] Detailed Error Log:", {
        url: task.url,
        error: err.message,
        stack: err.stack
      });
      await supabase.from("pending_scrapes").update({ 
        status: "failed", 
        last_error: err.message,
        attempts: (task.attempts || 0) + 1 
      }).eq("id", task.id);
      return false;
    }
  }));

  const successCount = results.filter(r => r.status === "fulfilled" && r.value === true).length;
  console.log(`[Worker] Completed batch. Success: ${successCount}/${tasks.length}`);
  
  // Dynamically trigger automatic featured classification for the day
  try {
    await autoClassifyFeaturedProducts();
  } catch (fe) {
    console.error("[FeaturedClassifier] Error during automatic classification:", fe);
  }

  return successCount;
}
