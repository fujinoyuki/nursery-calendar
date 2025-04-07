'use client'
import { useAuth } from '../lib/auth.tsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
      if (!user && !loading) {
        router.push('/login');
      }
    }, [user,loading]);

  if (loading) {
    return <p>読み込み中</p>;
  }
  if(user){
    return <>{children}</>;
  }
  return <></>;
}
export default AuthLayout;