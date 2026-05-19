import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const adminEmails = process.env.ADMIN_EMAILS
          ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
          : ['hallabkinan@gmail.com']
        const userEmail = (user.email || '').toLowerCase()
        const isAdmin = adminEmails.includes(userEmail)

        // If user tried to access /admin but is not admin → redirect to login with error
        if (next === '/admin' && !isAdmin) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=unauthorized_email`)
        }

        // Register role: admin or user
        try {
          await supabase.from('user_roles').upsert({
            user_id: user.id,
            email: user.email,
            role: isAdmin ? 'admin' : 'user',
            is_admin: isAdmin,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
        } catch (_) {
          // user_roles table may not exist yet — continue anyway
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
