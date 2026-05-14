import { NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scraper";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    const data = await scrapeProduct(url);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Scrape API error:", err);
    return NextResponse.json(
      { error: err.message || "Ürün bilgileri çekilemedi." },
      { status: 500 }
    );
  }
}
