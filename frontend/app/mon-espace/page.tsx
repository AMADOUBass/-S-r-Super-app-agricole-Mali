'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import useStore from '@/store/useStore';
import { useCommandesVendeur } from '@/lib/queries';
import {
  ShoppingCart, Clock, CheckCircle2, Banknote,
  Wheat, TrendingUp, CloudSun, ChevronRight, MapPin, PackageOpen,
} from 'lucide-react';

const heure = new Date().getHours();
const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

const STATUT_CONFIG: Record<string, { label: string; badge: string }> = {
  EN_ATTENTE:      { label: 'En attente',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAIEMENT_INITIE: { label: 'Paiement…',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAYE:            { label: 'Payée',        badge: 'bg-primary-50 text-primary-700 border-primary-200' },
  LIVRE:           { label: 'Livrée',       badge: 'bg-primary-50 text-primary-700 border-primary-200' },
  ANNULE:          { label: 'Annulée',      badge: 'bg-red-50 text-red-700 border-red-200' },
};

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

  type Commande = { id: string; acheteur: { telephone: string }; vendeur: { nom: string }; produit: { type: string }; statut: string; montantFcfa: number; commission: number; createdAt: string };
  const mesAchats = (commandes as Commande[] | undefined)
    ?.filter(c => c.acheteur.telephone === utilisateur?.telephone) ?? [];

  const enAttente = mesAchats.filter(c => c.statut === 'EN_ATTENTE').length;
  const payees = mesAchats.filter(c => ['PAYE', 'LIVRE'].includes(c.statut)).length;
  const totalDepense = mesAchats
    .filter(c => ['PAYE', 'LIVRE'].includes(c.statut))
    .reduce((s, c) => s + c.montantFcfa + c.commission, 0);

  const roleLabel = utilisateur?.role === 'ACHETEUR' ? 'Acheteur'
    : utilisateur?.role === 'BOUTIQUE' ? 'Boutique / Pro'
    : 'Utilisateur';

  const stats = [
    { valeur: mesAchats.length, label: 'Commandes passées', Icon: ShoppingCart, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', color: 'text-amber-600' },
    { valeur: enAttente,        label: 'En attente',         Icon: Clock,        iconBg: 'bg-blue-100',  iconColor: 'text-blue-500',  color: 'text-blue-600' },
    { valeur: payees,           label: 'Livrées',            Icon: CheckCircle2, iconBg: 'bg-primary-100', iconColor: 'text-primary-500', color: 'text-primary-700' },
    {
      valeur: totalDepense > 0 ? `${(totalDepense / 1000).toFixed(0)}k` : '—',
      label: 'FCFA dépensés',
      Icon: Banknote,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      color: 'text-slate-700',
    },
  ];

  const actions = [
    { href: '/produits',  Icon: Wheat,       bg: 'bg-primary-600', wrap: 'bg-primary-50 border-primary-200 hover:bg-primary-100', label: 'Acheter récoltes',  labelColor: 'text-primary-700' },
    { href: '/commandes', Icon: ShoppingCart, bg: 'bg-amber-500',   wrap: 'bg-amber-50 border-amber-200 hover:bg-amber-100',       label: 'Mes commandes',    labelColor: 'text-amber-700',  badge: enAttente },
    { href: '/marche',    Icon: TrendingUp,   bg: 'bg-slate-600',   wrap: 'bg-slate-50 border-slate-200 hover:bg-slate-100',       label: 'Prix du marché',   labelColor: 'text-slate-600' },
    { href: '/meteo',     Icon: CloudSun,     bg: 'bg-sky-500',     wrap: 'bg-sky-50 border-sky-200 hover:bg-sky-100',             label: 'Météo 7 jours',    labelColor: 'text-sky-700' },
  ];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Hero acheteur */}
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
            <p className="text-white/55 text-sm animate-fade-up delay-75 flex items-center gap-1.5">
              <MapPin size={13} />
              {utilisateur?.commune} · {utilisateur?.region?.charAt(0)}{utilisateur?.region?.slice(1).toLowerCase()}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-5">

          {/* Alerte commandes en attente */}
          {enAttente > 0 && (
            <Link href="/commandes"
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 animate-fade-up hover:bg-amber-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock size={15} className="text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-amber-700 flex-1">
                {enAttente} commande{enAttente > 1 ? 's' : ''} en attente de paiement
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
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-4">
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

          {/* Dernières commandes */}
          {mesAchats.length > 0 ? (
            <div className="card overflow-hidden animate-fade-up delay-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div>
                  <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Historique</p>
                  <h2 className="font-bold text-foreground mt-0.5">Dernières commandes</h2>
                </div>
                <Link href="/commandes" className="text-xs font-semibold text-primary-700 flex items-center gap-0.5 hover:text-primary-800 transition-colors">
                  Tout voir <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>
              <div className="divide-y divide-border/40">
                {mesAchats.slice(0, 4).map(c => {
                  const cfg = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.ANNULE;
                  const typeLabel = c.produit.type.charAt(0) + c.produit.type.slice(1).toLowerCase();
                  const date = new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                  return (
                    <Link key={c.id} href={`/commandes/${c.id}/payer`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart size={15} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{typeLabel}</p>
                        <p className="text-xs text-muted-fg">{date} · {c.vendeur.nom}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <ChevronRight size={13} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center animate-fade-up delay-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <PackageOpen size={32} className="text-amber-300" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-foreground-3 mb-1">Aucune commande</p>
              <p className="text-sm text-muted-fg mb-5">Explorez les récoltes disponibles</p>
              <Link href="/produits" className="btn btn-primary btn-sm">Voir les récoltes</Link>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
