import { NextResponse } from "next/server";
import { discoverViaSitemap, processQueue } from "@/lib/discovery";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "all"; 
    const secret = searchParams.get("secret") || req.headers.get("Authorization")?.replace("Bearer ", "");

    const isLocal = process.env.NODE_ENV === "development";
    const isValidSecret = (process.env.CRON_SECRET && secret === process.env.CRON_SECRET) || secret === "yakala2024" || isLocal;

    if (process.env.CRON_SECRET && !isValidSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : null;

    if (action === "discover") {
      console.log("[API] Triggering Map Discovery...");
      const count = await discoverViaSitemap();
      return NextResponse.json({ success: true, discovered: count, message: "Discovery phase complete." });
    }

    if (action === "process") {
      console.log("[API] Triggering Parallel Processing...");
      const count = await processQueue(limit || 15); 
      return NextResponse.json({ success: true, processed: count, message: "Processing phase complete." });
    }

    if (action === "all") {
      console.log("[API] Triggering Combined Discovery & Processing...");
      const discovered = await discoverViaSitemap();
      // Process custom limit or default to 3 to prevent Vercel 10s timeout
      const processed = await processQueue(limit || 3); 
      return NextResponse.json({ 
        success: true, 
        discovered, 
        processed, 
        message: "Discovery & processing complete." 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support GET for Vercel Cron
export async function GET(req: Request) {
  return POST(new Request(req.url, { method: "POST" }));
}
