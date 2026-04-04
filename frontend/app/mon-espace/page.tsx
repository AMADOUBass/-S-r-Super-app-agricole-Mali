'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import useStore from '@/store/useStore';
import { useCommandesVendeur } from '@/lib/queries';

const heure = new Date().getHours();
const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

export default function PageMonEspace() {
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const hasHydrated = useStore(s => s._hasHydrated);
  const { data: commandes } = useCommandesVendeur();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push('/connexion'); return; }
    if (utilisateur?.role === 'ADMIN') { router.replace('/admin'); }
  }, [hasHydrated, token, utilisateur, router]);

  if (!hasHydrated) return null;

  const mesAchats = (commandes as Array<{ acheteur: { telephone: string }; statut: string }> | undefined)
    ?.filter(c => c.acheteur.telephone === utilisateur?.telephone) ?? [];
  const enAttente = mesAchats.filter(c => c.statut === 'EN_ATTENTE').length;

  const roleLabel = utilisateur?.role === 'ACHETEUR' ? 'Acheteur'
    : utilisateur?.role === 'BOUTIQUE' ? 'Boutique / Pro'
    : 'Utilisateur';

  const actions = [
    {
      href: '/produits',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22V12M12 12C12 7 7 4 2 6M12 12C12 7 17 4 22 6"/><path d="M2 6c2 6 5 9 10 10M22 6c-2 6-5 9-10 10"/></svg>,
      iconBg: 'bg-primary-600',
      wrapBg: 'bg-primary-50 border-primary-200 hover:bg-primary-100',
      label: 'Acheter récoltes',
      labelColor: 'text-primary-700',
    },
    {
      href: '/commandes',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
      iconBg: 'bg-amber-500',
      wrapBg: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
      label: 'Mes commandes',
      labelColor: 'text-amber-700',
    },
    {
      href: '/marche',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      iconBg: 'bg-foreground-3',
      wrapBg: 'bg-surface-2 border-border hover:bg-surface-3',
      label: 'Prix du marché',
      labelColor: 'text-foreground-3',
    },
    {
      href: '/meteo',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
      iconBg: 'bg-sky-500',
      wrapBg: 'bg-sky-50 border-sky-200 hover:bg-sky-100',
      label: 'Météo 7 jours',
      labelColor: 'text-sky-700',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 px-4 pt-8 pb-16 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-8 bottom-4 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute left-4 bottom-6 w-20 h-20 rounded-full bg-white/[0.03]" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse-soft" />
              <span className="text-white/80 text-xs font-semibold tracking-wide">{roleLabel}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 animate-fade-up">
              {salutation}, {utilisateur?.nom?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/55 text-sm animate-fade-up delay-75">
              📍 {utilisateur?.commune} · {utilisateur?.region?.charAt(0)}{utilisateur?.region?.slice(1).toLowerCase()}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl border bg-amber-50 border-amber-100 flex items-center justify-center text-lg">🛒</div>
              <div className="text-3xl font-black text-amber-600 mt-1">{mesAchats.length}</div>
              <div className="text-xs font-semibold text-muted-fg leading-tight">Commandes passées</div>
            </div>
            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl border bg-primary-50 border-primary-100 flex items-center justify-center text-lg">⏳</div>
              <div className="text-3xl font-black text-primary-700 mt-1">{enAttente}</div>
              <div className="text-xs font-semibold text-muted-fg leading-tight">En attente</div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card overflow-hidden animate-fade-up delay-100">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-4">
              <h2 className="text-white font-bold text-base">Actions rapides</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {actions.map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all duration-200 group ${a.wrapBg}`}
                >
                  <div className={`w-11 h-11 rounded-xl ${a.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    {a.icon}
                  </div>
                  <span className={`text-xs font-bold text-center leading-tight ${a.labelColor}`}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Dernières commandes */}
          {mesAchats.length > 0 && (
            <div className="card overflow-hidden animate-fade-up delay-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <h2 className="font-bold text-foreground">Dernières commandes</h2>
                <Link href="/commandes" className="text-xs font-semibold text-primary-700 flex items-center gap-1 hover:text-primary-800 transition-colors">
                  Tout voir
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
              <div className="divide-y divide-border/40">
                {(mesAchats as unknown as Array<{ id: string; produit: { type: string }; montantFcfa: number; commission: number; statut: string }>).slice(0, 3).map(c => (
                  <Link
                    key={c.id}
                    href={`/commandes/${c.id}/payer`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {c.produit.type.charAt(0) + c.produit.type.slice(1).toLowerCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        c.statut === 'EN_ATTENTE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        c.statut === 'PAYE' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                        c.statut === 'LIVRE' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {c.statut === 'EN_ATTENTE' ? 'En attente' :
                         c.statut === 'PAYE' ? 'Payée' :
                         c.statut === 'LIVRE' ? 'Livrée' : 'Annulée'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
