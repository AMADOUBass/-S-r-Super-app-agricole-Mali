'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

interface Commande {
  id: string;
  quantiteKg: number;
  montantFcfa: number;
  commission: number;
  statut: string;
  createdAt: string;
  produit: { type: string; commune: string };
  acheteur: { nom: string; telephone: string };
  vendeur: { nom: string; telephone: string };
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE:       { label: 'En attente',     color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  PAIEMENT_INITIE:  { label: 'Paiement…',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  PAYE:             { label: 'Payée',           color: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
  LIVRE:            { label: 'Livrée',          color: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
  ANNULE:           { label: 'Annulée',         color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
};

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️', GOMBO: '🥦',
  PATATE_DOUCE: '🍠', IGNAME: '🥔',
};

export default function PageCommandes() {
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<'acheteur' | 'vendeur'>('acheteur');

  useEffect(() => {
    if (!token) { router.push('/connexion'); return; }
    api.get('/commandes/mes-commandes')
      .then(res => setCommandes(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [token, router]);

  const commandesAcheteur = commandes.filter(c => c.acheteur.telephone === utilisateur?.telephone);
  const commandesVendeur = commandes.filter(c => c.vendeur.telephone === utilisateur?.telephone);
  const liste = onglet === 'acheteur' ? commandesAcheteur : commandesVendeur;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Mes commandes" />

      <main className="flex-1 pb-24 max-w-xl mx-auto w-full px-4 py-5">

        {/* Onglets */}
        <div className="flex bg-surface-3 rounded-xl p-1 mb-5">
          <button
            onClick={() => setOnglet('acheteur')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              onglet === 'acheteur' ? 'bg-white text-foreground shadow-sm' : 'text-muted-fg'
            }`}
          >
            Mes achats ({commandesAcheteur.length})
          </button>
          <button
            onClick={() => setOnglet('vendeur')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              onglet === 'vendeur' ? 'bg-white text-foreground shadow-sm' : 'text-muted-fg'
            }`}
          >
            Mes ventes ({commandesVendeur.length})
          </button>
        </div>

        {chargement ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-3 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-3 rounded w-1/2" />
                  <div className="h-3 bg-surface-3 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : liste.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">{onglet === 'acheteur' ? '🛒' : '📦'}</div>
            <p className="font-semibold text-foreground-3">
              {onglet === 'acheteur' ? 'Aucun achat pour l\'instant' : 'Aucune vente pour l\'instant'}
            </p>
            {onglet === 'acheteur' && (
              <Link href="/produits" className="btn btn-primary btn-sm mt-4">
                Explorer les récoltes
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {liste.map((c, i) => {
              const statut = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.EN_ATTENTE;
              const typeLabel = c.produit.type.charAt(0) + c.produit.type.slice(1).toLowerCase();
              const total = c.montantFcfa + c.commission;
              const date = new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

              return (
                <Link
                  key={c.id}
                  href={`/commandes/${c.id}/payer`}
                  className="card p-4 flex gap-4 hover:shadow-card-hover transition-shadow animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 text-2xl">
                    {EMOJI[c.produit.type] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground">{typeLabel} · {c.quantiteKg} kg</p>
                        <p className="text-xs text-muted-fg mt-0.5">
                          {onglet === 'acheteur' ? `Vendeur: ${c.vendeur.nom}` : `Acheteur: ${c.acheteur.nom}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-foreground text-sm">{total.toLocaleString('fr')} F</p>
                        <p className="text-xs text-muted-fg">{date}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${statut.bg} ${statut.color}`}>
                        {statut.label}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
