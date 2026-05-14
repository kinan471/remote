import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { scrapeProduct } from "@/lib/scraper";

export async function POST(req: Request) {
  try {
    // Optional basic security for cron jobs (e.g. ?secret=my_cron_secret)
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    
    // In a real app, verify the secret here if it's set in env variables
    // if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Fetch all active products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (fetchError) {
      throw new Error("Failed to fetch products: " + fetchError.message);
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: 0, failed: 0, total: 0, message: "No active products to sync." });
    }

    let successCount = 0;
    let failCount = 0;

    // We process sequentially to avoid rate-limiting Firecrawl
    for (const product of products) {
      try {
        const scraped = await scrapeProduct(product.source_url);
        
        // Update product in DB if price or stock changed
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
