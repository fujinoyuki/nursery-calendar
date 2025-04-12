"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // ログイン済みなら /items へリダイレクト
        router.replace('/items');
      } else {
        // 未ログインなら /login へリダイレクト
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  // リダイレクト中のローディング表示など (任意)
  return (
    <div>
      <p>読み込み中...</p>
    </div>
  );
}
