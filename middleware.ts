import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
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
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
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

    // 未認証ユーザーが/mainにアクセスしようとした場合、ログインページにリダイレクト
    if (!session && path.startsWith('/main')) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // 認証済みユーザーがルートページにアクセスした場合、/mainにリダイレクト
    if (session && path === '/') {
      const redirectUrl = new URL('/main', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (error) {
    console.error('認証チェックに失敗しました:', error);
    // エラーが発生した場合は、安全のためにログインページにリダイレクト
    if (request.nextUrl.pathname.startsWith('/main')) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }
}

export const config = {
  matcher: ['/', '/main/:path*'],
};
