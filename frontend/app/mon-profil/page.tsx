'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT',
];

export default function PageMonProfil() {
  const router = useRouter();
  const { utilisateur, token, hasHydrated, setUtilisateur } = useStore(s => ({
    utilisateur: s.utilisateur,
    token: s.token,
    hasHydrated: s._hasHydrated,
    setUtilisateur: s.setUtilisateur,
  }));

  const [nom, setNom] = useState('');
  const [commune, setCommune] = useState('');
  const [region, setRegion] = useState('');
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push('/connexion'); return; }
    if (utilisateur) {
      setNom(utilisateur.nom);
      setCommune(utilisateur.commune);
      setRegion(utilisateur.region);
    }
  }, [hasHydrated, token, utilisateur, router]);

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setSucces(false);
    setErreur('');
    try {
      const res = await api.put('/auth/profil', { nom, commune, region });
      setUtilisateur(res.data.data);
      setSucces(true);
      setTimeout(() => setSucces(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  const regionLabel = (r: string) => r.charAt(0) + r.slice(1).toLowerCase();

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour={utilisateur?.role === 'AGRICULTEUR' ? '/tableau-bord' : '/mon-espace'} titre="Mon profil" />

      <main className="flex-1 pb-24 md:pb-8">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

          {/* Avatar */}
          <div className="flex flex-col items-center pt-2 pb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg mb-3">
              <span className="text-white text-3xl font-black">
                {(utilisateur?.nom || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="font-bold text-foreground text-lg">{utilisateur?.nom}</p>
            <p className="text-sm text-muted-fg">{utilisateur?.telephone}</p>
            <span className="inline-flex items-center mt-2 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full">
              {{ AGRICULTEUR: 'Agriculteur', ACHETEUR: 'Acheteur', BOUTIQUE: 'Boutique / Pro', ADMIN: 'Administrateur' }[utilisateur?.role ?? ''] ?? utilisateur?.role}
            </span>
          </div>

          {/* Formulaire */}
          <form onSubmit={sauvegarder} className="card p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-1">Modifier mes informations</p>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Nom complet</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                required
                minLength={2}
                className="input"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Commune</label>
              <input
                type="text"
                value={commune}
                onChange={e => setCommune(e.target.value)}
                required
                minLength={2}
                className="input"
                placeholder="Votre commune"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Région</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="input"
              >
                {REGIONS.map(r => (
                  <option key={r} value={r}>{regionLabel(r)}</option>
                ))}
              </select>
            </div>

            {erreur && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold animate-fade-up">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {erreur}
              </div>
            )}

            {succes && (
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-700 font-semibold animate-fade-up">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Profil mis à jour
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="btn btn-primary w-full"
            >
              {chargement ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  Sauvegarde…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Sauvegarder
                </>
              )}
            </button>
          </form>

          {/* Info téléphone */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>Le numéro de téléphone ne peut pas être modifié car il sert d'identifiant de connexion.</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
