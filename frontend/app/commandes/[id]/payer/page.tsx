'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

interface Commande {
  id: string;
  quantiteKg: number;
  montantFcfa: number;
  commission: number;
  statut: string;
  produit: { type: string; commune: string };
  vendeur: { nom: string; telephone: string };
}

const MOYENS_PAIEMENT = [
  {
    id: 'cinetpay',
    label: 'CinetPay',
    description: 'Orange Money, Moov, carte bancaire',
    color: 'border-orange-300 bg-orange-50',
    activeColor: 'border-orange-500 bg-orange-50',
    badge: null,
    emoji: '💳',
    disponible: true,
  },
  {
    id: 'wave',
    label: 'Wave',
    description: 'Paiement instantané',
    color: 'border-border bg-white',
    activeColor: 'border-blue-400 bg-blue-50',
    badge: 'Bientôt',
    emoji: '🌊',
    disponible: false,
  },
  {
    id: 'especes',
    label: 'À la livraison',
    description: 'Cash ou transfert direct',
    color: 'border-border bg-white',
    activeColor: 'border-primary-400 bg-primary-50',
    badge: 'Bientôt',
    emoji: '🤝',
    disponible: false,
  },
];

export default function PagePayerCommande() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [moyenPaiement, setMoyenPaiement] = useState('cinetpay');
  const [commande, setCommande] = useState<Commande | null>(null);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  useEffect(() => {
    api.get('/commandes/mes-commandes')
      .then(res => {
        const c = res.data.data?.find((x: Commande) => x.id === id);
        setCommande(c ?? null);
      })
      .catch(() => setCommande(null))
      .finally(() => setChargement(false));
  }, [id]);

  const initierPaiement = async () => {
    setPaiementEnCours(true);
    try {
      const res = await api.post(`/commandes/${id}/payer`);
      if (res.data?.data?.paymentUrl) {
        window.location.href = res.data.data.paymentUrl;
      } else {
        alert('Lien de paiement non disponible — contactez le vendeur directement.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setPaiementEnCours(false);
    }
  };

  const annuler = async () => {
    if (!confirm('Annuler cette commande ?')) return;
    try {
      await api.post(`/commandes/${id}/annuler`);
      router.push('/produits');
    } catch {
      alert('Erreur lors de l\'annulation');
    }
  };

  const confirmerReception = async () => {
    if (!confirm('Confirmer que vous avez bien reçu la marchandise ?')) return;
    try {
      await api.post(`/commandes/${id}/confirmer`);
      setCommande(c => c ? { ...c, statut: 'LIVRE' } : c);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Erreur lors de la confirmation');
    }
  };

  if (chargement) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/produits" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl animate-pulse">⏳</div>
      </div>
    </div>
  );

  if (!commande) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/produits" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-fg">Commande introuvable</p>
      </div>
    </div>
  );

  const total = commande.montantFcfa + commande.commission;
  const typeLabel = commande.produit.type.charAt(0) + commande.produit.type.slice(1).toLowerCase();

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/produits" titre="Ma commande" />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Statut */}
        <div className={`card p-4 flex items-center gap-3 ${
          commande.statut === 'EN_ATTENTE' ? 'border-amber-200 bg-amber-50' :
          commande.statut === 'PAYE' ? 'border-primary-200 bg-primary-50' :
          commande.statut === 'LIVRE' ? 'border-primary-200 bg-primary-50' :
          'border-red-200 bg-red-50'
        }`}>
          <span className="text-2xl">
            {commande.statut === 'EN_ATTENTE' ? '⏳' :
             commande.statut === 'PAYE' ? '✅' :
             commande.statut === 'LIVRE' ? '🎉' : '❌'}
          </span>
          <div>
            <p className="font-bold text-foreground">
              {commande.statut === 'EN_ATTENTE' ? 'En attente de paiement' :
               commande.statut === 'PAIEMENT_INITIE' ? 'Paiement en cours…' :
               commande.statut === 'PAYE' ? 'Payée — en attente de livraison' :
               commande.statut === 'LIVRE' ? 'Livrée' : 'Annulée'}
            </p>
            <p className="text-xs text-muted-fg">Commande #{commande.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Détails */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Récapitulatif</p>

          <div className="flex justify-between text-sm">
            <span className="text-foreground-2">{typeLabel} · {commande.quantiteKg} kg</span>
            <span className="font-semibold">{commande.montantFcfa.toLocaleString('fr')} FCFA</span>
          </div>
          <div className="flex justify-between text-sm text-muted-fg">
            <span>Commission (3%)</span>
            <span>{commande.commission.toLocaleString('fr')} FCFA</span>
          </div>
          <div className="flex justify-between font-black text-foreground border-t border-border pt-3">
            <span>Total à payer</span>
            <span className="text-primary-700 text-lg">{total.toLocaleString('fr')} FCFA</span>
          </div>
        </div>

        {/* Vendeur */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Vendeur</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">{commande.vendeur.nom}</p>
              <p className="text-sm text-muted-fg">{commande.produit.commune}</p>
            </div>
            <a
              href={`tel:${commande.vendeur.telephone}`}
              className="btn btn-secondary btn-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
              Appeler
            </a>
          </div>
        </div>

        {/* Choix moyen de paiement */}
        {commande.statut === 'EN_ATTENTE' && (
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Moyen de paiement</p>
            <div className="space-y-2">
              {MOYENS_PAIEMENT.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => m.disponible && setMoyenPaiement(m.id)}
                  disabled={!m.disponible}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    moyenPaiement === m.id && m.disponible
                      ? m.activeColor + ' shadow-sm'
                      : m.disponible
                        ? m.color + ' hover:border-border-strong'
                        : 'border-border bg-surface-2 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{m.label}</span>
                      {m.badge && (
                        <span className="text-xs font-semibold bg-surface-3 text-muted-fg px-2 py-0.5 rounded-full">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-fg">{m.description}</p>
                  </div>
                  {moyenPaiement === m.id && m.disponible && (
                    <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-fg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Paiement sécurisé — libéré après confirmation de livraison
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {commande.statut === 'EN_ATTENTE' && (
            <button
              onClick={initierPaiement}
              disabled={paiementEnCours}
              className="btn btn-primary w-full btn-lg"
            >
              {paiementEnCours ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  Redirection…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Payer {total.toLocaleString('fr')} FCFA
                </>
              )}
            </button>
          )}

          {commande.statut === 'EN_ATTENTE' && (
            <button onClick={annuler} className="btn btn-secondary w-full text-red-600 hover:bg-red-50">
              Annuler la commande
            </button>
          )}

          {commande.statut === 'PAYE' && (
            <button
              onClick={confirmerReception}
              className="btn w-full btn-lg flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Confirmer la réception
            </button>
          )}

          {['PAYE', 'LIVRE', 'ANNULE'].includes(commande.statut) && (
            <button onClick={() => router.push('/produits')} className="btn btn-secondary w-full">
              Retour aux récoltes
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
