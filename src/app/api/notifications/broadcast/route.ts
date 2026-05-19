import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Server error: SUPABASE_SERVICE_ROLE_KEY is not configured." }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      serviceRoleKey
    );

    // 1. Verify Admin via secret key
    const body = await req.json();
    const { title, message, type, link_url, secret } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify admin secret - Use environment variable only, remove hardcoded fallback
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 2. Get all users from auth.users
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError || !users) {
      throw new Error("Kullanıcılar alınamadı: " + (userError?.message || "Bilinmeyen hata"));
    }

    if (users.length === 0) {
      return NextResponse.json({ message: "Kullanıcı bulunamadı" });
    }

    // 3. Prepare notifications array
    const notifications = users.map((u) => ({
      user_id: u.id,
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
