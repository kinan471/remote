import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * وظيفة تحديث الجلسة وحماية مسارات الأدمن
 * تضمن هذه الوظيفة أن الإيميلات المحددة فقط في ADMIN_EMAILS هي من تملك حق الوصول
 */
export async function updateSession(request: NextRequest) {
  // إنشاء استجابة مبدئية
  let supabaseResponse = NextResponse.next({
    request,
  })

  // تهيئة عميل Supabase الخاص بالـ Server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // الحصول على بيانات المستخدم الحالي بأمان
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // تحديد المسارات التي تتطلب صلاحيات أدمن
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/admin')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/products') || 
                     request.nextUrl.pathname.startsWith('/api/scrape')

  if (isDashboardRoute || isApiRoute) {
    // 1. جلب قائمة الإيميلات المسموحة من متغيرات البيئة
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email !== "");

    // 2. إذا لم يكن هناك مستخدم مسجل دخول أصلاً
    if (!user) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const userEmail = (user.email || '').toLowerCase();

    // 3. التحقق الجوهري: هل إيميل المستخدم موجود في القائمة البيضاء (Whitelist)؟
    if (!adminEmails.includes(userEmail)) {
      // طرد المستخدم فوراً وإلغاء جلسته لأنه غير مخول
      await supabase.auth.signOut()

      if (isApiRoute) {
        return NextResponse.json({ error: 'Forbidden: You are not an admin' }, { status: 403 })
      }
      // توجيه لصفحة تسجيل الدخول مع رسالة خطأ
      return NextResponse.redirect(new URL('/login?error=unauthorized_email', request.url))
    }

    // 4. حماية إضافية عبر قاعدة البيانات (user_roles table)
    let { data: roleData } = await supabase
      .from('user_roles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    // إذا كان الإيميل صحيحاً ولكن لم يتم تسجيله كأدمن في الداتابيز، قم بتسجيله آلياً
    if (!roleData || !roleData.is_admin) {
      const { data: newRole } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          email: userEmail,
          role: 'admin',
          is_admin: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select('is_admin')
        .single()
      
      roleData = newRole
    }

    // التحقق النهائي من الصلاحية في قاعدة البيانات
    if (!roleData?.is_admin) {
        await supabase.auth.signOut()
        if (isApiRoute) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        return NextResponse.redirect(new URL('/login?error=database_error', request.url))
    }
  }

  return supabaseResponse
}