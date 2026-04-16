'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CarteAnnonce } from '@/components/ui/CarteAnnonce';
import useStore from '@/store/useStore';
import {
  Wheat, Clock, CheckCircle2, Banknote,
  Plus, ClipboardList, CloudSun, TrendingUp,
  ChevronRight, Trash2, Loader2, MapPin, Sprout, Pencil, Wallet, MessageSquare,
} from 'lucide-react';
import { useMesProduitsActifs, useCommandesVendeur, usePrixDuJour, usePortefeuille, useConversations } from '@/lib/queries';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

const heure = new Date().getHours();
const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

export default function TableauBordAgriculteur() {
  const { t } = useTranslation();
  const utilisateur = useStore(s => s.utilisateur);
  const { data: produits } = useMesProduitsActifs();
  const { data: commandes } = useCommandesVendeur();
  const { data: prix } = usePrixDuJour(utilisateur?.region);
  const { data: wallet } = usePortefeuille();
  const { data: conversations } = useConversations();
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

  type Commande = { statut: string; montantFcfa: number };
  const mesVentes = (commandes as Commande[] | undefined)?.filter(c =>
    ['EN_ATTENTE', 'PAIEMENT_INITIE', 'PAYE', 'LIVRE'].includes(c.statut)
  ) ?? [];
  const commandesEnAttente = mesVentes.filter(c => c.statut === 'EN_ATTENTE');
  const commandesPayees = mesVentes.filter(c => ['PAYE', 'LIVRE'].includes(c.statut));
  const revenuTotal = commandesPayees.reduce((s, c) => s + c.montantFcfa, 0);
  const nbProduits = produits?.length ?? 0;

  const stats = [
    {
      valeur: nbProduits,
      label: 'Annonces actives',
      Icon: Wheat,
      color: 'text-primary-700',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      valeur: commandesEnAttente.length,
      label: 'En attente',
      Icon: Clock,
      color: 'text-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
    },
    {
      valeur: commandesPayees.length,
      label: 'Ventes confirmées',
      Icon: CheckCircle2,
      color: 'text-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-500',
    },
    {
      valeur: wallet?.solde != null ? wallet.solde.toLocaleString('fr') : '—',
      label: 'Solde Portefeuille',
      Icon: Banknote,
      color: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  const actions = [
    { href: '/vendre',       Icon: Plus,          bg: 'bg-primary-600', wrap: 'bg-primary-50 border-primary-200 hover:bg-primary-100', label: 'Nouvelle annonce', labelColor: 'text-primary-700' },
    { href: '/portefeuille', Icon: Wallet,        bg: 'bg-emerald-600', wrap: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', label: 'Mon Portefeuille',   labelColor: 'text-emerald-700' },
    { href: '/commandes',    Icon: ClipboardList,  bg: 'bg-amber-500',   wrap: 'bg-amber-50 border-amber-200 hover:bg-amber-100',       label: 'Mes commandes',    labelColor: 'text-amber-700',   badge: commandesEnAttente.length },
    { href: '/meteo',        Icon: CloudSun,       bg: 'bg-sky-500',     wrap: 'bg-sky-50 border-sky-200 hover:bg-sky-100',             label: 'Météo 7 jours',    labelColor: 'text-sky-700' },
  ];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4 pt-8 pb-16 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-8 bottom-4 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute left-4 bottom-6 w-20 h-20 rounded-full bg-white/[0.03]" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
              <span className="text-white/80 text-xs font-semibold tracking-wide">Agriculteur</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 animate-fade-up">
              {salutation}, {utilisateur?.nom?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/55 text-sm animate-fade-up delay-75 flex items-center gap-1.5">
              <MapPin size={13} />
              {utilisateur?.commune} · {utilisateur?.region?.charAt(0)}{utilisateur?.region?.slice(1).toLowerCase()}
            </p>
          </div>
        </div>
        
        {/* Floating Action Button — Uniquement sur Mobile */}
        <div className="md:hidden fixed bottom-24 right-5 z-40">
          <Link href="/vendre" className="flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-[0_8px_25px_rgba(34,139,34,0.4)] hover:scale-110 active:scale-95 transition-all duration-300">
            <Plus size={28} strokeWidth={3} />
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-5">

          {/* Alerte commandes en attente */}
          {commandesEnAttente.length > 0 && (
            <Link href="/commandes"
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 animate-fade-up hover:bg-amber-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock size={15} className="text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-amber-700 flex-1">
                {commandesEnAttente.length} commande{commandesEnAttente.length > 1 ? 's' : ''} en attente de paiement
              </p>
              <ChevronRight size={16} className="text-amber-500" />
            </Link>
          )}

          {/* Stats 2×2 */}
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            {stats.map((s, i) => (
              <div key={s.label} className="bg-white/80 backdrop-blur-md border border-white/60 p-4 rounded-3xl shadow-sm animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0 mb-2`}>
                  <s.Icon size={18} className={s.iconColor} strokeWidth={2.5} />
                </div>
                <div className={`text-2xl font-black ${s.color} leading-none mb-1`}>{s.valeur}</div>
                <div className="text-[10px] font-bold text-muted-fg uppercase tracking-tight">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-sm animate-fade-up delay-100">
            <div className="px-5 py-4 border-b border-border/40">
              <h2 className="text-foreground font-black text-sm uppercase tracking-wider italic">{t('dashboard.quick_actions')}</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {actions.map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-2xl transition-all duration-300 group ${a.wrap}`}>
                  <div className={`relative w-11 h-11 rounded-2xl ${a.bg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <a.Icon size={18} color="white" strokeWidth={2.5} />
                    {(a.badge ?? 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                        {a.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tight text-center ${a.labelColor}`}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Widget Messagerie — NOUVEAU */}
          {conversations && conversations.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl shadow-sm animate-fade-up">
              <div className="px-5 py-4 flex items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <MessageSquare size={16} className="text-primary-700 font-bold" />
                  </div>
                  <h2 className="font-black text-sm uppercase tracking-wider text-foreground">{t('dashboard.recent_messages')}</h2>
                </div>
                <Link href="/messages" className="text-[10px] font-black uppercase text-primary-700 bg-primary-50 px-3 py-1 rounded-full">{t('dashboard.view_all')}</Link>
              </div>
              <div className="divide-y divide-border/30">
                {(conversations as any[]).slice(0, 3).map((conv) => {
                  const estAcheteur = conv.acheteurId === utilisateur?.id;
                  const partenaire = estAcheteur ? conv.vendeur : conv.acheteur;
                  const dernierMsg = conv.messages[0];
                  return (
                    <Link key={conv.id} href={`/messages#${conv.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-xs font-black text-muted-fg border border-border/50">
                        {partenaire.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-foreground truncate">{partenaire.nom}</p>
                        <p className="text-[10px] text-muted-fg truncate mt-0.5">
                          {dernierMsg ? (dernierMsg.expediteurId === utilisateur?.id ? 'Vous : ' : '') + dernierMsg.contenu : 'Démarrer...'}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-muted-fg/40" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prix du jour */}
          {prix && prix.length > 0 && (
            <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow-sm animate-fade-up delay-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div>
                  <p className="text-[10px] font-black text-muted-fg uppercase tracking-widest">{t('dashboard.inventory')}</p>
                  <h2 className="font-black text-sm uppercase text-foreground mt-0.5">{t('dashboard.market_prices')}</h2>
                </div>
                <Link href="/marche"
                  className="text-[10px] font-black text-primary-700 bg-primary-100/50 px-3 py-1 rounded-full flex items-center gap-1 transition-colors">
                  {t('dashboard.view_all')} <ChevronRight size={10} strokeWidth={3} />
                </Link>
              </div>
              <div className="px-5 py-1">
                {prix.slice(0, 5).map((p: any, i: number) => (
                  <div key={p.id} className="flex justify-between items-center py-3.5 border-b border-border/30 last:border-0 animate-fade-up" style={{ animationDelay: `${200 + i * 50}ms` }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(34,139,34,0.4)]" />
                      <span className="text-xs font-bold text-foreground">
                        {p.produit}
                      </span>
                    </div>
                    <span className="text-xs font-black text-primary-800">
                      {p.prixKg.toLocaleString('fr')} F/kg
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
              <Link href="/vendre" className="btn btn-primary btn-sm gap-1.5">
                <Plus size={13} strokeWidth={2.5} /> Nouvelle
              </Link>
            </div>

            {nbProduits === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                  <Sprout size={32} className="text-primary-400" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-foreground-3 mb-1">Aucune annonce</p>
                <p className="text-sm text-muted-fg mb-5">Publiez votre première récolte en 2 minutes</p>
                <Link href="/vendre" className="btn btn-primary btn-sm">Commencer</Link>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {(produits as Array<{id: string; type: string; quantiteKg: number; prixFcfa: number; commune: string; region: string; photoUrl?: string | null; description?: string | null; createdAt?: string; disponible: boolean}>)?.map((p, i) => (
                  <div key={p.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <CarteAnnonce annonce={p} type="produit" />
                    {/* Boutons en bas à droite — ne cachent pas le prix qui est en haut */}
                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                      <Link
                        href={`/produits/${p.id}/modifier`}
                        aria-label="Modifier cette annonce"
                        className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 flex items-center justify-center transition-all hover:scale-110 duration-200"
                      >
                        <Pencil size={13} className="text-primary-600" strokeWidth={2} aria-hidden="true" />
                      </Link>
                      <button
                        onClick={() => supprimerAnnonce(p.id)}
                        disabled={suppression === p.id}
                        aria-label="Supprimer cette annonce"
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-all hover:scale-110 duration-200"
                      >
                        {suppression === p.id
                          ? <Loader2 size={13} className="animate-spin text-red-500" aria-hidden="true" />
                          : <Trash2 size={13} className="text-red-500" strokeWidth={2} aria-hidden="true" />
                        }
                      </button>
                    </div>
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
