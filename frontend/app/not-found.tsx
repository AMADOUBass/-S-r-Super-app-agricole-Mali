'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-8xl mb-6 animate-bounce-slow">🌾</div>
        <h1 className="text-6xl font-black text-foreground mb-3">404</h1>
        <p className="text-xl font-bold text-foreground-2 mb-2">Page introuvable</p>
        <p className="text-sm text-muted-fg mb-8 max-w-xs">
          Cette page n'existe pas ou a été déplacée. Revenez au marché.
        </p>
        <div className="flex gap-3">
          <Link href="/" className="btn btn-primary">Accueil</Link>
          <Link href="/produits" className="btn btn-secondary">Voir les récoltes</Link>
        </div>
      </main>
    </div>
  );
}
