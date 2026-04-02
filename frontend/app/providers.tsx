// Providers globaux : TanStack Query + état Zustand
// Enveloppe toute l'application

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

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
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
