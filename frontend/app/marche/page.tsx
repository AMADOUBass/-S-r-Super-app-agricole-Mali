'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePrixDuJour } from '@/lib/queries';

const REGIONS = ['BAMAKO', 'SIKASSO', 'SEGOU', 'MOPTI', 'KAYES', 'KOULIKORO'];

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️',
};

export default function PageMarche() {
  const [region, setRegion] = useState('BAMAKO');
  const { data: prix, isLoading } = usePrixDuJour(region);

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* En-tête sticky */}
        <div className="bg-white border-b border-border sticky top-14 z-20">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-fg capitalize">{dateLabel}</p>
                <p className="text-sm font-bold text-foreground">Prix du jour</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                En direct
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {REGIONS.map(r => (
                <button key={r}
                  onClick={() => setRegion(r)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                    region === r
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'bg-surface-3 text-foreground-3 hover:bg-surface-2'
                  }`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-5">
          {isLoading ? (
            /* Skeleton 2 colonnes sur desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-3" />
                    <div className="h-4 bg-surface-3 rounded w-24" />
                  </div>
                  <div className="h-6 bg-surface-3 rounded w-28" />
                </div>
              ))}
            </div>
          ) : prix && prix.length > 0 ? (
            /* 1 col mobile → 2 col desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prix.map((p: { id: string; produit: string; prixKg: number; date: string }) => (
                <div key={p.id} className="card flex items-center justify-between px-4 py-3.5 hover:shadow-card-hover transition-shadow">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{EMOJI[p.produit] || '📦'}</span>
                    <div>
                      <div className="font-semibold text-foreground">
                        {p.produit.charAt(0) + p.produit.slice(1).toLowerCase()}
                      </div>
                      <div className="text-xs text-muted-fg">
                        {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary-700">
                      {p.prixKg.toLocaleString('fr')}
                    </div>
                    <div className="text-xs text-muted-fg">FCFA/kg</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <p className="font-semibold text-foreground-3">Pas encore de prix pour {region.charAt(0) + region.slice(1).toLowerCase()}</p>
              <p className="text-sm text-muted-fg mt-1">Revenez demain matin</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-fg mt-8">
            Prix collectés chaque matin auprès des marchés locaux. Données indicatives.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
