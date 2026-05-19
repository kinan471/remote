import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Get current user's alerts
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ alerts: [] });
    }

    const { data } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    return NextResponse.json({ alerts: data || [] });
  } catch {
    return NextResponse.json({ alerts: [] });
  }
}

// Create a new price alert
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, product_title, target_price } = body;

    if (!product_id || !target_price || target_price <= 0) {
      return NextResponse.json({ error: "Geçersiz veriler." }, { status: 400 });
    }

    // Insert alert to database
    const { error } = await supabase
      .from("price_alerts")
      .insert({
        user_id: user.id,
        product_id,
        product_title,
        target_price,
        is_active: true,
      });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Hata oluştu." }, { status: 500 });
  }
}
