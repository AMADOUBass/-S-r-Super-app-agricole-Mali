'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

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
  const [geolocating, setGeolocating] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
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
        toast.error("Impossible de récupérer votre position. Assurez-vous d'avoir activé le GPS.");
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validerFormulaire = (): string | null => {
    if (!form.type) return "Choisissez le type d'animal";
    if (!form.commune.trim()) return 'Veuillez indiquer votre commune';
    const prix = parseInt(form.prixFcfa);
    if (!form.prixFcfa || isNaN(prix) || prix <= 0) return 'Le prix doit être un nombre positif';
    if (form.age && (isNaN(parseInt(form.age)) || parseInt(form.age) < 0)) return "L'âge doit être un nombre positif";
    if (form.poidsKg && (isNaN(parseFloat(form.poidsKg)) || parseFloat(form.poidsKg) <= 0)) return 'Le poids doit être un nombre positif';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const erreur = validerFormulaire();
    if (erreur) { toast.error(erreur); return; }

    setChargement(true);
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
      toast.success('Annonce publiée avec succès !');
      router.push('/elevage');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Vendre un animal" retour="/elevage" />

      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── SECTION 1 : QUEL ANIMAL ? ── */}
          <section className="animate-fade-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">1. Quel animal ?</h2>
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
                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-lg shadow-rose-100 scale-[1.03]'
                        : 'border-transparent bg-white/50 text-muted-fg hover:border-border hover:bg-white'
                    }`}
                  >
                    <span className="text-3xl">{t.emoji}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-xs font-black uppercase text-muted-fg mb-1.5 block">Race ou Variété</label>
                <input
                  type="text"
                  value={form.race}
                  onChange={e => setForm(f => ({ ...f, race: e.target.value }))}
                  placeholder="Ex: Peul, Azawak..."
                  className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold"
                />
              </div>
            </div>
          </section>

          {/* ── SECTION 2 : VÔTRE LIEU ── */}
          <section className="animate-fade-up" style={{animationDelay: '100ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">2. Votre Lieu</h2>
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
                  ${form.latitude ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-dashed border-border text-muted-fg hover:border-primary-300'}
                `}
              >
                {geolocating ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    Recherche...
                  </div>
                ) : form.latitude ? '📍 Position GPS Enregistrée' : '🎯 Ajouter ma position GPS'}
              </button>
            </div>
          </section>

          {/* ── SECTION 3 : PRIX & INFOS ── */}
          <section className="animate-fade-up" style={{animationDelay: '200ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">3. Prix et Infos</h2>
            </div>

            <div className="card-glass p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-fg">Prix de vente (FCFA)</label>
                <input
                  type="number"
                  value={form.prixFcfa}
                  onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                  className="w-full bg-surface-3 border-none rounded-2xl px-5 py-4 text-3xl font-black text-rose-600"
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Âge (mois)</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold"
                    placeholder="Ex: 24"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Poids (kg)</label>
                  <input
                    type="number"
                    value={form.poidsKg}
                    onChange={e => setForm(f => ({ ...f, poidsKg: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold"
                    placeholder="Ex: 150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-fg">Description libre</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="État de santé, alimentation..."
                  rows={3}
                  className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold resize-none"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={chargement}
            className="w-full h-16 rounded-2xl bg-rose-600 text-white font-black text-xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            {chargement ? (
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Publier l&apos;annonce
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
