'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { LoadingProvider } from '@/context/LoadingContext';

export default function ClientLayout({ children }) {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </AuthProvider>
    </>
  );
} 