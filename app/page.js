'use client';

import { AuthProvider } from './lib/auth';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}