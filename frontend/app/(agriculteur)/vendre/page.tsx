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
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [prixMarche, setPrixMarche] = useState<number | null>(null);
  const [chargementPrix, setChargementPrix] = useState(false);

  // Récupère le prix du marché quand produit + région changent
  useEffect(() => {
    if (!form.type || !form.region) return;

    setChargementPrix(true);
    setPrixMarche(null);

    api.get(`/prix?produit=${form.type}&region=${form.region}`)
      .then(res => {
        const prix = res.data?.data?.[0]?.prixKg;
        if (prix) setPrixMarche(prix);
      })
      .catch(() => {})
      .finally(() => setChargementPrix(false));
  }, [form.type, form.region]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { setErreur('Choisissez le type de produit'); return; }

    setChargement(true);
    setErreur('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
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

      <main className="flex-1 px-4 py-6 pb-10 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* ── Choix du produit ── */}
          <div>
            <p className="section-label mb-1">Étape 1</p>
            <h2 className="section-title mb-4">Quel produit ?</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TYPES_PRODUITS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: p.value }))}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                    form.type === p.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm scale-105'
                      : 'border-border bg-white text-foreground-3 hover:border-border-strong hover:bg-surface-2'
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Région + Commune ── */}
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
          </div>

          {/* ── Quantité + Prix ── */}
          <div>
            <p className="section-label mb-1">Étape 3</p>
            <h2 className="section-title mb-4">Quantité et prix</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Quantité disponible (kg)</label>
                <input
                  type="number"
                  value={form.quantiteKg}
                  onChange={e => setForm(f => ({ ...f, quantiteKg: e.target.value }))}
                  placeholder="Ex: 500"
                  min="1"
                  className="input text-lg font-bold"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-foreground">Prix par kg (FCFA)</label>

                  {/* Badge prix du marché */}
                  {form.type && form.region && (
                    <div className="flex items-center gap-1.5">
                      {chargementPrix ? (
                        <span className="text-xs text-muted-fg animate-pulse">Chargement…</span>
                      ) : prixMarche ? (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, prixFcfa: String(prixMarche) }))}
                          className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors"
                          title="Cliquer pour utiliser ce prix"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          Marché {produitSelectionne?.label} : {prixMarche} F/kg
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  value={form.prixFcfa}
                  onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                  placeholder={prixMarche ? `Ex: ${prixMarche}` : 'Ex: 300'}
                  min="1"
                  className="input text-lg font-bold"
                  required
                />

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-fg flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Vous recevez 100% — 0% de commission
                  </p>
                  {form.prixFcfa && prixMarche && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      parseInt(form.prixFcfa) > prixMarche
                        ? 'bg-red-50 text-red-600'
                        : parseInt(form.prixFcfa) < prixMarche * 0.9
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-primary-50 text-primary-700'
                    }`}>
                      {parseInt(form.prixFcfa) > prixMarche
                        ? `+${Math.round((parseInt(form.prixFcfa) / prixMarche - 1) * 100)}% vs marché`
                        : parseInt(form.prixFcfa) < prixMarche
                          ? `-${Math.round((1 - parseInt(form.prixFcfa) / prixMarche) * 100)}% vs marché`
                          : '= Prix du marché'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Photo ── */}
          <div>
            <p className="section-label mb-1">Étape 4</p>
            <h2 className="section-title mb-4">Photo <span className="text-muted-fg font-normal text-sm">(optionnel)</span></h2>

            <label className="block cursor-pointer">
              {photoPreview ? (
                <div className="relative w-full rounded-2xl overflow-hidden" style={{aspectRatio:'16/9'}}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-semibold text-sm">Changer la photo</span>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary-400 bg-white hover:bg-primary-50/30 transition-all duration-200 flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground-3">Ajouter une photo</p>
                    <p className="text-xs text-muted-fg mt-0.5">Aide les acheteurs à mieux choisir</p>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </label>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Description <span className="text-muted-fg font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Qualité, variété, conditions de stockage…"
              rows={3}
              className="input resize-none"
            />
          </div>

          {erreur && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm animate-scale-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {erreur}
            </div>
          )}

          <button type="submit" disabled={chargement} className="btn btn-primary w-full btn-lg">
            {chargement ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Publication…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Publier mon annonce
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
