'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import {
  CheckCircle2, XCircle, Loader2, Phone, ShieldAlert, PackageCheck,
} from 'lucide-react';

interface Commande {
  id: string;
  quantiteKg: number;
  montantFcfa: number;
  commission: number;
  statut: string;
  produit: { type: string; commune: string };
  vendeur: { nom: string; telephone: string };
}

const OPERATEURS = [
  { id: 'orange', label: 'Orange Money', emoji: '🟠', color: 'border-orange-400 bg-orange-50' },
  { id: 'moov',   label: 'Moov Money',   emoji: '🔵', color: 'border-blue-400 bg-blue-50' },
];

const MOYENS_PAIEMENT = [
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    description: 'Orange Money · Moov Money',
    color: 'border-border bg-white',
    activeColor: 'border-orange-500 bg-orange-50',
    badge: null,
    emoji: '📱',
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  EN_ATTENTE: {
    label: 'En attente de paiement',
    color: 'border-amber-200 bg-amber-50',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    step: 1,
  },
  PAIEMENT_INITIE: {
    label: 'Paiement en cours…',
    color: 'border-blue-200 bg-blue-50',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    step: 2,
  },
  PAYE: {
    label: 'Payée — en attente de livraison',
    color: 'border-primary-200 bg-primary-50',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    step: 3,
  },
  LIVRE: {
    label: 'Livrée avec succès',
    color: 'border-primary-300 bg-primary-50',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    step: 4,
  },
  ANNULE: {
    label: 'Annulée',
    color: 'border-red-200 bg-red-50',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    step: 0,
  },
};

const STEPS = [
  { label: 'Commande créée', step: 1 },
  { label: 'Paiement', step: 2 },
  { label: 'Payée', step: 3 },
  { label: 'Livrée', step: 4 },
];

export default function PagePayerCommande() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);

  const [moyenPaiement, setMoyenPaiement] = useState('mobile_money');
  const [operateur, setOperateur] = useState('orange');
  const [commande, setCommande] = useState<Commande | null>(null);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  // États pour les confirmations inline (remplacent confirm() et alert())
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false);
  const [annulationEnCours, setAnnulationEnCours] = useState(false);
  const [confirmerLivraison, setConfirmerLivraison] = useState(false);
  const [livraisonEnCours, setLivraisonEnCours] = useState(false);

  // Messages d'erreur inline
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get('/commandes/mes-commandes')
      .then(res => {
        const c = res.data.data?.find((x: Commande) => x.id === id);
        setCommande(c ?? null);
      })
      .catch(() => setCommande(null))
      .finally(() => setChargement(false));
  }, [id]);

  // Auto-polling quand paiement en cours — vérifie toutes les 5s pendant 3 min
  useEffect(() => {
    if (commande?.statut !== 'PAIEMENT_INITIE') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/commandes/${id}/statut`);
        if (res.data.statut && res.data.statut !== commande.statut) {
          setCommande(c => c ? { ...c, statut: res.data.statut } : c);
        }
      } catch { /* ignore */ }
    }, 5000);
    const timeout = setTimeout(() => clearInterval(interval), 3 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [commande?.statut, id]);

  const initierPaiement = async () => {
    setErreur('');
    setPaiementEnCours(true);
    try {
      const res = await api.post(`/commandes/${id}/payer`, { network: operateur });
      if (res.data?.data?.paymentUrl) {
        window.location.href = res.data.data.paymentUrl;
      } else {
        setErreur('Lien de paiement non disponible — contactez le vendeur directement.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors du paiement. Réessayez.');
    } finally {
      setPaiementEnCours(false);
    }
  };

  const annuler = async () => {
    setAnnulationEnCours(true);
    setErreur('');
    try {
      await api.post(`/commandes/${id}/annuler`);
      router.push('/produits');
    } catch {
      setErreur('Erreur lors de l\'annulation. Réessayez.');
      setConfirmerAnnulation(false);
    } finally {
      setAnnulationEnCours(false);
    }
  };

  const confirmerReception = async () => {
    setLivraisonEnCours(true);
    setErreur('');
    try {
      await api.post(`/commandes/${id}/confirmer`);
      setCommande(c => c ? { ...c, statut: 'LIVRE' } : c);
      setConfirmerLivraison(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la confirmation. Réessayez.');
      setConfirmerLivraison(false);
    } finally {
      setLivraisonEnCours(false);
    }
  };

  if (chargement) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/commandes" titre="Ma commande" />
      <div className="max-w-xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="skeleton h-10 w-full rounded-2xl" />
        <div className="skeleton h-36 w-full rounded-2xl" />
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    </div>
  );

  if (!commande) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/commandes" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-20">
        <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center text-3xl">❌</div>
        <p className="font-bold text-foreground-3 text-lg">Commande introuvable</p>
        <button onClick={() => router.push('/produits')} className="btn btn-secondary btn-sm mt-2">
          Retour aux récoltes
        </button>
      </div>
    </div>
  );

  const total = commande.montantFcfa + commande.commission;
  const typeLabel = commande.produit.type.charAt(0) + commande.produit.type.slice(1).toLowerCase();
  const statusConfig = STATUS_CONFIG[commande.statut] ?? STATUS_CONFIG.ANNULE;
  const currentStep = statusConfig.step;

  // Seul l'acheteur peut confirmer la réception — le vendeur ne peut pas
  const estVendeur = utilisateur?.telephone === commande.vendeur.telephone;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/commandes" titre="Ma commande" />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Statut */}
        <div className={`card p-4 flex items-center gap-3.5 ${statusConfig.color} animate-fade-up`}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
            {statusConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-[15px]">{statusConfig.label}</p>
            <p className="text-xs text-muted-fg mt-0.5 font-mono">#{commande.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Message si le vendeur essaie d'accéder */}
        {estVendeur && commande.statut === 'PAYE' && (
          <div className="card p-4 flex items-start gap-3 bg-amber-50 border-amber-200 animate-fade-up">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} className="text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-700">Réservé à l'acheteur</p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                Seul l'acheteur peut confirmer la réception de la marchandise. Cette action déclenche le paiement en votre faveur.
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {commande.statut !== 'ANNULE' && (
          <div className="card p-4 animate-fade-up">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-border mx-8" />
              <div
                className="absolute left-8 top-4 h-0.5 bg-primary-500 transition-all duration-700"
                style={{ right: `${((4 - currentStep) / 3) * 100}%`, maxWidth: 'calc(100% - 4rem)' }}
              />
              {STEPS.map((s) => {
                const done = currentStep >= s.step;
                const active = currentStep === s.step;
                return (
                  <div key={s.step} className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done
                        ? 'bg-primary-600 shadow-sm shadow-primary-200'
                        : 'bg-white border-2 border-border'
                    } ${active ? 'scale-110 ring-4 ring-primary-100' : ''}`}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <span className="text-[10px] font-black text-muted-fg">{s.step}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-primary-700' : 'text-muted-fg'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Récapitulatif */}
        <div className="card p-4 space-y-3 animate-fade-up">
          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Récapitulatif</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground-2 font-medium">{typeLabel} · {commande.quantiteKg} kg</span>
            <span className="font-bold">{commande.montantFcfa.toLocaleString('fr')} FCFA</span>
          </div>
          <div className="flex justify-between text-sm text-muted-fg">
            <span>Commission (3%)</span>
            <span>{commande.commission.toLocaleString('fr')} FCFA</span>
          </div>
          <div className="flex justify-between font-black text-foreground border-t border-border pt-3 mt-1">
            <span>Total</span>
            <span className="text-primary-700 text-lg">{total.toLocaleString('fr')} FCFA</span>
          </div>
        </div>

        {/* Vendeur */}
        <div className="card p-4 animate-fade-up">
          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Vendeur</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white text-sm font-bold">{commande.vendeur.nom.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{commande.vendeur.nom}</p>
                <p className="text-xs text-muted-fg">{commande.produit.commune}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${commande.vendeur.telephone.replace('+', '')}?text=${encodeURIComponent(`Bonjour, concernant ma commande de ${typeLabel} sur Sɔrɔ.`)}`}
                target="_blank" rel="noopener noreferrer"
                aria-label="Contacter le vendeur via WhatsApp"
                className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center hover:bg-[#25D366]/20 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a
                href={`tel:${commande.vendeur.telephone}`}
                aria-label={`Appeler ${commande.vendeur.nom}`}
                className="w-10 h-10 rounded-xl bg-surface-3 border border-border flex items-center justify-center hover:bg-surface-2 transition-colors"
              >
                <Phone size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Choix moyen de paiement */}
        {commande.statut === 'EN_ATTENTE' && (
          <div className="card p-4 animate-fade-up">
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
                        : 'border-border bg-surface-2 opacity-50 cursor-not-allowed'
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

            {moyenPaiement === 'mobile_money' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-fg">Opérateur</p>
                <div className="flex gap-2">
                  {OPERATEURS.map(op => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setOperateur(op.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        operateur === op.id
                          ? op.color + ' shadow-sm'
                          : 'border-border bg-white text-muted-fg'
                      }`}
                    >
                      <span>{op.emoji}</span>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-fg bg-surface-2 rounded-xl px-3 py-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Paiement sécurisé — libéré après confirmation de livraison
            </div>
          </div>
        )}

        {/* Message d'erreur global */}
        {erreur && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm animate-fade-up">
            <XCircle size={16} className="flex-shrink-0" aria-hidden="true" />
            {erreur}
          </div>
        )}

        {/* Confirmation annulation inline */}
        {confirmerAnnulation && (
          <div className="card p-4 bg-red-50 border-red-200 space-y-3 animate-fade-up">
            <p className="font-bold text-red-700 text-sm">Annuler cette commande ?</p>
            <p className="text-xs text-red-600 leading-relaxed">
              Cette action est irréversible. La commande sera supprimée et vous devrez en créer une nouvelle.
            </p>
            <div className="flex gap-2">
              <button
                onClick={annuler}
                disabled={annulationEnCours}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                {annulationEnCours
                  ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Annulation…</>
                  : <><XCircle size={14} aria-hidden="true" /> Oui, annuler</>
                }
              </button>
              <button
                onClick={() => setConfirmerAnnulation(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-3 transition-colors"
              >
                Non, garder
              </button>
            </div>
          </div>
        )}

        {/* Confirmation réception inline */}
        {confirmerLivraison && (
          <div className="card p-4 bg-primary-50 border-primary-200 space-y-3 animate-fade-up">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <PackageCheck size={18} className="text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-primary-700 text-sm">Vous avez bien reçu la marchandise ?</p>
                <p className="text-xs text-primary-600 mt-0.5 leading-relaxed">
                  En confirmant, le paiement de {commande.montantFcfa.toLocaleString('fr')} FCFA sera libéré au vendeur. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmerReception}
                disabled={livraisonEnCours}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                {livraisonEnCours
                  ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Confirmation…</>
                  : <><CheckCircle2 size={14} aria-hidden="true" /> Oui, j&apos;ai reçu</>
                }
              </button>
              <button
                onClick={() => setConfirmerLivraison(false)}
                className="flex-1 py-2.5 rounded-xl border border-primary-300 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
              >
                Pas encore
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2 animate-fade-up">
          {commande.statut === 'EN_ATTENTE' && (
            <button
              onClick={initierPaiement}
              disabled={paiementEnCours}
              className="btn btn-primary w-full btn-lg"
            >
              {paiementEnCours ? (
                <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Redirection…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Payer {total.toLocaleString('fr')} FCFA
                </>
              )}
            </button>
          )}

          {commande.statut === 'PAIEMENT_INITIE' && (
            <button
              onClick={async () => {
                try {
                  const res = await api.get(`/commandes/${id}/statut`);
                  if (res.data.statut) setCommande(c => c ? { ...c, statut: res.data.statut } : c);
                } catch { /* ignore */ }
              }}
              className="btn btn-secondary w-full gap-2"
            >
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Vérifier mon paiement
            </button>
          )}

          {commande.statut === 'EN_ATTENTE' && !confirmerAnnulation && (
            <button
              onClick={() => { setConfirmerAnnulation(true); setErreur(''); }}
              className="btn btn-secondary w-full text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              Annuler la commande
            </button>
          )}

          {/* Confirmer la réception — uniquement pour l'acheteur */}
          {commande.statut === 'PAYE' && !estVendeur && !confirmerLivraison && (
            <button
              onClick={() => { setConfirmerLivraison(true); setErreur(''); }}
              className="btn btn-primary w-full btn-lg gap-2"
            >
              <PackageCheck size={18} aria-hidden="true" />
              Confirmer la réception
            </button>
          )}

          {commande.statut === 'LIVRE' && (
            <div className="card p-4 bg-primary-50 border-primary-200 text-center animate-bounce-in">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-bold text-primary-700 text-sm">Livraison confirmée !</p>
              <p className="text-xs text-primary-600 mt-0.5">Le paiement est en cours de transfert au vendeur.</p>
            </div>
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
