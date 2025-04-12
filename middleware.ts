import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();
  let supabase;

  try {
    // Supabaseクライアントの初期化をtry-catchブロックの外で行う
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            });
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            res.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
  } catch (error) {
    console.error('Error initializing Supabase client in middleware:', error);
    // Supabaseクライアント初期化エラーの場合でも、デフォルトのレスポンスを返す
    return res;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;

    // ログイン済みの場合のリダイレクト処理
    if (session) {
      // ログイン/新規登録ページにアクセスしようとしたら /items へリダイレクト
      if (pathname === '/login' || pathname === '/register') {
        return NextResponse.redirect(new URL('/items', req.url));
      }
    } else {
      // 未ログインの場合のリダイレクト処理
      // 保護されたルート (itemsなど) にアクセスしようとしたら /login へリダイレクト
      // 注意: `/` は未ログイン時のデフォルトリダイレクト先になるので、通常は保護しない
      if (pathname.startsWith('/items')) { 
        return NextResponse.redirect(new URL('/login', req.url));
      }
      // 認証が必要な他のルートがあればここに追加
      // if (pathname.startsWith('/protected-route')) { ... }
    }

    return res;
  } catch (error) {
    console.error('Middleware session/redirect error:', error);
    // エラーが発生した場合でも、リクエストを続行させる（またはエラーページにリダイレクト）
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
