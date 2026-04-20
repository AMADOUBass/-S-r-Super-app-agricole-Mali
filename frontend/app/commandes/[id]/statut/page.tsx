'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function PageStatutCommande() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Flutterwave retourne ici après paiement — on redirige vers la page de suivi
  useEffect(() => {
    router.replace(`/commandes/${id}/payer`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary-600" size={40} />
    </div>
  );
}
