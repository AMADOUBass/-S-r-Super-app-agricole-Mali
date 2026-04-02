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
  const { data: commandes } = useCommandesVendeur();

  useEffect(() => {
    if (!token) router.push('/connexion');
  }, [token, router]);

  const mesAchats = (commandes as Array<{ acheteur: { telephone: string }; statut: string }> | undefined)
    ?.filter(c => c.acheteur.telephone === utilisateur?.telephone) ?? [];
  const enAttente = mesAchats.filter(c => c.statut === 'EN_ATTENTE').length;

  const roleLabel = utilisateur?.role === 'ACHETEUR' ? 'Acheteur' : utilisateur?.role === 'BOUTIQUE' ? 'Boutique' : 'Utilisateur';

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 px-4 pt-8 pb-16 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-8 bottom-4 w-32 h-32 rounded-full bg-white/5" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse-soft" />
              <span className="text-white/80 text-xs font-medium">{roleLabel}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 animate-fade-up">
              {salutation}, {utilisateur?.nom?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/60 text-sm animate-fade-up delay-75">
              📍 {utilisateur?.commune} · {utilisateur?.region?.charAt(0)}{utilisateur?.region?.slice(1).toLowerCase()}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <div className="card p-4 text-center">
              <div className="text-4xl font-black text-amber-600 mb-1">{mesAchats.length}</div>
              <div className="text-xs font-semibold text-muted-fg">Commandes passées</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-4xl font-black text-primary-700 mb-1">{enAttente}</div>
              <div className="text-xs font-semibold text-muted-fg">En attente</div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card overflow-hidden animate-fade-up delay-100">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-4">
              <h2 className="text-white font-bold text-base">Actions rapides</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Link
                href="/produits"
                className="flex flex-col items-center gap-2 p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22V12M12 12C12 7 7 4 2 6M12 12C12 7 17 4 22 6"/><path d="M2 6c2 6 5 9 10 10M22 6c-2 6-5 9-10 10"/></svg>
                </div>
                <span className="text-xs font-bold text-primary-700 text-center">Acheter récoltes</span>
              </Link>
              <Link
                href="/commandes"
                className="flex flex-col items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                </div>
                <span className="text-xs font-bold text-amber-700 text-center">Mes commandes</span>
              </Link>
              <Link
                href="/marche"
                className="flex flex-col items-center gap-2 p-4 bg-surface-2 border border-border rounded-xl hover:bg-surface-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground-3 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <span className="text-xs font-bold text-foreground-3 text-center">Prix du marché</span>
              </Link>
              <Link
                href="/elevage"
                className="flex flex-col items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </div>
                <span className="text-xs font-bold text-rose-700 text-center">Élevage</span>
              </Link>
            </div>
          </div>

          {/* Dernières commandes */}
          {mesAchats.length > 0 && (
            <div className="card overflow-hidden animate-fade-up delay-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <h2 className="font-bold text-foreground">Dernières commandes</h2>
                <Link href="/commandes" className="text-xs font-semibold text-primary-700">
                  Tout voir →
                </Link>
              </div>
              <div className="divide-y divide-border/40">
                {(mesAchats as Array<{ id: string; produit: { type: string }; montantFcfa: number; commission: number; statut: string }>).slice(0, 3).map(c => (
                  <Link key={c.id} href={`/commandes/${c.id}/payer`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-2 transition-colors">
                    <span className="text-sm font-medium text-foreground">
                      {c.produit.type.charAt(0) + c.produit.type.slice(1).toLowerCase()}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.statut === 'EN_ATTENTE' ? 'bg-amber-50 text-amber-700' :
                      c.statut === 'PAYE' ? 'bg-primary-50 text-primary-700' :
                      c.statut === 'LIVRE' ? 'bg-primary-50 text-primary-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {c.statut === 'EN_ATTENTE' ? 'En attente' :
                       c.statut === 'PAYE' ? 'Payée' :
                       c.statut === 'LIVRE' ? 'Livrée' : 'Annulée'}
                    </span>
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
