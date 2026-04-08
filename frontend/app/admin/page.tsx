'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import {
  Users, Wheat, ShoppingCart, Banknote, Wrench, PawPrint,
  ClipboardList, Search, Eye, EyeOff, Trash2, UserX, UserCheck,
  Ban, AlertTriangle, ChevronRight, ShieldCheck,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

interface Stats {
  utilisateurs: number;
  produits: { total: number; disponibles: number };
  animaux: number;
  materiel: number;
  commandes: { total: number; enAttente: number; payees: number; livrees: number };
  commissions: number;
}

interface Annonce {
  id: string; type: string; commune: string; region: string;
  prixFcfa: number; quantiteKg: number; disponible: boolean; createdAt: string;
  agriculteur: { nom: string; telephone: string };
}

interface Commande {
  id: string; quantiteKg: number; montantFcfa: number; commission: number;
  statut: string; createdAt: string;
  produit: { type: string; commune: string };
  acheteur: { nom: string; telephone: string };
  vendeur: { nom: string; telephone: string };
}

interface Utilisateur {
  id: string; nom: string; telephone: string; role: string;
  commune: string; region: string; actif: boolean; createdAt: string;
  _count: { produits: number; achats: number };
}

interface AdminMateriel {
  id: string; type: string; commune: string; region: string;
  prixJour: number; disponible: boolean; createdAt: string;
  proprietaire: { nom: string; telephone: string };
}

interface AdminAnimal {
  id: string; type: string; race?: string; commune: string; region: string;
  prixFcfa: number; vendu: boolean; createdAt: string;
  vendeur: { nom: string; telephone: string };
}

const STATUT_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  EN_ATTENTE:      { label: 'En attente',      badge: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  PAIEMENT_INITIE: { label: 'Paiement initié', badge: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-400' },
  PAYE:            { label: 'Payée',            badge: 'bg-primary-50 text-primary-700 border-primary-200', dot: 'bg-primary-500' },
  LIVRE:           { label: 'Livrée',           badge: 'bg-primary-50 text-primary-700 border-primary-200', dot: 'bg-primary-600' },
  ANNULE:          { label: 'Annulée',          badge: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-400' },
};

type OngletType = 'annonces' | 'commandes' | 'utilisateurs' | 'materiel' | 'animaux';

const ONGLETS: { id: OngletType; label: string; Icon: React.ElementType; statsKey?: (s: Stats) => number }[] = [
  { id: 'annonces',     label: 'Récoltes',     Icon: Wheat,         statsKey: s => s.produits.total },
  { id: 'materiel',     label: 'Matériel',     Icon: Wrench,        statsKey: s => s.materiel },
  { id: 'animaux',      label: 'Élevage',      Icon: PawPrint,      statsKey: s => s.animaux },
  { id: 'commandes',    label: 'Commandes',    Icon: ClipboardList, statsKey: s => s.commandes.total },
  { id: 'utilisateurs', label: 'Utilisateurs', Icon: Users,         statsKey: s => s.utilisateurs },
];

// ── Composant principal ───────────────────────────────────────

export default function PageAdmin() {
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const hasHydrated = useStore(s => s._hasHydrated);
  const qc = useQueryClient();

  const [onglet, setOnglet] = useState<OngletType>('annonces');
  const [searchAnnonces, setSearchAnnonces] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreRole, setFiltreRole] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push('/connexion'); return; }
    if (utilisateur && utilisateur.role !== 'ADMIN') { router.push('/'); }
  }, [hasHydrated, token, utilisateur, router]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
    enabled: utilisateur?.role === 'ADMIN',
  });

  const { data: annoncesData, isLoading: loadingAnnonces } = useQuery<{ data: Annonce[] }>({
    queryKey: ['admin-annonces', searchAnnonces],
    queryFn: async () => (await api.get('/admin/annonces', { params: { search: searchAnnonces || undefined, limit: 50 } })).data,
    enabled: onglet === 'annonces' && utilisateur?.role === 'ADMIN',
  });

  const { data: commandesData, isLoading: loadingCommandes } = useQuery<{ data: Commande[] }>({
    queryKey: ['admin-commandes', filtreStatut],
    queryFn: async () => (await api.get('/admin/commandes', { params: { statut: filtreStatut || undefined, limit: 50 } })).data,
    enabled: onglet === 'commandes' && utilisateur?.role === 'ADMIN',
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery<{ data: Utilisateur[] }>({
    queryKey: ['admin-utilisateurs', searchUsers, filtreRole],
    queryFn: async () => (await api.get('/admin/utilisateurs', { params: { search: searchUsers || undefined, role: filtreRole || undefined, limit: 50 } })).data,
    enabled: onglet === 'utilisateurs' && utilisateur?.role === 'ADMIN',
  });

  const { data: materielData, isLoading: loadingMateriel } = useQuery<{ data: AdminMateriel[] }>({
    queryKey: ['admin-materiel'],
    queryFn: async () => (await api.get('/admin/materiel', { params: { limit: 50 } })).data,
    enabled: onglet === 'materiel' && utilisateur?.role === 'ADMIN',
  });

  const { data: animauxData, isLoading: loadingAnimaux } = useQuery<{ data: AdminAnimal[] }>({
    queryKey: ['admin-animaux'],
    queryFn: async () => (await api.get('/admin/animaux', { params: { limit: 50 } })).data,
    enabled: onglet === 'animaux' && utilisateur?.role === 'ADMIN',
  });

  const supprimerAnnonce = useMutation({ mutationFn: (id: string) => api.delete(`/admin/annonces/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-annonces'] }) });
  const toggleAnnonce    = useMutation({ mutationFn: (id: string) => api.patch(`/admin/annonces/${id}/toggle`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-annonces'] }) });
  const toggleUser       = useMutation({ mutationFn: (id: string) => api.patch(`/admin/utilisateurs/${id}/toggle`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-utilisateurs'] }) });
  const toggleMateriel   = useMutation({ mutationFn: (id: string) => api.patch(`/admin/materiel/${id}/toggle`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materiel'] }) });
  const supprimerMateriel = useMutation({ mutationFn: (id: string) => api.delete(`/admin/materiel/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materiel'] }) });
  const supprimerAnimal  = useMutation({ mutationFn: (id: string) => api.delete(`/admin/animaux/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-animaux'] }) });

  const annonces  = annoncesData?.data ?? [];
  const commandes = commandesData?.data ?? [];
  const users     = usersData?.data ?? [];
  const materiels = materielData?.data ?? [];
  const animaux   = animauxData?.data ?? [];

  if (!hasHydrated || !utilisateur || utilisateur.role !== 'ADMIN') return null;

  const Skeleton = ({ n = 5 }: { n?: number }) => (
    <div className="space-y-2">{[...Array(n)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
  );

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Administration" />

      <main className="flex-1 pb-8">

        {/* Hero admin */}
        <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 px-4 pt-8 pb-16 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-8 bottom-4 w-32 h-32 rounded-full bg-white/5" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
              <ShieldCheck size={12} className="text-white/80" />
              <span className="text-white/80 text-xs font-semibold tracking-wide">Panneau admin</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
              Bonjour, {utilisateur.nom.split(' ')[0]} 👋
            </h1>
            <p className="text-white/55 text-sm">Gérez la plateforme Sɔrɔ</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-5">

          {/* Stats 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { Icon: Users,       val: stats?.utilisateurs ?? '—',              label: 'Utilisateurs',   iconBg: 'bg-purple-100', iconColor: 'text-purple-600', color: 'text-purple-700' },
              { Icon: Wheat,       val: stats?.produits.disponibles ?? '—',      label: 'Annonces actives', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', color: 'text-primary-700' },
              { Icon: ShoppingCart,val: stats?.commandes.total ?? '—',           label: 'Commandes',      iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  color: 'text-foreground',
                sub: stats ? `${stats.commandes.enAttente} en attente` : undefined },
              { Icon: Banknote,    val: stats ? `${(stats.commissions / 1000).toFixed(0)}k` : '—', label: 'Commissions FCFA', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', color: 'text-emerald-700' },
            ].map(({ Icon, val, label, iconBg, iconColor, color, sub }) => (
              <div key={label} className="stat-card">
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={iconColor} strokeWidth={2} />
                </div>
                <div className={`text-2xl md:text-3xl font-black ${color} mt-1`}>{val}</div>
                <div className="text-xs font-semibold text-muted-fg leading-tight">{label}</div>
                {sub && <div className="text-xs text-amber-600 font-bold mt-0.5">{sub}</div>}
              </div>
            ))}
          </div>

          {/* Onglets avec icons */}
          <div className="flex gap-1 bg-surface-3 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {ONGLETS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setOnglet(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap min-w-fit ${
                  onglet === id ? 'bg-white text-foreground shadow-sm' : 'text-muted-fg hover:text-foreground'
                }`}>
                <Icon size={13} strokeWidth={2} />
                {label}
                {stats && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${onglet === id ? 'bg-surface-3 text-muted-fg' : 'bg-surface-2 text-muted-fg'}`}>
                    {ONGLETS.find(o => o.id === id)?.statsKey?.(stats)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Récoltes ── */}
          {onglet === 'annonces' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
                <input type="search" value={searchAnnonces} onChange={e => setSearchAnnonces(e.target.value)}
                  placeholder="Chercher une annonce…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-primary-500 transition-all" />
              </div>
              {loadingAnnonces ? <Skeleton /> : annonces.length === 0 ? (
                <div className="text-center py-12 text-muted-fg text-sm">Aucune annonce</div>
              ) : (
                <div className="card overflow-hidden divide-y divide-border/40">
                  {annonces.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                        <Wheat size={16} className="text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${a.disponible ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-surface-3 text-muted-fg border-border'}`}>
                            {a.disponible ? 'Visible' : 'Masquée'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-fg truncate mt-0.5">
                          {a.agriculteur.nom} · {a.commune} · {a.prixFcfa.toLocaleString('fr')} F/kg · {a.quantiteKg} kg
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleAnnonce.mutate(a.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-3 transition-colors text-muted-fg hover:text-foreground"
                          title={a.disponible ? 'Masquer' : 'Activer'}>
                          {a.disponible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer l'annonce de ${a.agriculteur.nom} ?`)) supprimerAnnonce.mutate(a.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                          title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Matériel ── */}
          {onglet === 'materiel' && (
            <div className="space-y-3">
              {loadingMateriel ? <Skeleton /> : materiels.length === 0 ? (
                <div className="text-center py-12 text-muted-fg text-sm">Aucun matériel</div>
              ) : (
                <div className="card overflow-hidden divide-y divide-border/40">
                  {materiels.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                        <Wrench size={16} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{m.type.charAt(0) + m.type.slice(1).toLowerCase()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${m.disponible ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-surface-3 text-muted-fg border-border'}`}>
                            {m.disponible ? 'Visible' : 'Masqué'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-fg truncate mt-0.5">
                          {m.proprietaire.nom} · {m.commune} · {m.prixJour.toLocaleString('fr')} F/jour
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleMateriel.mutate(m.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-3 transition-colors text-muted-fg" title={m.disponible ? 'Masquer' : 'Activer'}>
                          {m.disponible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer ce matériel de ${m.proprietaire.nom} ?`)) supprimerMateriel.mutate(m.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors text-red-500" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Élevage ── */}
          {onglet === 'animaux' && (
            <div className="space-y-3">
              {loadingAnimaux ? <Skeleton /> : animaux.length === 0 ? (
                <div className="text-center py-12 text-muted-fg text-sm">Aucun animal</div>
              ) : (
                <div className="card overflow-hidden divide-y divide-border/40">
                  {animaux.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                        <PawPrint size={16} className="text-rose-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                            {a.race && <span className="text-muted-fg font-normal"> · {a.race}</span>}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${!a.vendu ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-surface-3 text-muted-fg border-border'}`}>
                            {a.vendu ? 'Vendu' : 'Disponible'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-fg truncate mt-0.5">
                          {a.vendeur.nom} · {a.commune} · {a.prixFcfa.toLocaleString('fr')} FCFA
                        </p>
                      </div>
                      <button onClick={() => { if (confirm(`Supprimer cet animal de ${a.vendeur.nom} ?`)) supprimerAnimal.mutate(a.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors text-red-500 flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Commandes ── */}
          {onglet === 'commandes' && (
            <div className="space-y-3">
              {/* Action bulk */}
              <button
                onClick={async () => {
                  if (!confirm('Annuler toutes les commandes bloquées en "Paiement initié" ?')) return;
                  const bloquees = commandes.filter(c => c.statut === 'PAIEMENT_INITIE');
                  await Promise.all(bloquees.map(c => api.post(`/commandes/${c.id}/annuler`)));
                  qc.invalidateQueries({ queryKey: ['admin-commandes'] });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all">
                <AlertTriangle size={13} />
                Annuler toutes les commandes bloquées
              </button>

              {/* Filtres statut */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {['', 'EN_ATTENTE', 'PAIEMENT_INITIE', 'PAYE', 'LIVRE', 'ANNULE'].map(s => (
                  <button key={s} onClick={() => setFiltreStatut(s)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                      filtreStatut === s ? 'bg-purple-700 text-white' : 'bg-surface-3 text-muted-fg hover:bg-surface-2'
                    }`}>
                    {s === '' ? 'Toutes' : STATUT_CONFIG[s]?.label ?? s}
                  </button>
                ))}
              </div>

              {loadingCommandes ? <Skeleton /> : commandes.length === 0 ? (
                <div className="text-center py-12 text-muted-fg text-sm">Aucune commande</div>
              ) : (
                <div className="card overflow-hidden divide-y divide-border/40">
                  {commandes.map(c => {
                    const cfg = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.ANNULE;
                    const date = new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    return (
                      <div key={c.id} className="px-4 py-3.5 hover:bg-surface-2 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShoppingCart size={15} className="text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">
                                {c.produit.type.charAt(0) + c.produit.type.slice(1).toLowerCase()} · {c.quantiteKg} kg
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.badge}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-fg mt-0.5">
                              {c.acheteur.nom} → {c.vendeur.nom} · {c.produit.commune} · {date}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <div className="font-black text-sm text-foreground">{c.montantFcfa.toLocaleString('fr')} F</div>
                            <div className="text-[10px] text-muted-fg font-mono">#{c.id.slice(-6).toUpperCase()}</div>
                            {!['LIVRE', 'ANNULE'].includes(c.statut) && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Annuler la commande #${c.id.slice(-6).toUpperCase()} ?`)) return;
                                  await api.post(`/commandes/${c.id}/annuler`);
                                  qc.invalidateQueries({ queryKey: ['admin-commandes'] });
                                }}
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold">
                                <Ban size={11} /> Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Utilisateurs ── */}
          {onglet === 'utilisateurs' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
                  <input type="search" value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                    placeholder="Nom, téléphone, commune…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-primary-500 transition-all" />
                </div>
                <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)}
                  className="text-sm border border-border rounded-xl px-3 py-2 bg-white outline-none focus:border-primary-500">
                  <option value="">Tous</option>
                  <option value="AGRICULTEUR">Agriculteur</option>
                  <option value="ACHETEUR">Acheteur</option>
                  <option value="BOUTIQUE">Boutique</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {loadingUsers ? <Skeleton /> : users.length === 0 ? (
                <div className="text-center py-12 text-muted-fg text-sm">Aucun utilisateur</div>
              ) : (
                <div className="card overflow-hidden divide-y divide-border/40">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-sm font-bold">{u.nom.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{u.nom}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            u.role === 'ADMIN'       ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            u.role === 'AGRICULTEUR' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                                       'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>{u.role}</span>
                          {!u.actif && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold">Suspendu</span>}
                        </div>
                        <p className="text-xs text-muted-fg truncate mt-0.5">
                          {u.telephone} · {u.commune} · {u._count.produits} annonce{u._count.produits !== 1 ? 's' : ''} · {u._count.achats} achat{u._count.achats !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => { if (confirm(`${u.actif ? 'Suspendre' : 'Réactiver'} ${u.nom} ?`)) toggleUser.mutate(u.id); }}
                        disabled={u.role === 'ADMIN'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                          u.role === 'ADMIN' ? 'opacity-20 cursor-not-allowed text-muted-fg' :
                          u.actif ? 'hover:bg-red-50 text-red-500' : 'hover:bg-primary-50 text-primary-600'
                        }`}
                        title={u.actif ? 'Suspendre' : 'Réactiver'}>
                        {u.actif ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
