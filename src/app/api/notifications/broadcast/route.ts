import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS and insert for all users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin (Basic check via headers/session or body if internal)
    // For a real production app, ensure this endpoint checks the admin's session.
    // Here we'll do a simple check.
    const body = await req.json();
    const { title, message, type, link_url, admin_email } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    // Verify admin
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",");
    if (!adminEmails.includes(admin_email)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // 2. Get all users who have a role (basically all registered users)
    const { data: users, error: userError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id");

    if (userError || !users) {
      throw new Error("Kullanıcılar alınamadı");
    }

    if (users.length === 0) {
      return NextResponse.json({ message: "Kullanıcı bulunamadı" });
    }

    // 3. Prepare notifications array
    const notifications = users.map((u) => ({
      user_id: u.user_id,
      title,
      message,
      type: type || "new_offer",
      link_url: link_url || null,
      is_read: false,
    }));

    // 4. Insert all notifications
    const { error: insertError } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
