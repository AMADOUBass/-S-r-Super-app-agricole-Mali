'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import {
  CheckCircle2, XCircle, Loader2, Phone, ShieldAlert, PackageCheck,
  ShieldCheck, Lock, ChevronRight, ArrowLeft, Smartphone, CreditCard,
  Truck, HelpCircle, PhoneCall
} from 'lucide-react';

interface Commande {
  id: string;
  quantiteKg: number | null;
  montantFcfa: number;
  commission: number;
  caution?: number | null;
  statut: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  produit?: { type: string; commune: string };
  animal?: { type: string; commune: string };
  materiel?: { type: string; commune: string };
  vendeur: { nom: string; telephone: string };
}

const OPERATEURS = [
  { id: 'orange', label: 'Orange Money', emoji: '🟠', color: 'border-orange-500 bg-orange-50' },
  { id: 'moov',   label: 'Moov Money',   emoji: '🔵', color: 'border-blue-500 bg-blue-50' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  EN_ATTENTE: {
    label: 'En attente de paiement',
    color: 'border-amber-100 bg-amber-50 text-amber-800',
    icon: <Lock size={20} className="text-amber-600" />,
    step: 1,
  },
  PAIEMENT_INITIE: {
    label: 'Paiement en cours…',
    color: 'border-blue-100 bg-blue-50 text-blue-800',
    icon: <Loader2 size={20} className="text-blue-600 animate-spin" />,
    step: 2,
  },
  PAYE: {
    label: 'Payée (Fonds sécurisés Sɔrô)',
    color: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    step: 3,
  },
  LIVRE: {
    label: 'Livraison confirmée',
    color: 'border-primary-100 bg-primary-50 text-primary-800',
    icon: <CheckCircle2 size={20} className="text-primary-600" />,
    step: 4,
  },
  ANNULE: {
    label: 'Annulée',
    color: 'border-red-100 bg-red-50 text-red-800',
    icon: <XCircle size={20} className="text-red-600" />,
    step: 0,
  },
};

const STEPS = [
  { label: 'Créée', step: 1 },
  { label: 'Paiement', step: 2 },
  { label: 'Sécurisé', step: 3 },
  { label: 'Livré', step: 4 },
];

export default function PagePayerCommande() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);

  const [operateur, setOperateur] = useState('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [commande, setCommande] = useState<Commande | null>(null);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  // Confirmations inline
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false);
  const [confirmerLivraison, setConfirmerLivraison] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);
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

  // Pré-remplir le numéro avec celui du compte
  useEffect(() => {
    if (utilisateur?.telephone && !phoneNumber) {
      setPhoneNumber(utilisateur.telephone);
    }
  }, [utilisateur]);

  // Polling si paiement en cours
  useEffect(() => {
    if (commande?.statut !== 'PAIEMENT_INITIE') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/commandes/${id}/statut`);
        if (res.data.data?.statut && res.data.data?.statut !== commande.statut) {
          setCommande(c => c ? { ...c, statut: res.data.data.statut } : c);
        }
      } catch { /* ignore */ }
    }, 5000);

    const timeout = setTimeout(() => clearInterval(interval), 3 * 60 * 1000); // Stop après 3 min
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [commande?.statut, id]);

  const initierPaiement = async () => {
    setErreur('');
    const tel = phoneNumber.trim();
    if (!tel) {
      setErreur('Veuillez saisir votre numéro Mobile Money.');
      return;
    }
    setPaiementEnCours(true);
    try {
      const res = await api.post(`/commandes/${id}/payer`, {
        network: operateur,
        phoneNumber: tel,
      });
      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        setErreur('Service de paiement indisponible temporairement.');
      }
    } catch (err: any) {
      setErreur(err.response?.data?.error || 'Erreur lors de l\'initiation du paiement.');
    } finally {
      setPaiementEnCours(false);
    }
  };

  const annuler = async () => {
    setActionEnCours(true);
    try {
      await api.post(`/commandes/${id}/annuler`);
      router.push('/tableau-bord');
    } catch {
      setErreur('Erreur lors de l\'annulation.');
      setConfirmerAnnulation(false);
    } finally {
      setActionEnCours(false);
    }
  };

  const confirmerReception = async () => {
    setActionEnCours(true);
    try {
      await api.post(`/commandes/${id}/confirmer`);
      setCommande(c => c ? { ...c, statut: 'LIVRE' } : c);
      setConfirmerLivraison(false);
    } catch {
      setErreur('Erreur lors de la confirmation.');
    } finally {
      setActionEnCours(false);
    }
  };

  if (chargement) return (
    <div className="min-h-screen bg-surface-2">
      <Header retour="/commandes" titre="Paiement" />
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <div className="h-20 skeleton" />
        <div className="h-40 skeleton" />
        <div className="h-60 skeleton" />
      </div>
    </div>
  );

  if (!commande) return (
    <div className="min-h-screen bg-surface-2 flex flex-col items-center justify-center p-6 text-center">
       <div className="text-4xl mb-4">🔍</div>
       <h1 className="text-xl font-bold text-foreground mb-2">Commande introuvable</h1>
       <button onClick={() => router.push('/produits')} className="btn btn-secondary">Retour au marché</button>
    </div>
  );

  const item = commande.produit || commande.animal || commande.materiel;
  const itemType = item?.type || 'Produit';
  const typeLabel = itemType.charAt(0) + itemType.slice(1).toLowerCase();
  
  const totalSansCaution = commande.montantFcfa + commande.commission;
  const totalFinal = totalSansCaution + (commande.caution || 0);
  const statusConfig = STATUS_CONFIG[commande.statut] ?? STATUS_CONFIG.ANNULE;

  const estVendeur = utilisateur?.id === (commande as any).vendeurId;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/commandes" titre="Finaliser l'achat" />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Status Timeline */}
        {commande.statut !== 'ANNULE' && (
          <div className="card p-5">
            <div className="flex items-center justify-between relative px-2 mb-2">
              <div className="absolute left-6 right-6 top-[13.5px] h-1 bg-surface-3 rounded-full" />
              <div
                className="absolute left-6 top-[13.5px] h-1 bg-primary-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, ((statusConfig.step - 1) / 3) * 100)}%`, maxWidth: 'calc(100% - 3rem)' }}
              />
              {STEPS.map((s) => {
                const done = statusConfig.step >= s.step;
                const active = statusConfig.step === s.step;
                return (
                  <div key={s.step} className="flex flex-col items-center gap-2 relative z-10 transition-all duration-300">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      done ? 'bg-primary-500 shadow-md scale-110' : 'bg-white border-2 border-border'
                    } ${active ? 'ring-4 ring-primary-100' : ''}`}>
                      {done ? <CheckCircle2 size={16} color="white" strokeWidth={3} /> : <span className="text-[10px] font-bold text-muted-fg">{s.step}</span>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${done ? 'text-primary-700' : 'text-muted-fg'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Récapitulatif Commande */}
        <div className="card overflow-hidden">
           <div className="bg-surface-3 px-5 py-3 border-b border-border/60 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <PackageCheck size={18} className="text-primary-600" />
                 <span className="font-bold text-sm">Détail de la commande</span>
              </div>
              <span className="text-[10px] font-black text-muted-fg uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg border border-border/40">ID {commande.id.slice(-6).toUpperCase()}</span>
           </div>
           
           <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-lg font-black text-foreground leading-tight">{typeLabel}</h2>
                    <p className="text-xs text-muted-fg mt-0.5">Vendu par {commande.vendeur.nom}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-muted-fg uppercase tracking-widest">Achat sécurisé</p>
                    <div className="flex items-center gap-1 text-primary-600 font-bold mt-1">
                       <ShieldCheck size={14} /> <span>Sɔrô Escrow</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-dashed border-border/60">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-fg font-medium">Prix {commande.quantiteKg ? `(${commande.quantiteKg} kg)` : 'unitaire'}</span>
                    <span className="font-bold text-foreground-2">{commande.montantFcfa.toLocaleString('fr')} FCFA</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-fg font-medium">Service & Escrow (Sécurité)</span>
                    <span className="font-bold text-foreground-2">{commande.commission.toLocaleString('fr')} FCFA</span>
                 </div>
                 {commande.caution && (
                    <div className="flex justify-between text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 mt-1">
                       <span className="font-bold flex items-center gap-1.5"><HelpCircle size={14} /> Caution de garantie</span>
                       <span className="font-black">+{commande.caution.toLocaleString('fr')} FCFA</span>
                    </div>
                 )}
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                 <span className="text-base font-black text-foreground-2 uppercase tracking-tighter">Total à payer</span>
                 <span className="text-3xl font-black text-primary-700">{totalFinal.toLocaleString('fr')} <span className="text-xs font-medium">FCFA</span></span>
              </div>
           </div>
        </div>

        {/* Moyens de Paiement (uniquement si EN_ATTENTE) */}
        {commande.statut === 'EN_ATTENTE' && (
           <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <Smartphone size={18} className="text-primary-600" />
                 <h3 className="font-bold text-foreground text-sm uppercase tracking-widest">Choisir l&apos;opérateur</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 {OPERATEURS.map(op => (
                    <button
                      key={op.id}
                      onClick={() => setOperateur(op.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        operateur === op.id ? op.color : 'bg-surface-3 border-transparent grayscale opacity-70'
                      }`}
                    >
                       <span className="text-3xl mb-1">{op.emoji}</span>
                       <span className="text-xs font-bold uppercase tracking-widest">{op.label}</span>
                    </button>
                 ))}
              </div>

              {/* Numéro Mobile Money */}
              <div className="space-y-1.5">
                 <label className="text-xs font-black uppercase tracking-widest text-muted-fg flex items-center gap-1.5">
                    <PhoneCall size={12} /> Numéro Mobile Money
                 </label>
                 <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+223 XX XX XX XX"
                    className="w-full border-2 border-border rounded-xl px-4 py-3 font-bold text-sm focus:border-primary-500 outline-none transition-colors"
                 />
                 <p className="text-[10px] text-muted-fg">Numéro sur lequel sera débité le paiement</p>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-primary-50 rounded-xl border border-primary-100">
                 <ShieldAlert size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
                 <p className="text-[11px] font-bold text-primary-800 leading-relaxed">
                    Votre paiement sera bloqué de manière sécurisée par Sɔrô.
                    Le vendeur ne sera payé que lorsque vous aurez confirmé la livraison.
                 </p>
              </div>
           </div>
        )}

        {/* Actions Contextuelles */}
        <div className="pt-2 space-y-4">
           
           {erreur && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-xs font-bold border border-red-100 animate-fade-up">
                <XCircle size={16} /> {erreur}
              </div>
           )}

           {commande.statut === 'EN_ATTENTE' && !confirmerAnnulation && (
              <button
                onClick={initierPaiement}
                disabled={paiementEnCours}
                className="w-full btn btn-primary h-14 rounded-2xl shadow-lg gap-3"
              >
                {paiementEnCours ? (
                   <Loader2 size={20} className="animate-spin" />
                ) : (
                   <>
                      <CreditCard size={18} />
                      <span className="text-lg">Procéder au Paiement</span>
                      <ChevronRight size={18} />
                   </>
                )}
              </button>
           )}

           {/* État Paiement Initié / En cours */}
           {commande.statut === 'PAIEMENT_INITIE' && (
              <div className="card p-6 border-blue-200 bg-blue-50/50 flex flex-col items-center text-center gap-3">
                 <Loader2 size={32} className="text-blue-600 animate-spin" />
                 <h4 className="font-bold text-blue-900 uppercase tracking-widest text-sm">Paiement en cours</h4>
                 <p className="text-xs text-blue-800 font-medium">Validez la transaction sur votre téléphone. Cette page s&apos;actualisera automatiquement une fois terminée.</p>
              </div>
           )}

           {/* État Payé / Sécurisé */}
           {commande.statut === 'PAYE' && (
              <div className="card p-6 border-emerald-200 bg-emerald-50/50 flex flex-col items-center text-center gap-3">
                 <ShieldCheck size={32} className="text-emerald-600" />
                 <h4 className="font-bold text-emerald-900 uppercase tracking-widest text-sm">Fonds Sécurisés (Escrow)</h4>
                 <p className="text-xs text-emerald-800 font-medium">L&apos;argent est bloqué par Sɔrô. Vous pouvez maintenant contacter le vendeur pour organiser la livraison.</p>
                 <div className="flex gap-2 w-full mt-2">
                    <a href={`tel:${commande.vendeur.telephone}`} className="btn btn-secondary flex-1 rounded-xl h-11"><Phone size={14} /> Appeler</a>
                    <button 
                      onClick={() => setConfirmerLivraison(true)} 
                      className="btn btn-primary flex-1 rounded-xl h-11"
                    >
                       Confirmer Livraison
                    </button>
                 </div>
              </div>
           )}

           {/* État Livré */}
           {commande.statut === 'LIVRE' && (
              <div className="card p-6 border-primary-200 bg-primary-50/50 flex flex-col items-center text-center gap-3">
                 <CheckCircle2 size={32} className="text-primary-600" />
                 <h4 className="font-bold text-primary-900 uppercase tracking-widest text-sm">Transaction terminée</h4>
                 <p className="text-xs text-primary-700 font-medium">La livraison a été confirmée et le vendeur a été payé. Merci d&apos;utiliser Sɔrô !</p>
                 <button onClick={() => router.push('/tableau-bord')} className="btn btn-secondary rounded-xl mt-2 w-full">Gérer mes achats</button>
              </div>
           )}

           {/* Annulation possible si pas encore payé */}
           {commande.statut === 'EN_ATTENTE' && !confirmerAnnulation && (
              <button 
                onClick={() => setConfirmerAnnulation(true)}
                className="w-full text-red-600 font-bold text-sm h-12 hover:bg-red-50 transition-colors uppercase tracking-widest"
              >
                 Annuler la commande
              </button>
           )}

           {/* Confirmation Annulation */}
           {confirmerAnnulation && (
             <div className="card p-5 border-red-200 bg-red-50/50 flex flex-col items-center text-center gap-3">
                <ShieldAlert size={24} className="text-red-600" />
                <h4 className="font-bold text-red-900 uppercase tracking-widest text-sm">Annuler la commande ?</h4>
                <p className="text-xs text-red-700 font-medium">Cette action libérera le stock pour d&apos;autres acheteurs.</p>
                <div className="flex gap-2 w-full mt-2">
                   <button onClick={() => setConfirmerAnnulation(false)} className="btn btn-secondary flex-1 rounded-xl h-11">Non, garder</button>
                   <button onClick={annuler} disabled={actionEnCours} className="btn bg-red-600 text-white flex-1 rounded-xl h-11">Oui, annuler</button>
                </div>
             </div>
           )}

           {/* Confirmation Livraison */}
           {confirmerLivraison && (
             <div className="card p-5 border-emerald-200 bg-emerald-50/50 flex flex-col items-center text-center gap-3 fixed inset-x-4 bottom-24 z-50 shadow-2xl animate-fade-up">
                <Truck size={24} className="text-emerald-600" />
                <h4 className="font-bold text-emerald-900 uppercase tracking-widest text-sm">Avez-vous bien reçu l&apos;item ?</h4>
                <p className="text-xs text-emerald-700 font-medium">En confirmant, vous autorisez Sɔrô à transférer les fonds au vendeur.</p>
                <div className="flex gap-2 w-full mt-2">
                   <button onClick={() => setConfirmerLivraison(false)} className="btn btn-secondary flex-1 rounded-xl h-11">Pas encore</button>
                   <button onClick={confirmerReception} disabled={actionEnCours} className="btn btn-primary flex-1 rounded-xl h-11">Oui, reçu</button>
                </div>
             </div>
           )}

           {/* Retour au marche */}
           <button onClick={() => router.push('/produits')} className="w-full flex items-center justify-center gap-2 py-4 text-muted-fg font-bold text-xs uppercase tracking-[0.2em] hover:text-foreground transition-colors">
              <ArrowLeft size={14} /> Retour au Marché
           </button>
        </div>

      </main>

      {/* Trust Badges */}
      <footer className="max-w-xl mx-auto w-full px-4 pb-8">
         <div className="flex flex-wrap justify-center gap-6 opacity-40 grayscale">
            <div className="flex items-center gap-2">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Escrow Sɔrô</span>
            </div>
            <div className="flex items-center gap-2">
                <CreditCard size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Paiement Mobile</span>
            </div>
            <div className="flex items-center gap-2">
                <Smartphone size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">App Mobile</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
