'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push('/main');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw error;
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setName('');
        setError('新規登録が完了しました。ログインしてください。');
        return;
      }
    } catch (error: any) {
      setError(isLogin ? 'ログインに失敗しました。メールアドレスとパスワードを確認してください。' : '新規登録に失敗しました。入力内容を確認してください。');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>保育士イベントアイディア</h1>
      <div className={styles.loginContainer}>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label className={styles.label}>名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className={styles.input}
                placeholder="山田 花子"
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.label}>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="example@email.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>
          {error && <div className={`${styles.error} ${error.includes('完了') ? styles.success : ''}`}>{error}</div>}
          <button type="submit" className={styles.loginButton}>
            {isLogin ? 'ログイン' : '新規登録'}
          </button>
        </form>
        <div className={styles.signupLink}>
          {isLogin ? (
            <>アカウントをお持ちでない方は<button onClick={() => setIsLogin(false)} className={styles.switchButton}>新規登録</button></>
          ) : (
            <>アカウントをお持ちの方は<button onClick={() => setIsLogin(true)} className={styles.switchButton}>ログイン</button></>
          )}
        </div>
      </div>
    </div>
  );
}
