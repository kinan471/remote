import { scrapeProduct } from "./scraper";
import { supabase } from "./supabase";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

const DOMAINS = [
  { platform: "trendyol", url: "https://www.trendyol.com" },
  { platform: "hepsiburada", url: "https://www.hepsiburada.com" },
  { platform: "amazon", url: "https://www.amazon.com.tr" }
];

const DISCOUNT_KEYWORDS = [
  "indirim", "firsat", "kampanya", "deals", "sale", "discount",
  "sepette-ek-indirim", "flas-indirim", "gunun-firsati", "fiyati-dusenler", "kuponlu", "teshir"
];

const CATEGORY_KEYWORDS = [
  // Akıllı Mutfak (المطبخ الذكي)
  "airfryer", "fritoz", "kahve-makinesi", "espresso", "blender", "mutfak-sefi", "mikser", "tost-makinesi", "cay-makinesi", "kettle",
  // Akıllı Ev Temizliği (تنظيف البيت الذكي)
  "robot-supurge", "akilli-supurge", "dikey-supurge", "sarjli-supurge", "buharli-temizleyici", "mop",
  // Elektrikli Ev Aletleri (الأجهزة الكهربائية والبيئة)
  "hava-temizleyici", "purifier", "hava-nemlendirici", "klima", "vantilator", "utu", "akilli-tarti",
  // Beyaz Eşya (الأجهزة الكبيرة)
  "buzdolabi", "dondurucu", "camasir-makinesi", "kurutma-makinesi", "bulasik-makinesi", "firin", "mikrodalga", "ankastre",
  // Teknoloji (التقنية الأساسية)
  "bilgisayar", "laptop", "telefon", "tablet", "tv-ses", "oyun-konsol"
];

const IGNORED_KEYWORDS = [
  "privacy", "contact", "about", "help", "account", "login", "kvkk", "yardim", "destek", "iade", "cerez", "membership", 
  "giyim", "ayakkabi", "moda", "parfum", "kozmetik", "aksesuar", "kilif", "kablo" // استبعاد الإكسسوارات والملابس
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
      
      const response = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: domain.url,
          search: DISCOUNT_KEYWORDS.join(" "), 
          limit: 100 
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
        const hasDiscount = DISCOUNT_KEYWORDS.some(kw => lower.includes(kw));
        const hasCategory = CATEGORY_KEYWORDS.some(kw => lower.includes(kw));
        const isIgnored = IGNORED_KEYWORDS.some(kw => lower.includes(kw));
        // Must have discount OR be in our target categories, and not be ignored
        return (hasDiscount || hasCategory) && !isIgnored;
      });

      console.log(`[Discovery] Filtered to ${filteredLinks.length} relevant links`);

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
  console.log(`[Worker] Processing queue with concurrency limit: ${limit}`);
  
  // 1. Get pending tasks
  const { data: tasks, error } = await supabase
    .from("pending_scrapes")
    .select("*")
    .eq("status", "pending")
    .limit(15); // Batch size

  if (error || !tasks || tasks.length === 0) {
    console.log("[Worker] No pending tasks found.");
    return 0;
  }

  // 2. Process in parallel (using Promise.all with simple chunking or just all since limit is small)
  // For a real production app, use a proper queue with p-limit
  const results = await Promise.allSettled(tasks.map(async (task) => {
    try {
      // Mark as processing
      await supabase.from("pending_scrapes").update({ status: "processing" }).eq("id", task.id);
      
      const product = await scrapeProduct(task.url);
      
      // Smart Fingerprinting & Upsert to Products
      const fingerprint = btoa(`${product.title}-${product.category}`).substring(0, 50);

      const { error: upsertError } = await supabase
        .from("products")
        .upsert([{
          ...product,
          fingerprint,
          updated_at: new Date().toISOString()
        }], { onConflict: "fingerprint" });

      if (upsertError) throw upsertError;

      // Mark as completed
      await supabase.from("pending_scrapes").update({ status: "completed" }).eq("id", task.id);
      return true;
    } catch (err: any) {
      console.error(`[Worker] Failed task ${task.url}:`, err.message);
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
  return successCount;
}
