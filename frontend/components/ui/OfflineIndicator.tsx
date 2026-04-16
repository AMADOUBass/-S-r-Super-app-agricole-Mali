'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react'; // L'icône est dispo vu package.json

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Vérifier l'état au chargement initial
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4 animate-fade-up">
      <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold">
        <WifiOff size={18} />
        <span>Vous êtes hors connexion. Certaines données peuvent ne pas être à jour.</span>
      </div>
    </div>
  );
}
