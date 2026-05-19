import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate a simple session ID from IP + user-agent hash
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const sessionId = Buffer.from(`${ip}-${ua}`).toString("base64").slice(0, 32);

    const userId = user?.id || null;

    switch (type) {
      case "page_view": {
        await supabase.from("page_views").insert({
          page_path: data.path || "/",
          referrer: data.referrer || null,
          session_id: sessionId,
          user_id: userId,
        });
        break;
      }

      case "product_click": {
        await supabase.from("product_clicks").insert({
          product_id: data.product_id,
          product_title: data.product_title || null,
          click_type: data.click_type || "view",
          session_id: sessionId,
          user_id: userId,
        });
        break;
      }

      case "search": {
        if (data.query && data.query.length > 1) {
          await supabase.from("search_queries").insert({
            query: data.query.toLowerCase().trim(),
            results_count: data.results_count || 0,
            session_id: sessionId,
            user_id: userId,
          });
        }
        break;
      }

      case "category_view": {
        await supabase.from("category_interests").insert({
          category: data.category,
          session_id: sessionId,
          user_id: userId,
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Silent fail — analytics should never break the app
    return NextResponse.json({ ok: false });
  }
}
