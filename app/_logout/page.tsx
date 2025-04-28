'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      // Supabaseインスタンスの作成
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      try {
        // まずローカルでサインアウト
        await supabase.auth.signOut({ scope: 'local' });
      } catch (error) {
        console.error('ログアウトエラー:', error);
      }
      
      // クッキーをクリア
      document.cookie.split(";").forEach(c => {
        document.cookie = c.trim().split("=")[0] + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      });
      
      // ローカルストレージをクリア
      localStorage.clear();
      
      // ホームページへリダイレクト
      window.location.href = '/';
    };
    
    performLogout();
  }, []);
  
  return <div>ログアウト中...</div>;
}