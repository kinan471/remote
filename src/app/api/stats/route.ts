import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { count } = await supabase
    .from("site_visits")
    .select("*", { count: "exact", head: true });

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: clickData } = await supabase
    .from("products")
    .select("click_count");

  const totalClicks = clickData?.reduce((sum, p) => sum + (p.click_count || 0), 0) || 0;

  return NextResponse.json({
    visits: count || 0,
    products: productCount || 0,
    clicks: totalClicks,
  });
}

export async function POST(req: Request) {
  const { page = "/" } = await req.json().catch(() => ({}));
  await supabase.from("site_visits").insert([{ page }]);
  return NextResponse.json({ success: true });
}
