'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

const TYPES_PRODUITS = [
  { value: 'MIL',          label: 'Mil',      emoji: '🌾' },
  { value: 'SORGHO',       label: 'Sorgho',   emoji: '🌾' },
  { value: 'MAIS',         label: 'Maïs',     emoji: '🌽' },
  { value: 'RIZ',          label: 'Riz',      emoji: '🍚' },
  { value: 'ARACHIDE',     label: 'Arachide', emoji: '🥜' },
  { value: 'NIEBE',        label: 'Niébé',    emoji: '🫘' },
  { value: 'MANGUE',       label: 'Mangue',   emoji: '🥭' },
  { value: 'OIGNON',       label: 'Oignon',   emoji: '🧅' },
  { value: 'TOMATE',       label: 'Tomate',   emoji: '🍅' },
  { value: 'KARITE',       label: 'Karité',   emoji: '🌿' },
  { value: 'SESAME',       label: 'Sésame',   emoji: '✨' },
  { value: 'COTON',        label: 'Coton',    emoji: '☁️' },
  { value: 'GOMBO',        label: 'Gombo',    emoji: '🥦' },
  { value: 'PATATE_DOUCE', label: 'Patate',   emoji: '🍠' },
  { value: 'IGNAME',       label: 'Igname',   emoji: '🥔' },
];

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT',
];

export default function PageVendre() {
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);

  const [form, setForm] = useState({
    type: '',
    quantiteKg: '',
    prixFcfa: '',
    description: '',
    commune: utilisateur?.commune || '',
    region: utilisateur?.region || 'BAMAKO',
    latitude: '' as string | number,
    longitude: '' as string | number,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [prixMarche, setPrixMarche] = useState<number | null>(null);
  const [chargementPrix, setChargementPrix] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  // Récupère le prix du marché quand produit + région changent
  useEffect(() => {
    if (!form.type || !form.region) return;
    setChargementPrix(true);
    setPrixMarche(null);

    api.get(`/prix?produit=${form.type}&region=${form.region}`)
      .then(res => {
        const prix = res.data?.data?.[0]?.prixKg;
        if (prix) {
          setPrixMarche(prix);
          // Pré-remplissage automatique si le champ est vide ou si on vient de changer de type
          setForm(f => ({ ...f, prixFcfa: f.prixFcfa === '' ? String(prix) : f.prixFcfa }));
        }
      })
      .catch(() => {})
      .finally(() => setChargementPrix(false));
  }, [form.type, form.region]);


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

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { setErreur('Choisissez un produit'); return; }
    if (!form.commune) { setErreur('Veuillez indiquer votre commune'); return; }

    setChargement(true);
    setErreur('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') formData.append(k, String(v));
      });
      formData.set('quantiteKg', String(parseFloat(form.quantiteKg)));
      formData.set('prixFcfa', String(parseInt(form.prixFcfa)));
      if (photo) formData.append('photo', photo);

      await api.post('/produits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      router.push('/tableau-bord');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setChargement(false);
    }
  };

  const produitSelectionne = TYPES_PRODUITS.find(p => p.value === form.type);

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Publier ma récolte" retour="/tableau-bord" />

      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── SECTION 1 : PRODUIT ── */}
          <section className="animate-fade-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">1. Que vendez-vous ?</h2>
              <p className="text-muted-fg text-sm">Sélectionnez votre produit</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TYPES_PRODUITS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: p.value }))}
                  className={`
                    flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all duration-200
                    ${form.type === p.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-white bg-white text-foreground-3 hover:border-primary-100'
                    }
                  `}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-[10px] font-bold uppercase">{p.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── SECTION 2 : LOCALISATION ── */}
          <section className="animate-fade-up" style={{animationDelay: '100ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">2. Origine</h2>
            </div>
            
            <div className="card-glass p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Région</label>
                  <select
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
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
                {geolocating ? 'GPS...' : form.latitude ? '📍 Position GPS OK' : '🎯 Ajouter ma position GPS'}
              </button>
            </div>
          </section>

          {/* ── SECTION 3 : PRIX & QUANTITÉ ── */}
          <section className="animate-fade-up" style={{animationDelay: '200ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">3. Prix et Quantité</h2>
            </div>

            <div className="card-glass p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">Quantité (kg)</label>
                  <input
                    type="number"
                    value={form.quantiteKg}
                    onChange={e => setForm(f => ({ ...f, quantiteKg: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-2xl px-5 py-4 text-2xl font-black text-primary-700"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-muted-fg">Prix / kg (FCFA)</label>
                    {prixMarche && (
                       <button 
                        type="button"
                        onClick={() => setForm(f => ({ ...f, prixFcfa: String(prixMarche) }))}
                        className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold"
                       >
                        Prix Marché: {prixMarche} F
                       </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={form.prixFcfa}
                    onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                    className="w-full bg-surface-3 border-none rounded-2xl px-5 py-4 text-2xl font-black text-primary-700"
                    placeholder="0"
                    required
                  />

                  {/* Analyse comparative en temps réel */}
                  {form.prixFcfa && prixMarche && (
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-md ${
                        parseInt(form.prixFcfa) > prixMarche
                          ? 'bg-red-50 text-red-600'
                          : parseInt(form.prixFcfa) < prixMarche
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-primary-50 text-primary-600'
                       }`}>
                         {parseInt(form.prixFcfa) > prixMarche
                           ? `📈 +${Math.round((parseInt(form.prixFcfa) / prixMarche - 1) * 100)}% vs Marché`
                           : parseInt(form.prixFcfa) < prixMarche
                             ? `📉 -${Math.round((1 - parseInt(form.prixFcfa) / prixMarche) * 100)}% vs Marché`
                             : '✨ Prix du Marché'}
                       </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 4 : PHOTO & DESCRIPTION ── */}
          <section className="animate-fade-up" style={{animationDelay: '300ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">4. Photo et Infos</h2>
            </div>

            <div className="space-y-6">
              <label className="block cursor-pointer">
                {photoPreview ? (
                  <div className="relative rounded-3xl overflow-hidden aspect-video border-4 border-white shadow-lg">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full py-10 rounded-3xl border-2 border-dashed border-border bg-white flex flex-col items-center justify-center gap-2 hover:bg-primary-50 transition-colors">
                    <span className="text-4xl">📸</span>
                    <p className="text-sm font-bold text-foreground-3">Ajouter une photo</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>

              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Un petit mot sur la qualité..."
                className="w-full bg-white rounded-2xl p-5 text-sm font-medium border-none shadow-sm focus:ring-2 ring-primary-100"
              />
            </div>
          </section>

          {erreur && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-red-700 text-sm font-bold">
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full h-16 rounded-2xl bg-primary-700 text-white font-black text-xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3"
          >
            {chargement ? (
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Publier maintenant
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
