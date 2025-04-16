'use client';

import { createBrowserClient } from '@supabase/ssr';
import styles from './AuthButton.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthButton() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <button onClick={handleLogout} className={styles.button}>
      ログアウト
    </button>
  );
} 