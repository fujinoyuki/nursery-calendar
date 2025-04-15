'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './lib/auth';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 