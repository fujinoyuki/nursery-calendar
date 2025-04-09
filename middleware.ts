import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => req.cookies.get(name)?.value,
          set: (name, value, options) => res.cookies.set({ name, value, ...options }),
          remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
        },
      }
    );
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // ログインページへのアクセスで既に認証済みの場合
    if (session && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/main', req.url));
    }
    
    // 保護されたルートへのアクセスで未認証の場合
    if (!session && req.nextUrl.pathname.startsWith('/main')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: ['/', '/main/:path*'],
};
