'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CarteAnnonce } from '@/components/ui/CarteAnnonce';
import { useProduits } from '@/lib/queries';
import useStore from '@/store/useStore';

const TYPES = [
  { label: 'Tous', value: '' },
  { label: 'Mil', value: 'MIL' },
  { label: 'Sorgho', value: 'SORGHO' },
  { label: 'Maïs', value: 'MAIS' },
  { label: 'Riz', value: 'RIZ' },
  { label: 'Arachide', value: 'ARACHIDE' },
  { label: 'Niébé', value: 'NIEBE' },
  { label: 'Sésame', value: 'SESAME' },
  { label: 'Coton', value: 'COTON' },
  { label: 'Mangue', value: 'MANGUE' },
  { label: 'Oignon', value: 'OIGNON' },
  { label: 'Tomate', value: 'TOMATE' },
  { label: 'Gombo', value: 'GOMBO' },
  { label: 'Patate', value: 'PATATE_DOUCE' },
  { label: 'Igname', value: 'IGNAME' },
  { label: 'Karité', value: 'KARITE' },
];

const REGIONS = [
  { label: 'Toutes régions', value: '' },
  { label: 'Bamako', value: 'BAMAKO' },
  { label: 'Sikasso', value: 'SIKASSO' },
  { label: 'Ségou', value: 'SEGOU' },
  { label: 'Mopti', value: 'MOPTI' },
  { label: 'Kayes', value: 'KAYES' },
  { label: 'Koulikoro', value: 'KOULIKORO' },
  { label: 'Tombouctou', value: 'TOMBOUCTOU' },
  { label: 'Gao', value: 'GAO' },
  { label: 'Kidal', value: 'KIDAL' },
  { label: 'Ménaka', value: 'MENAKA' },
  { label: 'Taoudéni', value: 'TAOUDENIT' },
];

export default function PageProduits() {
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [search, setSearch] = useState('');
  const utilisateur = useStore(s => s.utilisateur);
  const estAgriculteur = utilisateur?.role === 'AGRICULTEUR';

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useProduits({
    type: typeFilter || undefined,
    region: regionFilter || undefined,
    search: search || undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const produits = (data?.pages as any[])?.flatMap((p: { data: unknown[] }) => p.data) ?? [];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Banner */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(140px, 22vw, 240px)' }}>
          <Image
            src="/images/produit.png"
            alt="Récoltes agricoles Mali"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-6xl mx-auto px-4 pb-5 md:pb-7">
              <div className="flex items-end justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                    Marché
                  </span>
                  <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow">Récoltes</h1>
                  <p className="text-white/65 text-xs md:text-sm mt-0.5">Achetez directement chez l'agriculteur</p>
                </div>
                {estAgriculteur && (
                  <Link href="/vendre"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white text-primary-800 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Publier
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtres sticky */}
        <div className="filter-bar">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-2.5">
            {/* Recherche */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher (commune, description…)"
                className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-border bg-surface-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            {/* Types */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all duration-200 ${
                    typeFilter === t.value
                      ? 'bg-primary-700 text-white shadow-sm scale-105'
                      : 'bg-surface-3 text-foreground-3 hover:bg-surface-2 hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Régions */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {REGIONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRegionFilter(r.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all duration-200 ${
                    regionFilter === r.value
                      ? 'bg-amber-500 text-white shadow-sm scale-105'
                      : 'bg-white text-muted-fg border border-border hover:bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  📍 {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-6xl mx-auto px-4 py-5">

          {/* Résultat count */}
          {!isLoading && (
            <p className="text-sm text-muted-fg mb-4 animate-fade-in">
              {produits.length === 0
                ? 'Aucune annonce'
                : `${produits.length} annonce${produits.length > 1 ? 's' : ''}`}
              {typeFilter && <span className="font-semibold text-primary-700"> · {typeFilter.toLowerCase()}</span>}
              {regionFilter && <span className="font-semibold text-amber-600"> · {regionFilter.toLowerCase()}</span>}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-4 flex gap-4" style={{animationDelay:`${i*60}ms`}}>
                  <div className="skeleton w-[72px] h-[72px] flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : produits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produits.map((p: unknown, i: number) => (
                <div key={(p as { id: string }).id}
                  className="animate-fade-up"
                  style={{animationDelay:`${Math.min(i * 50, 400)}ms`}}>
                  <CarteAnnonce
                    annonce={p as Parameters<typeof CarteAnnonce>[0]['annonce']}
                    type="produit"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4 text-4xl">
                🌾
              </div>
              <p className="font-bold text-foreground-3 text-lg">Aucune annonce trouvée</p>
              <p className="text-sm text-muted-fg mt-1 mb-6">Essayez d'autres filtres</p>
              <button
                onClick={() => { setTypeFilter(''); setRegionFilter(''); setSearch(''); }}
                className="btn btn-secondary btn-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {hasNextPage && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn btn-secondary"
              >
                {isFetchingNextPage ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    Chargement…
                  </>
                ) : 'Charger plus'}
              </button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
