'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

const TYPES = [
  { value: 'MOUTON',   label: 'Mouton',   emoji: '🐑' },
  { value: 'BOEUF',    label: 'Bœuf',     emoji: '🐄' },
  { value: 'CHEVRE',   label: 'Chèvre',   emoji: '🐐' },
  { value: 'VOLAILLE', label: 'Volaille', emoji: '🐓' },
  { value: 'ANE',      label: 'Âne',      emoji: '🫏' },
  { value: 'CHEVAL',   label: 'Cheval',   emoji: '🐴' },
  { value: 'CHAMEAU',  label: 'Chameau',  emoji: '🐪' },
  { value: 'PORC',     label: 'Porc',     emoji: '🐷' },
];

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT',
];

export default function PagePublierAnimal() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: '',
    race: '',
    age: '',
    poidsKg: '',
    prixFcfa: '',
    description: '',
    commune: '',
    region: 'BAMAKO',
    latitude: '' as string | number,
    longitude: '' as string | number,
  });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [geolocating, setGeolocating] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setErreur("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ 
          ...f, 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude 
        }));
        setGeolocating(false);
      },
      (err) => {
        console.error(err);
        setErreur("Impossible de récupérer votre position. Assurez-vous d'avoir activé le GPS.");
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { setErreur('Choisissez le type d\'animal'); return; }

    setChargement(true);
    setErreur('');
    try {
      await api.post('/elevage', {
        type: form.type,
        race: form.race || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        poidsKg: form.poidsKg ? parseFloat(form.poidsKg) : undefined,
        prixFcfa: parseInt(form.prixFcfa),
        commune: form.commune,
        region: form.region,
        description: form.description || undefined,
        latitude: form.latitude !== '' ? Number(form.latitude) : undefined,
        longitude: form.longitude !== '' ? Number(form.longitude) : undefined,
      });
      router.push('/elevage');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Vendre un animal" retour="/elevage" />

      <main className="flex-1 px-4 py-6 pb-10 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Type animal */}
          <div>
            <p className="section-label mb-1">Étape 1</p>
            <h2 className="section-title mb-4">Quel animal ?</h2>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                    form.type === t.value
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm scale-105'
                      : 'border-border bg-white text-foreground-3 hover:border-border-strong'
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Localisation */}
          <div>
            <p className="section-label mb-1">Étape 2</p>
            <h2 className="section-title mb-4">Où êtes-vous ?</h2>
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

            <div className="mt-3">
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={geolocating}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  form.latitude 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-white border-border text-foreground-3 hover:bg-surface-2'
                }`}
              >
                {geolocating ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    Recherche GPS...
                  </>
                ) : form.latitude ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>
                    Position enregistrée ({Number(form.latitude).toFixed(3)}, {Number(form.longitude).toFixed(3)})
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Ajouter ma position exacte
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Caractéristiques */}
          <div>
            <p className="section-label mb-1">Étape 3</p>
            <h2 className="section-title mb-4">Caractéristiques</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">
                  Race <span className="text-muted-fg font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={form.race}
                  onChange={e => setForm(f => ({ ...f, race: e.target.value }))}
                  placeholder="Ex: Azawak, Peul…"
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Âge (mois) <span className="text-muted-fg font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="Ex: 24"
                    min="1"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Poids (kg) <span className="text-muted-fg font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    value={form.poidsKg}
                    onChange={e => setForm(f => ({ ...f, poidsKg: e.target.value }))}
                    placeholder="Ex: 150"
                    min="1"
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Prix */}
          <div>
            <p className="section-label mb-1">Étape 4</p>
            <h2 className="section-title mb-4">Prix de vente</h2>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Prix (FCFA)</label>
              <input
                type="number"
                value={form.prixFcfa}
                onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                placeholder="Ex: 250000"
                min="1"
                className="input text-lg font-bold"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Description <span className="text-muted-fg font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="État de santé, vaccinations, alimentation…"
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

          <button type="submit" disabled={chargement} className="btn w-full btn-lg bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl">
            {chargement ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            Publier l'annonce
          </button>

        </form>
      </main>
    </div>
  );
}
