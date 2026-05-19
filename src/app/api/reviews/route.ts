import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET - fetch latest approved reviews for footer display
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_reviews")
      .select("id, display_name, rating, experience_text, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;

    // Also get aggregate stats
    const { data: stats } = await supabase
      .from("platform_reviews")
      .select("rating")
      .eq("is_approved", true);

    const totalCount = stats?.length || 0;
    const avgRating = totalCount > 0
      ? (stats!.reduce((sum, r) => sum + r.rating, 0) / totalCount)
      : 0;

    return NextResponse.json({
      reviews: data || [],
      stats: {
        count: totalCount,
        avg: Math.round(avgRating * 10) / 10,
      },
    });
  } catch {
    return NextResponse.json({ reviews: [], stats: { count: 0, avg: 0 } });
  }
}

// POST - submit a new review (requires auth)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, experience_text, feature_suggestion } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Geçersiz puan" }, { status: 400 });
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Kullanıcı";

    // Upsert — one review per user
    const { error } = await supabase
      .from("platform_reviews")
      .upsert({
        user_id: user.id,
        display_name: displayName,
        rating,
        experience_text: experience_text?.trim() || null,
        feature_suggestion: feature_suggestion?.trim() || null,
        is_approved: true,
      }, { onConflict: "user_id" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Hata oluştu" }, { status: 500 });
  }
}
