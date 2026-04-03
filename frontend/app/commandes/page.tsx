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

const STATUT_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  EN_ATTENTE:       { label: 'En attente',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAIEMENT_INITIE:  { label: 'Paiement…',    dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAYE:             { label: 'Payée',         dot: 'bg-primary-500', badge: 'bg-primary-50 text-primary-700 border-primary-200' },
  LIVRE:            { label: 'Livrée',        dot: 'bg-primary-600', badge: 'bg-primary-50 text-primary-700 border-primary-200' },
  ANNULE:           { label: 'Annulée',       dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200' },
};

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️', GOMBO: '🥦',
  PATATE_DOUCE: '🍠', IGNAME: '🥔',
};

// Emoji bg per type
const THUMB_BG: Record<string, string> = {
  MIL: 'bg-primary-50', SORGHO: 'bg-primary-50', MAIS: 'bg-yellow-50',
  RIZ: 'bg-slate-50', ARACHIDE: 'bg-amber-50', NIEBE: 'bg-orange-50',
  MANGUE: 'bg-yellow-50', OIGNON: 'bg-purple-50', TOMATE: 'bg-red-50',
  KARITE: 'bg-primary-50', SESAME: 'bg-amber-50', COTON: 'bg-sky-50',
};

export default function PageCommandes() {
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const hasHydrated = useStore(s => s._hasHydrated);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<'acheteur' | 'vendeur'>('acheteur');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    api.get('/commandes/mes-commandes')
      .then(res => setCommandes(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [hasHydrated, token, router]);

  const commandesAcheteur = commandes.filter(c => c.acheteur.telephone === utilisateur?.telephone);
  const commandesVendeur = commandes.filter(c => c.vendeur.telephone === utilisateur?.telephone);
  const liste = onglet === 'acheteur' ? commandesAcheteur : commandesVendeur;

  const nbEnAttente = commandesAcheteur.filter(c => c.statut === 'EN_ATTENTE').length
    + commandesVendeur.filter(c => c.statut === 'EN_ATTENTE').length;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Mes commandes" />

      <main className="flex-1 pb-24 max-w-xl mx-auto w-full px-4 py-5">

        {/* Alerte si commandes en attente */}
        {nbEnAttente > 0 && !chargement && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 animate-fade-up">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p className="text-sm font-semibold text-amber-700 flex-1">
              {nbEnAttente} commande{nbEnAttente > 1 ? 's' : ''} en attente de paiement
            </p>
          </div>
        )}

        {/* Onglets */}
        <div className="flex bg-surface-3 rounded-2xl p-1 mb-5 animate-fade-up">
          {([['acheteur', 'Mes achats', commandesAcheteur.length], ['vendeur', 'Mes ventes', commandesVendeur.length]] as [string, string, number][]).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setOnglet(val as 'acheteur' | 'vendeur')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                onglet === val
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-fg hover:text-foreground-3'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                onglet === val ? 'bg-primary-100 text-primary-700' : 'bg-surface-2 text-muted-fg'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {chargement ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="skeleton w-14 h-14 flex-shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : liste.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4 text-4xl">
              {onglet === 'acheteur' ? '🛒' : '📦'}
            </div>
            <p className="font-bold text-foreground-3 text-lg">
              {onglet === 'acheteur' ? 'Aucun achat pour l\'instant' : 'Aucune vente pour l\'instant'}
            </p>
            <p className="text-sm text-muted-fg mt-1 mb-6">
              {onglet === 'acheteur' ? 'Explorez les récoltes disponibles' : 'Publiez votre première annonce'}
            </p>
            {onglet === 'acheteur' ? (
              <Link href="/produits" className="btn btn-primary btn-sm">
                Explorer les récoltes
              </Link>
            ) : (
              <Link href="/vendre" className="btn btn-primary btn-sm">
                Publier une annonce
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
              const thumbBg = THUMB_BG[c.produit.type] || 'bg-surface-3';
              const autreParti = onglet === 'acheteur' ? c.vendeur.nom : c.acheteur.nom;

              return (
                <Link
                  key={c.id}
                  href={`/commandes/${c.id}/payer`}
                  className="card flex gap-3.5 p-3.5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-fade-up group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <div className={`w-14 h-14 rounded-xl ${thumbBg} flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-105 transition-transform duration-300`}>
                    {EMOJI[c.produit.type] || '📦'}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-[15px] truncate">
                          {typeLabel} · {c.quantiteKg} kg
                        </p>
                        <p className="text-xs text-muted-fg mt-0.5 truncate font-medium">
                          {onglet === 'acheteur' ? 'Vendeur' : 'Acheteur'} : {autreParti}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-foreground text-sm">{total.toLocaleString('fr')} F</p>
                        <p className="text-xs text-muted-fg/70">{date}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statut.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statut.dot} ${c.statut === 'EN_ATTENTE' ? 'animate-pulse-soft' : ''}`} />
                        {statut.label}
                      </span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
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
