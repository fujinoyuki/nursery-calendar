import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      await supabase.auth.exchangeCodeForSession(code);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const cookieStore = cookies();
        await cookieStore.set('session', JSON.stringify(session));
      } else {
        const cookieStore = cookies();
        await cookieStore.delete('session');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return NextResponse.redirect(new URL('/main', request.url));
} 