'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

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
  id: string;
  type: string;
  commune: string;
  region: string;
  prixFcfa: number;
  quantiteKg: number;
  disponible: boolean;
  createdAt: string;
  agriculteur: { nom: string; telephone: string };
}

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

interface Utilisateur {
  id: string;
  nom: string;
  telephone: string;
  role: string;
  commune: string;
  region: string;
  actif: boolean;
  createdAt: string;
  _count: { produits: number; achats: number };
}

interface AdminMateriel {
  id: string;
  type: string;
  commune: string;
  region: string;
  prixJour: number;
  disponible: boolean;
  createdAt: string;
  proprietaire: { nom: string; telephone: string };
}

interface AdminAnimal {
  id: string;
  type: string;
  race?: string;
  commune: string;
  region: string;
  prixFcfa: number;
  vendu: boolean;
  createdAt: string;
  vendeur: { nom: string; telephone: string };
}

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-50 text-amber-700',
  PAIEMENT_INITIE: 'bg-blue-50 text-blue-700',
  PAYE: 'bg-primary-50 text-primary-700',
  LIVRE: 'bg-primary-50 text-primary-700',
  ANNULE: 'bg-red-50 text-red-700',
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  PAIEMENT_INITIE: 'Paiement initié',
  PAYE: 'Payée',
  LIVRE: 'Livrée',
  ANNULE: 'Annulée',
};

// ── Composant principal ───────────────────────────────────────

export default function PageAdmin() {
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const hasHydrated = useStore(s => s._hasHydrated);
  const qc = useQueryClient();

  const [onglet, setOnglet] = useState<'annonces' | 'commandes' | 'utilisateurs' | 'materiel' | 'animaux'>('annonces');
  const [searchAnnonces, setSearchAnnonces] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreRole, setFiltreRole] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push('/connexion'); return; }
    if (utilisateur && utilisateur.role !== 'ADMIN') { router.push('/'); }
  }, [hasHydrated, token, utilisateur, router]);

  // ── Queries ─────────────────────────────────────────────────

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

  // ── Mutations ────────────────────────────────────────────────

  const supprimerAnnonce = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/annonces/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-annonces'] }),
  });

  const toggleAnnonce = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/annonces/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-annonces'] }),
  });

  const toggleUser = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/utilisateurs/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-utilisateurs'] }),
  });

  const toggleMateriel = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/materiel/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materiel'] }),
  });

  const supprimerMateriel = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/materiel/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materiel'] }),
  });

  const supprimerAnimal = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/animaux/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-animaux'] }),
  });

  const annonces = annoncesData?.data ?? [];
  const commandes = commandesData?.data ?? [];
  const users = usersData?.data ?? [];
  const materiels = materielData?.data ?? [];
  const animaux = animauxData?.data ?? [];

  if (!hasHydrated || !utilisateur || utilisateur.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Administration" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 text-center">
              <div className="text-3xl font-black text-primary-700">{stats.utilisateurs}</div>
              <div className="text-xs text-muted-fg mt-1 font-semibold">Utilisateurs</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-black text-amber-600">{stats.produits.disponibles}</div>
              <div className="text-xs text-muted-fg mt-1 font-semibold">Annonces actives</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-black text-foreground">{stats.commandes.total}</div>
              <div className="text-xs text-muted-fg mt-1 font-semibold">Commandes</div>
              <div className="text-xs text-amber-600 font-bold">{stats.commandes.enAttente} en attente</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-primary-700">{stats.commissions.toLocaleString('fr')}</div>
              <div className="text-xs text-muted-fg mt-1 font-semibold">Commissions FCFA</div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-1 bg-surface-3 p-1 rounded-2xl flex-wrap">
          {(['annonces', 'materiel', 'animaux', 'commandes', 'utilisateurs'] as const).map(o => (
            <button
              key={o}
              onClick={() => setOnglet(o)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all capitalize whitespace-nowrap ${
                onglet === o ? 'bg-white text-foreground shadow-sm' : 'text-muted-fg hover:text-foreground'
              }`}
            >
              {o === 'annonces' ? `Récoltes${stats ? ` (${stats.produits.total})` : ''}` :
               o === 'materiel' ? `Matériel${stats ? ` (${stats.materiel})` : ''}` :
               o === 'animaux' ? `Élevage${stats ? ` (${stats.animaux})` : ''}` :
               o === 'commandes' ? `Commandes${stats ? ` (${stats.commandes.total})` : ''}` :
               `Utilisateurs${stats ? ` (${stats.utilisateurs})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── Onglet Annonces ── */}
        {onglet === 'annonces' && (
          <div className="space-y-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="search"
                value={searchAnnonces}
                onChange={e => setSearchAnnonces(e.target.value)}
                placeholder="Chercher une annonce…"
                className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-primary-500 transition-all"
              />
            </div>

            {loadingAnnonces ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : annonces.length === 0 ? (
              <div className="text-center py-12 text-muted-fg">Aucune annonce</div>
            ) : (
              <div className="card overflow-hidden divide-y divide-border/40">
                {annonces.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.disponible ? 'bg-primary-50 text-primary-700' : 'bg-surface-3 text-muted-fg'}`}>
                          {a.disponible ? 'Disponible' : 'Masqué'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-fg truncate">
                        {a.agriculteur.nom} · {a.commune} · {a.prixFcfa.toLocaleString('fr')} FCFA/kg · {a.quantiteKg} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAnnonce.mutate(a.id)}
                        className="text-xs font-semibold text-muted-fg hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface-3 transition-all"
                      >
                        {a.disponible ? 'Masquer' : 'Activer'}
                      </button>
                      <button
                        onClick={() => { if (confirm(`Supprimer cette annonce de ${a.agriculteur.nom} ?`)) supprimerAnnonce.mutate(a.id); }}
                        className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Matériel ── */}
        {onglet === 'materiel' && (
          <div className="space-y-3">
            {loadingMateriel ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : materiels.length === 0 ? (
              <div className="text-center py-12 text-muted-fg">Aucun matériel</div>
            ) : (
              <div className="card overflow-hidden divide-y divide-border/40">
                {materiels.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {m.type.charAt(0) + m.type.slice(1).toLowerCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.disponible ? 'bg-primary-50 text-primary-700' : 'bg-surface-3 text-muted-fg'}`}>
                          {m.disponible ? 'Disponible' : 'Masqué'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-fg truncate">
                        {m.proprietaire.nom} · {m.commune} · {m.prixJour.toLocaleString('fr')} FCFA/jour
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleMateriel.mutate(m.id)} className="text-xs font-semibold text-muted-fg hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface-3 transition-all">
                        {m.disponible ? 'Masquer' : 'Activer'}
                      </button>
                      <button onClick={() => { if (confirm(`Supprimer ce matériel de ${m.proprietaire.nom} ?`)) supprimerMateriel.mutate(m.id); }} className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Animaux ── */}
        {onglet === 'animaux' && (
          <div className="space-y-3">
            {loadingAnimaux ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : animaux.length === 0 ? (
              <div className="text-center py-12 text-muted-fg">Aucun animal</div>
            ) : (
              <div className="card overflow-hidden divide-y divide-border/40">
                {animaux.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                          {a.race && <span className="text-muted-fg font-normal"> · {a.race}</span>}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.vendu ? 'bg-surface-3 text-muted-fg' : 'bg-rose-50 text-rose-700'}`}>
                          {a.vendu ? 'Vendu' : 'Disponible'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-fg truncate">
                        {a.vendeur.nom} · {a.commune} · {a.prixFcfa.toLocaleString('fr')} FCFA
                      </p>
                    </div>
                    <button onClick={() => { if (confirm(`Supprimer cet animal de ${a.vendeur.nom} ?`)) supprimerAnimal.mutate(a.id); }} className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all flex-shrink-0">
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Commandes ── */}
        {onglet === 'commandes' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap mb-1">
              <button
                onClick={async () => {
                  if (!confirm('Annuler toutes les commandes bloquées en "Paiement initié" ?')) return;
                  const bloquees = commandes.filter(c => c.statut === 'PAIEMENT_INITIE');
                  await Promise.all(bloquees.map(c => api.post(`/commandes/${c.id}/annuler`)));
                  queryClient.invalidateQueries({ queryKey: ['admin-commandes'] });
                }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
              >
                🧹 Annuler toutes PAIEMENT_INITIE
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['', 'EN_ATTENTE', 'PAIEMENT_INITIE', 'PAYE', 'LIVRE', 'ANNULE'].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltreStatut(s)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                    filtreStatut === s ? 'bg-primary-700 text-white' : 'bg-surface-3 text-muted-fg hover:bg-surface-2'
                  }`}
                >
                  {s === '' ? 'Toutes' : STATUT_LABELS[s]}
                </button>
              ))}
            </div>

            {loadingCommandes ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
            ) : commandes.length === 0 ? (
              <div className="text-center py-12 text-muted-fg">Aucune commande</div>
            ) : (
              <div className="card overflow-hidden divide-y divide-border/40">
                {commandes.map(c => (
                  <div key={c.id} className="px-4 py-3 hover:bg-surface-2 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {c.produit.type.charAt(0) + c.produit.type.slice(1).toLowerCase()} · {c.quantiteKg} kg
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUT_COLORS[c.statut] ?? 'bg-surface-3 text-muted-fg'}`}>
                            {STATUT_LABELS[c.statut] ?? c.statut}
                          </span>
                        </div>
                        <p className="text-xs text-muted-fg mt-0.5">
                          Acheteur: {c.acheteur.nom} ({c.acheteur.telephone})
                        </p>
                        <p className="text-xs text-muted-fg">
                          Vendeur: {c.vendeur.nom} · {c.produit.commune}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                        <div className="font-black text-sm text-foreground">{c.montantFcfa.toLocaleString('fr')} FCFA</div>
                        <div className="text-xs text-muted-fg">+{c.commission.toLocaleString('fr')} comm.</div>
                        <div className="text-xs text-muted-fg">#{c.id.slice(-6).toUpperCase()}</div>
                        {!['LIVRE', 'ANNULE'].includes(c.statut) && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Annuler la commande #${c.id.slice(-6).toUpperCase()} ?`)) return;
                              await api.post(`/commandes/${c.id}/annuler`);
                              queryClient.invalidateQueries({ queryKey: ['admin-commandes'] });
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Utilisateurs ── */}
        {onglet === 'utilisateurs' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="search"
                  value={searchUsers}
                  onChange={e => setSearchUsers(e.target.value)}
                  placeholder="Nom, téléphone, commune…"
                  className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-primary-500 transition-all"
                />
              </div>
              <select
                value={filtreRole}
                onChange={e => setFiltreRole(e.target.value)}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-white outline-none focus:border-primary-500"
              >
                <option value="">Tous rôles</option>
                <option value="AGRICULTEUR">Agriculteur</option>
                <option value="ACHETEUR">Acheteur</option>
                <option value="BOUTIQUE">Boutique</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {loadingUsers ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-fg">Aucun utilisateur</div>
            ) : (
              <div className="card overflow-hidden divide-y divide-border/40">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{u.nom.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{u.nom}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                          u.role === 'AGRICULTEUR' ? 'bg-primary-50 text-primary-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{u.role}</span>
                        {!u.actif && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">Suspendu</span>}
                      </div>
                      <p className="text-xs text-muted-fg truncate">
                        {u.telephone} · {u.commune} · {u._count.produits} annonce{u._count.produits > 1 ? 's' : ''} · {u._count.achats} achat{u._count.achats > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          if (confirm(`${u.actif ? 'Suspendre' : 'Réactiver'} ${u.nom} ?`)) toggleUser.mutate(u.id);
                        }}
                        disabled={u.role === 'ADMIN'}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all ${
                          u.role === 'ADMIN' ? 'opacity-30 cursor-not-allowed text-muted-fg' :
                          u.actif ? 'text-red-600 hover:bg-red-50' : 'text-primary-700 hover:bg-primary-50'
                        }`}
                      >
                        {u.actif ? 'Suspendre' : 'Réactiver'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
