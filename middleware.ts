import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const path = request.nextUrl.pathname;

    // 特殊なログアウトパスの処理
    if (path === '/_logout') {
      const redirectUrl = new URL('/', request.url);
      response = NextResponse.redirect(redirectUrl);
      
      // クッキーを削除
      const cookieNames = ['sb-access-token', 'sb-refresh-token'];
      cookieNames.forEach(name => {
        response.cookies.set({
          name,
          value: '',
          maxAge: 0,
          path: '/',
        });
      });
      
      return response;
    }

    // 通常の認証ルーティング
    if (!session && path.startsWith('/main')) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (session && path === '/') {
      const redirectUrl = new URL('/main', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (error) {
    console.error('認証チェックに失敗しました:', error);
    if (request.nextUrl.pathname.startsWith('/main')) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }
}

export const config = {
  matcher: ['/', '/main/:path*', '/auth/:path*', '/_logout'],
};