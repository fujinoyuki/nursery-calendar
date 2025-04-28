'use client';

import styles from './AuthButton.module.css';

export default function AuthButton() {
  const handleLogout = () => {
    try {
      // すべてのクッキーを削除
      document.cookie.split(";").forEach(c => {
        const key = c.trim().split("=")[0];
        if (key) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Supabase関連のローカルストレージをクリア
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // ページをリロード
      window.location.href = '/';
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
      // エラーが発生しても強制的にホームページへ
      window.location.href = '/';
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className={styles.button}
    >
      ログアウト
    </button>
  );
}