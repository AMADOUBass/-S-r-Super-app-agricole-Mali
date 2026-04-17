'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CarteAnnonce } from '@/components/ui/CarteAnnonce';
import { MapWrapper } from '@/components/ui/MapWrapper';
import { useElevage } from '@/lib/queries';
import useStore from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import betailImg from '@/public/images/betail.png';

const TYPES = [
  { value: '', label: 'Tous' },
  { value: 'MOUTON', label: '🐑 Mouton' },
  { value: 'BOEUF', label: '🐄 Bœuf' },
  { value: 'CHEVRE', label: '🐐 Chèvre' },
  { value: 'VOLAILLE', label: '🐓 Volaille' },
  { value: 'ANE', label: '🫏 Âne' },
  { value: 'CHEVAL', label: '🐴 Cheval' },
  { value: 'CHAMEAU', label: '🐪 Chameau' },
  { value: 'PORC', label: '🐷 Porc' },
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

export default function PageElevage() {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [vueCarte, setVueCarte] = useState(false);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useElevage({
    type: typeFilter || undefined,
    region: regionFilter || undefined,
    search: search || undefined,
  });
  const utilisateur = useStore(s => s.utilisateur);
  const estAgriculteur = utilisateur?.role === 'AGRICULTEUR';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animaux = (data?.pages as any[])?.flatMap((p: { data: unknown[] }) => p.data) ?? [];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Banner */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(180px, 30vw, 320px)' }}>
          <Image
            src="/images/hero_elevage_v2.webp"
            alt="Élevage au Mali"
            fill
            className="object-cover object-[center_40%]"
            priority
            quality={100}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-950/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-4 pt-10 pb-5 md:pt-16 md:pb-8">
              <div className="flex items-end justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                    Marché
                  </span>
                  <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow">{t('nav.livestock')}</h1>
                  <p className="text-white/65 text-xs md:text-sm mt-0.5">{t('explore.title_elevage')}</p>
                </div>
                {estAgriculteur && (
                  <Link href="/vendre?mode=LIVESTOCK"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white text-rose-800 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Publier
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtres sticky avec marge supérieure */}
        <div className="filter-bar mt-4 mb-2">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-2.5">
            {/* Recherche */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-border bg-surface-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>
            {/* Types */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TYPES.map(typeObj => (
                <button
                  key={typeObj.value}
                  onClick={() => setTypeFilter(typeObj.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all duration-200 ${
                    typeFilter === typeObj.value
                      ? 'bg-rose-600 text-white shadow-sm scale-105'
                      : 'bg-surface-3 text-foreground-3 hover:bg-surface-2 hover:text-foreground'
                  }`}
                >
                  {typeObj === TYPES[0] ? t('common.all') : typeObj.label}
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

        {/* Contenu - Espacement supérieur renforcé */}
        <div className="max-w-6xl mx-auto px-4 py-8">

          {!isLoading && (
            <div className="flex items-center justify-between mb-4 animate-fade-in">
              <p className="text-sm text-muted-fg">
                {animaux.length === 0
                  ? 'Aucun animal'
                  : `${animaux.length} animal${animaux.length > 1 ? 'aux' : ''}`}
                {typeFilter && <span className="font-semibold text-rose-600"> · {typeFilter.toLowerCase()}</span>}
              </p>

              <button
                onClick={() => setVueCarte(!vueCarte)}
                className="flex items-center gap-2 bg-white border border-border px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-surface-2 transition-all cursor-pointer"
              >
                {vueCarte ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> {t('explore.list')}</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> {t('explore.map')}</>
                )}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-3.5 flex gap-3.5" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="skeleton w-[76px] h-[76px] flex-shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : vueCarte ? (
            <div className="w-full h-[60vh] min-h-[400px] mb-8 animate-fade-in">
              <MapWrapper 
                markers={animaux
                  .filter((a: any) => a.latitude && a.longitude)
                  .map((a: any) => ({
                    id: a.id,
                    position: [a.latitude, a.longitude],
                    label: a.type,
                    price: a.prixFcfa,
                    type: a.commune
                  }))
                }
              />
            </div>
          ) : animaux.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {animaux.map((a: any, i: number) => (
                <div
                  key={a.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                >
                  <CarteAnnonce
                    annonce={a}
                    type="animal"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-4xl">
                🐑
              </div>
              <p className="font-bold text-foreground-3 text-lg">{t('explore.no_results')}</p>
              <p className="text-sm text-muted-fg mt-1 mb-6">{t('explore.no_results')}</p>
              <button
                onClick={() => { setTypeFilter(''); setRegionFilter(''); setSearch(''); }}
                className="btn btn-secondary btn-sm"
              >
                {t('common.filter')}
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
