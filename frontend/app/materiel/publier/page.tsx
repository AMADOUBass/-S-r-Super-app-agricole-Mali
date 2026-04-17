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
    if (!form.type) { setErreur('Choisissez le type de matériel'); return; }

    setChargement(true);
    setErreur('');
    try {
      await api.post('/materiel', {
        ...form,
        prixJour: parseInt(form.prixJour),
        caution: parseInt(form.caution),
        latitude: form.latitude !== '' ? Number(form.latitude) : undefined,
        longitude: form.longitude !== '' ? Number(form.longitude) : undefined,
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

      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── SECTION 1 : QUEL MATÉRIEL ? ── */}
          <section className="animate-fade-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">1. Quel matériel ?</h2>
            </div>
            
            <div className="card-glass p-5">
              <div className="grid grid-cols-3 gap-3">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-300 ${
                      form.type === t.value
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-lg shadow-amber-100 scale-[1.03]'
                        : 'border-transparent bg-white/50 text-muted-fg hover:border-border hover:bg-white'
                    }`}
                  >
                    <span className="text-3xl">{t.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── SECTION 2 : SITUATION ── */}
          <section className="animate-fade-up" style={{animationDelay: '100ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">2. Situation</h2>
            </div>

            <div className="card-glass p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Région</label>
                  <select
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold appearance-none"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Commune</label>
                  <input
                    type="text"
                    value={form.commune}
                    onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold"
                    placeholder="Ex: Niono"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeolocation}
                disabled={geolocating}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs
                  ${form.latitude ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-dashed border-border text-muted-fg hover:border-amber-300'}
                `}
              >
                {geolocating ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    Recherche...
                  </div>
                ) : form.latitude ? '📍 Localisation GPS Activée' : '🎯 Partager ma position GPS'}
              </button>
            </div>
          </section>

          {/* ── SECTION 3 : TARIF & CAUTION ── */}
          <section className="animate-fade-up" style={{animationDelay: '200ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">3. Tarif et Caution</h2>
            </div>

            <div className="card-glass p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Prix/jour (FCFA)</label>
                  <input
                    type="number"
                    value={form.prixJour}
                    onChange={e => setForm(f => ({ ...f, prixJour: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-2xl px-5 py-4 text-3xl font-black text-amber-600"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Caution (FCFA)</label>
                  <input
                    type="number"
                    value={form.caution}
                    onChange={e => setForm(f => ({ ...f, caution: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-2xl px-5 py-4 text-3xl font-black text-slate-700"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-fg">Description du matériel</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Marque, année, capacité, état de marche..."
                  rows={3}
                  className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold resize-none"
                />
              </div>
            </div>
          </section>

          {erreur && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
              ⚠️ {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-black text-xl shadow-xl shadow-amber-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            {chargement ? (
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Publier le matériel
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
