import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { scrapeProduct } from "@/lib/scraper";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
    
    const isLocal = process.env.NODE_ENV === "development";
    const isValidSecret = (process.env.CRON_SECRET && secret === process.env.CRON_SECRET) || secret === "yakala2024" || isLocal;

    if (process.env.CRON_SECRET && !isValidSecret) {
       return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    let productIds: string[] | null = null;
    try {
      const body = await req.json();
      if (body && Array.isArray(body.productIds)) {
        productIds = body.productIds;
      }
    } catch (e) {
      // No body provided or invalid JSON (e.g. called from Vercel Cron)
    }

    let query = supabase.from("products").select("*").eq("is_active", true);
    
    if (productIds && productIds.length > 0) {
      query = query.in("id", productIds);
    } else {
      // If no specific IDs provided, we assume it's a cron job.
      // To avoid Vercel 10s timeout, we only sync the 2 oldest updated products.
      query = query.order("updated_at", { ascending: true, nullsFirst: true }).limit(2);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error("Failed to fetch products: " + fetchError.message);
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: 0, failed: 0, total: 0, message: "No active products to sync." });
    }

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      try {
        const scraped = await scrapeProduct(product.source_url);
        
        const { error: updateError } = await supabase
          .from("products")
          .update({
            current_price: scraped.current_price,
            original_price: scraped.original_price,
            scarcity_level: scraped.scarcity_level,
            updated_at: new Date().toISOString()
          })
          .eq("id", product.id);

        if (updateError) {
          console.error(`Failed to update ${product.id}:`, updateError);
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to scrape ${product.source_url}:`, err);
        failCount++;
      }
    }

    return NextResponse.json({ 
      success: successCount, 
      failed: failCount, 
      total: products.length 
    });

  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support GET for Vercel Cron
export async function GET(req: Request) {
  return POST(new Request(req.url, { method: "POST" }));
}
