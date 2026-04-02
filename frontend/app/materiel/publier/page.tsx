'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

const TYPES = [
  { value: 'TRACTEUR',      label: 'Tracteur',      emoji: '🚜' },
  { value: 'MOTOPOMPE',     label: 'Motopompe',     emoji: '💧' },
  { value: 'BATTEUSE',      label: 'Batteuse',      emoji: '⚙️' },
  { value: 'CHARRUE',       label: 'Charrue',       emoji: '🔩' },
  { value: 'SEMOIR',        label: 'Semoir',        emoji: '🌱' },
  { value: 'SILO',          label: 'Silo',          emoji: '🏗️' },
  { value: 'REMORQUE',      label: 'Remorque',      emoji: '🚛' },
  { value: 'PULVERISATEUR', label: 'Pulvérisateur', emoji: '💦' },
  { value: 'MOISSONNEUSE',  label: 'Moissonneuse',  emoji: '🌾' },
];

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT',
];

export default function PagePublierMateriel() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: '',
    prixJour: '',
    caution: '',
    description: '',
    commune: '',
    region: 'BAMAKO',
  });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { setErreur('Choisissez le type de matériel'); return; }

    setChargement(true);
    setErreur('');
    try {
      await api.post('/materiel', {
        ...form,
        prixJour: parseInt(form.prixJour),
        caution: parseInt(form.caution),
      });
      router.push('/materiel');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Publier du matériel" retour="/materiel" />

      <main className="flex-1 px-4 py-6 pb-10 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Type */}
          <div>
            <p className="section-label mb-1">Étape 1</p>
            <h2 className="section-title mb-4">Quel matériel ?</h2>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                    form.type === t.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm scale-105'
                      : 'border-border bg-white text-foreground-3 hover:border-border-strong'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Localisation */}
          <div>
            <p className="section-label mb-1">Étape 2</p>
            <h2 className="section-title mb-4">Où est-il situé ?</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Région</label>
                <select
                  value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  className="input bg-white"
                >
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Commune</label>
                <input
                  type="text"
                  value={form.commune}
                  onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                  placeholder="Niono…"
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div>
            <p className="section-label mb-1">Étape 3</p>
            <h2 className="section-title mb-4">Tarif</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Prix/jour (FCFA)</label>
                <input
                  type="number"
                  value={form.prixJour}
                  onChange={e => setForm(f => ({ ...f, prixJour: e.target.value }))}
                  placeholder="Ex: 15000"
                  min="1"
                  className="input text-lg font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Caution (FCFA)</label>
                <input
                  type="number"
                  value={form.caution}
                  onChange={e => setForm(f => ({ ...f, caution: e.target.value }))}
                  placeholder="Ex: 50000"
                  min="0"
                  className="input text-lg font-bold"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-fg mt-2">La caution est remboursée après retour du matériel en bon état</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Description <span className="text-muted-fg font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="État, marque, année, capacité…"
              rows={3}
              className="input resize-none"
            />
          </div>

          {erreur && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {erreur}
            </div>
          )}

          <button type="submit" disabled={chargement} className="btn btn-amber w-full btn-lg">
            {chargement ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            Publier le matériel
          </button>

        </form>
      </main>
    </div>
  );
}
