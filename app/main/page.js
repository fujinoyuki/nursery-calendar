'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../lib/auth';
import MonthGrid from '../components/MonthGrid';

function MainContent() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      // Redirect to login if not authenticated
      router.push('/');
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted || !user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>読み込み中...</h2>
      </div>
    );
  }

  return (
    <div>
      <header style={{ 
        padding: '1.5rem', 
        borderBottom: 'var(--border-width) solid var(--color-text)',
        backgroundColor: 'var(--color-base)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            保育士イベントカレンダー
          </h1>
          
          <button 
            onClick={logout}
            style={{
              backgroundColor: 'var(--color-accent-1)',
              color: 'white',
              border: '3px solid var(--color-text)',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            ログアウト
          </button>
        </div>
      </header>
      
      <main style={{ padding: '2rem 1rem' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          marginBottom: '2rem',
          padding: '1.5rem',
          border: 'var(--border-width) solid var(--color-text)',
          backgroundColor: 'var(--color-accent-3)',
          position: 'relative'
        }}>
          <h2 style={{ 
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: 'bold'
          }}>
            保育イベントアイデア集
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            1月から12月まで、各月に適した保育イベントのアイデアを紹介しています。
            各イベントをクリックすると、詳細な情報が表示されます。
            季節や年齢に合わせたアイディアをお役立てください。
          </p>
        </div>
        
        <MonthGrid />
      </main>
      
      <footer style={{ 
        padding: '2rem 1rem',
        borderTop: 'var(--border-width) solid var(--color-text)',
        backgroundColor: 'var(--color-base)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1rem' }}>
          © 2025 保育士イベントカレンダー | Next.js 13.5で作成
        </p>
      </footer>
    </div>
  );
}

export default function MainPage() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}