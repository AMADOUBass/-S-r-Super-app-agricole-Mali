'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CarteAnnonce } from '@/components/ui/CarteAnnonce';
import useStore from '@/store/useStore';
import { useMesProduitsActifs, useCommandesVendeur, usePrixDuJour } from '@/lib/queries';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const heure = new Date().getHours();
const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

export default function TableauBordAgriculteur() {
  const utilisateur = useStore(s => s.utilisateur);
  const { data: produits } = useMesProduitsActifs();
  const { data: commandes } = useCommandesVendeur();
  const { data: prix } = usePrixDuJour(utilisateur?.region);
  const queryClient = useQueryClient();
  const [suppression, setSuppression] = useState<string | null>(null);

  const supprimerAnnonce = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    setSuppression(id);
    try {
      await api.delete(`/produits/${id}`);
      queryClient.invalidateQueries({ queryKey: ['mes-produits'] });
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setSuppression(null);
    }
  };

  const commandesEnAttente = commandes?.filter((c: { statut: string }) => c.statut === 'EN_ATTENTE') ?? [];
  const nbProduits = produits?.length ?? 0;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Hero salutation */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 px-4 pt-8 pb-16 relative overflow-hidden">
          {/* Cercles décoratifs */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-8 bottom-4 w-32 h-32 rounded-full bg-white/5" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
              <span className="text-white/80 text-xs font-medium">Agriculteur</span>
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

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <div className="card p-4 text-center hover:shadow-card-hover transition-all duration-200">
              <div className="text-4xl font-black text-primary-700 mb-1">{nbProduits}</div>
              <div className="text-xs font-semibold text-muted-fg">Annonces actives</div>
            </div>
            <div className="card p-4 text-center hover:shadow-card-hover transition-all duration-200">
              <div className="text-4xl font-black text-amber-600 mb-1">{commandesEnAttente.length}</div>
              <div className="text-xs font-semibold text-muted-fg">Commandes reçues</div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card overflow-hidden animate-fade-up delay-100">
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-5 py-4">
              <h2 className="text-white font-bold text-base">Actions rapides</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Link
                href="/vendre"
                className="flex flex-col items-center gap-2 p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span className="text-xs font-bold text-primary-700 text-center">Nouvelle annonce</span>
              </Link>
              <Link
                href="/produits"
                className="flex flex-col items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
                <span className="text-xs font-bold text-amber-700 text-center">Mes commandes</span>
              </Link>
            </div>
          </div>

          {/* Prix du jour */}
          {prix && prix.length > 0 && (
            <div className="card animate-fade-up delay-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div>
                  <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Marché</p>
                  <h2 className="font-bold text-foreground mt-0.5">Prix du jour</h2>
                </div>
                <Link
                  href="/marche"
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1 transition-colors"
                >
                  Voir tout
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
              <div className="px-5 py-2">
                {prix.slice(0, 5).map((p: { id: string; produit: string; prixKg: number }, i: number) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center py-3 border-b border-border/40 last:border-0 animate-fade-up"
                    style={{animationDelay:`${200 + i*50}ms`}}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                      <span className="text-sm font-medium text-foreground-2">
                        {p.produit.charAt(0) + p.produit.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full">
                      {p.prixKg} F/kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mes annonces */}
          <div className="card overflow-hidden animate-fade-up delay-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div>
                <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Inventaire</p>
                <h2 className="font-bold text-foreground mt-0.5">Mes annonces</h2>
              </div>
              <Link href="/vendre" className="btn btn-primary btn-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouvelle
              </Link>
            </div>

            {nbProduits === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">🌾</div>
                <p className="font-semibold text-foreground-3 mb-1">Aucune annonce</p>
                <p className="text-sm text-muted-fg mb-4">Publiez votre première récolte en 2 minutes</p>
                <Link href="/vendre" className="btn btn-primary btn-sm">Commencer</Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {(produits as Array<{id: string; type: string; quantiteKg: number; prixFcfa: number; commune: string; region: string; photoUrl?: string | null; description?: string | null; createdAt?: string; disponible: boolean}>)?.map((p, i) => (
                  <div key={p.id} className="relative animate-fade-up" style={{animationDelay:`${i*50}ms`}}>
                    <CarteAnnonce annonce={p} type="produit" />
                    <button
                      onClick={() => supprimerAnnonce(p.id)}
                      disabled={suppression === p.id}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors"
                      title="Supprimer"
                    >
                      {suppression === p.id ? (
                        <svg className="animate-spin w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
