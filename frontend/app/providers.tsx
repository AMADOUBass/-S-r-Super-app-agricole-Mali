// Providers globaux : TanStack Query + état Zustand
// Enveloppe toute l'application

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  // Créer une instance QueryClient par session pour éviter les conflits SSR
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,      // données fraîches pendant 5 min
        gcTime: 10 * 60 * 1000,         // cache gardé 10 min
        retry: 1,                        // 1 seul retry en cas d'échec (réseau lent)
        refetchOnWindowFocus: false,     // pas de re-fetch au focus (économie data)
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '16px', fontWeight: 'bold', fontSize: '14px' },
          success: { style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } },
          error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
