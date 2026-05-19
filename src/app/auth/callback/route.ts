import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const adminEmails = process.env.ADMIN_EMAILS
          ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
          : ['hallabkinan@gmail.com'];
        const userEmail = (user.email || '').toLowerCase();
        const isAdmin = adminEmails.includes(userEmail);
        
        if (!isAdmin) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=unauthorized_email`)
        }
        
        await supabase.from('user_roles').upsert({
          user_id: user.id,
          email: user.email,
          role: 'admin',
          is_admin: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
