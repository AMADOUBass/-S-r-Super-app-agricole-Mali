'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePrixDuJour, useHistoriquePrix } from '@/lib/queries';

function GraphiquePrix({ produit, region }: { produit: string; region: string }) {
  const { data, isLoading } = useHistoriquePrix(produit, region);

  if (isLoading) return <div className="h-16 skeleton rounded-xl mx-4 mb-4 mt-2" />;
  if (!data || data.length < 2) return (
    <p className="text-xs text-muted-fg text-center py-4 italic px-4">
      L'historique se construit jour après jour — revenez demain
    </p>
  );

  const min = Math.min(...data.map((d: { prixKg: number }) => d.prixKg));
  const max = Math.max(...data.map((d: { prixKg: number }) => d.prixKg));
  const range = max - min || 1;
  const W = 300; const H = 64;

  const pts = data.map((d: { prixKg: number }, i: number) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.prixKg - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  });
  const points = pts.join(' ');

  const dernier = data[data.length - 1];
  const avant = data[data.length - 2];
  const hausse = dernier.prixKg >= avant.prixKg;
  const color = hausse ? '#15803d' : '#dc2626';

  return (
    <div className="px-4 pb-4">
      <div className="flex justify-between text-xs text-muted-fg mb-2">
        <span className="font-medium">30 derniers jours</span>
        <span className={`font-bold flex items-center gap-1 ${hausse ? 'text-primary-700' : 'text-red-600'}`}>
          {hausse
            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
          }
          {dernier.prixKg.toLocaleString('fr')} FCFA/kg
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 rounded-lg overflow-hidden">
        <defs>
          <linearGradient id={`grad-${produit}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#grad-${produit})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dernier point */}
        <circle
          cx={(data.length - 1) / (data.length - 1) * W}
          cy={pts[pts.length - 1].split(',')[1]}
          r="4"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-fg mt-1.5 font-medium">
        <span>{new Date(data[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}

const REGIONS = ['BAMAKO', 'SIKASSO', 'SEGOU', 'MOPTI', 'KAYES', 'KOULIKORO', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'];

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️',
};

const EMOJI_BG: Record<string, string> = {
  MIL: 'bg-primary-50', SORGHO: 'bg-primary-50', MAIS: 'bg-yellow-50',
  RIZ: 'bg-slate-50', ARACHIDE: 'bg-amber-50', NIEBE: 'bg-orange-50',
  MANGUE: 'bg-yellow-50', OIGNON: 'bg-purple-50', TOMATE: 'bg-red-50',
  KARITE: 'bg-primary-50', SESAME: 'bg-amber-50', COTON: 'bg-sky-50',
};

export default function PageMarche() {
  const [region, setRegion] = useState('BAMAKO');
  const [produitSelectionne, setProduitSelectionne] = useState<string | null>(null);
  const { data: prix, isLoading } = usePrixDuJour(region);

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* En-tête sticky premium */}
        <div className="filter-bar">
          <div className="max-w-6xl mx-auto px-4 pt-3 pb-2.5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-fg capitalize font-medium">{dateLabel}</p>
                <p className="text-base font-black text-foreground mt-0.5">Prix du marché</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                </span>
                En direct
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => { setRegion(r); setProduitSelectionne(null); }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all duration-200 ${
                    region === r
                      ? 'bg-primary-700 text-white shadow-sm scale-105'
                      : 'bg-surface-3 text-foreground-3 hover:bg-surface-2 hover:text-foreground'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-4 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-20" />
                      <div className="skeleton h-3 w-14" />
                    </div>
                  </div>
                  <div className="skeleton h-7 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : prix && prix.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prix.map((p: { id: string; produit: string; prixKg: number; date: string }, idx: number) => {
                const open = produitSelectionne === p.produit;
                return (
                  <div
                    key={p.id}
                    className="card overflow-hidden hover:shadow-card-hover transition-all duration-300 animate-fade-up"
                    style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                  >
                    <button
                      onClick={() => setProduitSelectionne(open ? null : p.produit)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${EMOJI_BG[p.produit] || 'bg-surface-3'} flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                          {EMOJI[p.produit] || '📦'}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-[15px]">
                            {p.produit.charAt(0) + p.produit.slice(1).toLowerCase()}
                          </div>
                          <div className="text-xs text-muted-fg font-medium">
                            {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 border border-primary-200 rounded-xl px-3 py-1.5 text-right">
                          <div className="font-black text-primary-700 text-base leading-none">
                            {p.prixKg.toLocaleString('fr')}
                          </div>
                          <div className="text-[10px] text-primary-500 font-semibold mt-0.5">FCFA/kg</div>
                        </div>
                        <div className={`w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center transition-all duration-200 ${open ? 'rotate-180 bg-primary-50' : ''}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={open ? 'text-primary-600' : 'text-muted-fg'}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>
                    </button>
                    {open && (
                      <div className="border-t border-border/50 bg-gradient-to-b from-surface-2 to-white animate-slide-down">
                        <GraphiquePrix produit={p.produit} region={region} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <p className="font-bold text-foreground-3 text-lg">
                Pas encore de prix pour {region.charAt(0) + region.slice(1).toLowerCase()}
              </p>
              <p className="text-sm text-muted-fg mt-1">Revenez demain matin</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-fg mt-8 flex items-center justify-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Prix collectés chaque matin auprès des marchés locaux. Données indicatives.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
