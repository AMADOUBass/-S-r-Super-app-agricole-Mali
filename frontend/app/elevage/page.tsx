'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CarteAnnonce } from '@/components/ui/CarteAnnonce';
import { useElevage } from '@/lib/queries';

const TYPES = [
  { value: '', label: 'Tous les animaux' },
  { value: 'MOUTON', label: '🐑 Mouton' },
  { value: 'BOEUF', label: '🐄 Bœuf' },
  { value: 'CHEVRE', label: '🐐 Chèvre' },
  { value: 'VOLAILLE', label: '🐓 Volaille' },
  { value: 'ANE', label: '🫏 Âne' },
];

export default function PageElevage() {
  const [typeFilter, setTypeFilter] = useState('');
  const { data, isLoading } = useElevage({ type: typeFilter || undefined });
  const animaux = data?.pages.flatMap((p: { data: unknown[] }) => p.data) ?? [];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(120px, 20vw, 220px)' }}>
          <Image
            src="/images/betail.png"
            alt="Élevage au Mali"
            fill
            className="object-cover object-[center_40%]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-6xl mx-auto px-4 pb-4 md:pb-6">
              <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow">Élevage</h1>
              <p className="text-white/70 text-xs md:text-sm">Moutons, bœufs, chèvres · Fort avant la Tabaski</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-border sticky top-14 z-20">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TYPES.map(t => (
                <button key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                    typeFilter === t.value
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-surface-3 text-foreground-3 hover:bg-surface-2'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-fg">
              {isLoading ? 'Chargement...' : `${animaux.length} animal${animaux.length > 1 ? 'aux' : ''} disponible${animaux.length > 1 ? 's' : ''}`}
            </p>
            <Link href="/elevage/publier" className="btn btn-primary btn-sm">
              + Vendre un animal
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse flex gap-4">
                  <div className="w-[72px] h-[72px] rounded-lg bg-surface-3 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-3 rounded w-1/2" />
                    <div className="h-3 bg-surface-3 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : animaux.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {animaux.map((a: unknown) => (
                <CarteAnnonce
                  key={(a as { id: string }).id}
                  annonce={a as Parameters<typeof CarteAnnonce>[0]['annonce']}
                  type="animal"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden mb-5" style={{ aspectRatio: '16/9' }}>
                <Image src="/images/betail.png" alt="Bétail" fill className="object-cover object-[center_40%] opacity-60" sizes="400px" />
              </div>
              <p className="font-semibold text-foreground-3">Aucun animal disponible</p>
              <p className="text-sm text-muted-fg mt-1">Revenez bientôt</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
