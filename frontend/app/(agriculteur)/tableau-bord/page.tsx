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
import {
  Wheat, Clock, CheckCircle2, Banknote,
  Plus, ClipboardList, CloudSun, TrendingUp,
  ChevronRight, Trash2, Loader2, MapPin, Sprout,
} from 'lucide-react';

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
      valeur: revenuTotal > 0 ? `${(revenuTotal / 1000).toFixed(0)}k` : '—',
      label: 'FCFA encaissés',
      Icon: Banknote,
      color: 'text-amber-700',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const actions = [
    { href: '/vendre',    Icon: Plus,          bg: 'bg-primary-600', wrap: 'bg-primary-50 border-primary-200 hover:bg-primary-100', label: 'Nouvelle annonce', labelColor: 'text-primary-700' },
    { href: '/commandes', Icon: ClipboardList,  bg: 'bg-amber-500',   wrap: 'bg-amber-50 border-amber-200 hover:bg-amber-100',       label: 'Mes commandes',    labelColor: 'text-amber-700',   badge: commandesEnAttente.length },
    { href: '/meteo',     Icon: CloudSun,       bg: 'bg-sky-500',     wrap: 'bg-sky-50 border-sky-200 hover:bg-sky-100',             label: 'Météo 7 jours',    labelColor: 'text-sky-700' },
    { href: '/marche',    Icon: TrendingUp,     bg: 'bg-slate-600',   wrap: 'bg-slate-50 border-slate-200 hover:bg-slate-100',       label: 'Prix du marché',   labelColor: 'text-slate-600' },
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
              <div key={s.label} className="stat-card animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <s.Icon size={18} className={s.iconColor} strokeWidth={2} />
                </div>
                <div className={`text-3xl font-black ${s.color} mt-1`}>{s.valeur}</div>
                <div className="text-xs font-semibold text-muted-fg leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="card overflow-hidden animate-fade-up delay-100">
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-5 py-4">
              <h2 className="text-white font-bold text-base">Actions rapides</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {actions.map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all duration-200 group ${a.wrap}`}>
                  <div className={`relative w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    <a.Icon size={18} color="white" strokeWidth={2.5} />
                    {(a.badge ?? 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                        {a.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold text-center leading-tight ${a.labelColor}`}>{a.label}</span>
                </Link>
              ))}
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
                <Link href="/marche"
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1 transition-colors">
                  Voir tout <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>
              <div className="px-5 py-1">
                {prix.slice(0, 5).map((p: { id: string; produit: string; prixKg: number }, i: number) => (
                  <div key={p.id} className="flex justify-between items-center py-3 border-b border-border/40 last:border-0 animate-fade-up" style={{ animationDelay: `${200 + i * 50}ms` }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                      <span className="text-sm font-medium text-foreground-2">
                        {p.produit.charAt(0) + p.produit.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-0.5 rounded-full">
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
              <div className="divide-y divide-border/40">
                {(produits as Array<{id: string; type: string; quantiteKg: number; prixFcfa: number; commune: string; region: string; photoUrl?: string | null; description?: string | null; createdAt?: string; disponible: boolean}>)?.map((p, i) => (
                  <div key={p.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <CarteAnnonce annonce={p} type="produit" />
                    <button
                      onClick={() => supprimerAnnonce(p.id)}
                      disabled={suppression === p.id}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-all hover:scale-110 duration-200"
                      title="Supprimer"
                    >
                      {suppression === p.id
                        ? <Loader2 size={13} className="animate-spin text-red-500" />
                        : <Trash2 size={13} className="text-red-500" strokeWidth={2} />
                      }
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
