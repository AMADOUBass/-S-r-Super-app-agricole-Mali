'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { 
  Plus, 
  MapPin, 
  Camera, 
  Check, 
  Loader2, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  Info
} from 'lucide-react';

type Mode = 'HARVEST' | 'LIVESTOCK' | 'EQUIPMENT';

const HARVEST_TYPES = [
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

const ANIMAL_TYPES = [
  { value: 'BOEUF',    label: 'Bœuf',    emoji: '🐂' },
  { value: 'MOUTON',   label: 'Mouton',  emoji: '🐑' },
  { value: 'CHEVRE',   label: 'Chèvre',  emoji: '🐐' },
  { value: 'VOLAILLE', label: 'Volaille',emoji: '🐔' },
  { value: 'PORC',     label: 'Porc',    emoji: '🐖' },
  { value: 'ANE',      label: 'Âne',     emoji: '🫏' },
  { value: 'CHEVAL',   label: 'Cheval',  emoji: '🐎' },
  { value: 'CHAMEAU',  label: 'Chameau', emoji: '🐪' },
];

const EQUIPMENT_TYPES = [
  { value: 'TRACTEUR',     label: 'Tracteur',     emoji: '🚜' },
  { value: 'MOTOPOMPE',    label: 'Motopompe',    emoji: '💧' },
  { value: 'BATTEUSE',     label: 'Batteuse',     emoji: '⚙️' },
  { value: 'CHARRUE',      label: 'Charrue',      emoji: '⛏️' },
  { value: 'SEMOIR',       label: 'Semoir',       emoji: '🌱' },
  { value: 'SILO',         label: 'Silo',         emoji: '🏗️' },
  { value: 'REMORQUE',     label: 'Remorque',     emoji: '🚛' },
  { value: 'PULVERISATEUR',label: 'Pulvérisateur',emoji: '🚿' },
  { value: 'MOISSONNEUSE', label: 'Moissonneuse', emoji: '🌾' },
];

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT',
];

function VendreContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);

  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as Mode | null;

  const [mode, setMode] = useState<Mode | null>(initialMode);
  const [form, setForm] = useState({
    type: '',
    // Récolte
    quantiteKg: '',
    prixFcfa: '',
    // Élevage
    age: '',
    race: '',
    poidsKg: '',
    // Matériel
    prixJour: '',
    caution: '',
    // Commun
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
  const [geolocating, setGeolocating] = useState(false);

  // Prix du marché (Harvest uniquement)
  useEffect(() => {
    if (mode !== 'HARVEST' || !form.type || !form.region) return;
    api.get(`/prix?produit=${form.type}&region=${form.region}`)
      .then(res => {
        const prix = res.data?.data?.[0]?.prixKg;
        if (prix) {
          setPrixMarche(prix);
          setForm(f => ({ ...f, prixFcfa: f.prixFcfa === '' ? String(prix) : f.prixFcfa }));
        }
      })
      .catch(() => {});
  }, [mode, form.type, form.region]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGeolocating(false);
      },
      () => setGeolocating(false),
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
    if (!mode || !form.type) { setErreur(t('common.error')); return; }

    setChargement(true);
    setErreur('');

    try {
      const formData = new FormData();
      const endpoint = mode === 'HARVEST' ? '/produits' : mode === 'LIVESTOCK' ? '/elevage' : '/materiel';

      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') formData.append(k, String(v));
      });

      // Nettoyage spécifique selon mode
      if (mode === 'HARVEST') {
        formData.set('quantiteKg', String(parseFloat(form.quantiteKg)));
        formData.set('prixFcfa', String(parseInt(form.prixFcfa)));
      } else if (mode === 'LIVESTOCK') {
        formData.set('prixFcfa', String(parseInt(form.prixFcfa)));
        if(form.age) formData.set('age', String(parseInt(form.age)));
        if(form.poidsKg) formData.set('poidsKg', String(parseFloat(form.poidsKg)));
      } else if (mode === 'EQUIPMENT') {
        formData.set('prixJour', String(parseInt(form.prixJour)));
        formData.set('caution', String(parseInt(form.caution)));
      }

      if (photo) formData.append('photo', photo);

      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      router.push('/tableau-bord');
    } catch (err: any) {
      setErreur(err.response?.data?.error || t('common.error'));
    } finally {
      setChargement(false);
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col">
        <Header titre={t('publish.title')} retour="/tableau-bord" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="text-center animate-fade-up">
            <h1 className="text-2xl font-black text-foreground mb-2">{t('publish.select_mode')}</h1>
            <p className="text-muted-fg text-sm">{t('publish.title')}</p>
          </div>

          <div className="w-full max-w-sm grid grid-cols-1 gap-4 animate-fade-up delay-100">
            <button
              onClick={() => setMode('HARVEST')}
              className="flex items-center gap-5 p-6 rounded-3xl bg-white border-2 border-transparent hover:border-primary-500 hover:shadow-xl transition-all group active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl group-hover:bg-primary-500 group-hover:scale-110 transition-all duration-300">🌾</div>
              <div className="text-left">
                <span className="block font-black text-lg text-foreground">{t('publish.mode_harvest')}</span>
                <span className="text-xs text-muted-fg">Mil, maïs, mangues...</span>
              </div>
              <ChevronRight className="ml-auto text-muted-fg/30 group-hover:text-primary-500 transition-colors" />
            </button>

            <button
              onClick={() => setMode('LIVESTOCK')}
              className="flex items-center gap-5 p-6 rounded-3xl bg-white border-2 border-transparent hover:border-rose-500 hover:shadow-xl transition-all group active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-3xl group-hover:bg-rose-500 group-hover:scale-110 transition-all duration-300">🐑</div>
              <div className="text-left">
                <span className="block font-black text-lg text-foreground">{t('publish.mode_livestock')}</span>
                <span className="text-xs text-muted-fg">Moutons, bœufs, chèvres...</span>
              </div>
              <ChevronRight className="ml-auto text-muted-fg/30 group-hover:text-rose-500 transition-colors" />
            </button>

            <button
              onClick={() => setMode('EQUIPMENT')}
              className="flex items-center gap-5 p-6 rounded-3xl bg-white border-2 border-transparent hover:border-amber-500 hover:shadow-xl transition-all group active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl group-hover:bg-amber-500 group-hover:scale-110 transition-all duration-300">🚜</div>
              <div className="text-left">
                <span className="block font-black text-lg text-foreground">{t('publish.mode_equipment')}</span>
                <span className="text-xs text-muted-fg">Tracteurs, pompes...</span>
              </div>
              <ChevronRight className="ml-auto text-muted-fg/30 group-hover:text-amber-500 transition-colors" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentTypes = mode === 'HARVEST' ? HARVEST_TYPES : mode === 'LIVESTOCK' ? ANIMAL_TYPES : EQUIPMENT_TYPES;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.05] h-16 flex items-center px-4 justify-between">
        <button 
          onClick={() => {
            if (initialMode) {
              router.back();
            } else {
              setMode(null);
            }
          }} 
          className="p-2 -ml-2 hover:bg-surface-3 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-black text-sm uppercase tracking-widest">{t(`publish.mode_${mode.toLowerCase()}` as any)}</h1>
        <LanguageSwitcher />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── SECTION 1 : TYPE ── */}
          <section className="animate-fade-up">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">{t('publish.step_1')}</h2>
                <p className="text-muted-fg text-sm">{t(mode === 'HARVEST' ? 'publish.select_product' : mode === 'LIVESTOCK' ? 'publish.select_animal' : 'publish.select_equipment')}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {currentTypes.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: p.value }))}
                  className={`
                    flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all duration-200
                    ${form.type === p.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-white bg-white text-muted-fg hover:border-primary-100 hover:text-foreground'
                    }
                  `}
                >
                  <span className="text-3xl drop-shadow-sm">{p.emoji}</span>
                  <span className="text-[10px] font-black uppercase text-center leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── SECTION 2 : ORIGINE ── */}
          <section className="animate-fade-up" style={{animationDelay: '100ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{t('publish.step_2')}</h2>
            </div>
            
            <div className="card-glass p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">{t('auth.region')}</label>
                  <select
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                    className="w-full bg-surface-3/50 border-none rounded-xl px-4 py-3.5 text-sm font-black focus:ring-2 ring-primary-500/20"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-fg">{t('auth.commune')}</label>
                  <input
                    type="text"
                    value={form.commune}
                    onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                    className="w-full bg-surface-3/50 border-none rounded-xl px-4 py-3.5 text-sm font-black focus:ring-2 ring-primary-500/20"
                    placeholder="Niono"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={geolocating}
                className={`w-full h-14 flex items-center justify-center gap-3 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest
                  ${form.latitude 
                    ? 'bg-emerald-50 border-emerald-500/30 text-emerald-700' 
                    : 'bg-white border-dashed border-border text-muted-fg hover:border-primary-500 hover:text-primary-600'
                  }
                `}
              >
                {geolocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                {form.latitude ? t('publish.gps_ok') : t('publish.gps_add')}
              </button>
            </div>
          </section>

          {/* ── SECTION 3 : PRIX & QUANTITÉ ── */}
          <section className="animate-fade-up" style={{animationDelay: '200ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{t('publish.step_3')}</h2>
            </div>

            <div className="card-glass p-6 space-y-6">
              
              {/* Champs dynamiques selon Mode */}
              {mode === 'HARVEST' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-fg">{t('publish.quantity_kg')}</label>
                    <input
                      type="number"
                      value={form.quantiteKg}
                      onChange={e => setForm(f => ({ ...f, quantiteKg: e.target.value }))}
                      className="w-full bg-surface-3/50 border-none rounded-2xl px-5 py-4 text-2xl font-black text-primary-700 focus:ring-2 ring-primary-500/20"
                      placeholder="500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase text-muted-fg">{t('publish.price_kg')}</label>
                      {prixMarche && (
                         <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase border border-amber-200 cursor-help group relative">
                            <Info size={10} />
                            {prixMarche} F
                         </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={form.prixFcfa}
                      onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                      className="w-full bg-surface-3/50 border-none rounded-2xl px-5 py-4 text-2xl font-black text-primary-700 focus:ring-2 ring-primary-500/20"
                      placeholder="350"
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'LIVESTOCK' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-fg">{t('publish.price_head')}</label>
                    <input
                      type="number"
                      value={form.prixFcfa}
                      onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                      className="w-full bg-surface-3/50 border-none rounded-2xl px-5 py-5 text-3xl font-black text-rose-700 focus:ring-2 ring-rose-500/20"
                      placeholder="75 000"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-fg">{t('publish.age')}</label>
                      <input
                        type="number"
                        value={form.age}
                        onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                        className="w-full bg-surface-3/50 border-none rounded-xl px-4 py-3.5 text-sm font-black"
                        placeholder="24"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-fg">{t('publish.weight')}</label>
                      <input
                        type="number"
                        value={form.poidsKg}
                        onChange={e => setForm(f => ({ ...f, poidsKg: e.target.value }))}
                        className="w-full bg-surface-3/50 border-none rounded-xl px-4 py-3.5 text-sm font-black"
                        placeholder="120"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-fg">{t('publish.race')}</label>
                    <input
                      type="text"
                      value={form.race}
                      onChange={e => setForm(f => ({ ...f, race: e.target.value }))}
                      className="w-full bg-surface-3/50 border-none rounded-xl px-4 py-3.5 text-sm font-black"
                      placeholder="Ex: Zébu Peul"
                    />
                  </div>
                </div>
              )}

              {mode === 'EQUIPMENT' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-fg">{t('publish.price_day')}</label>
                      <input
                        type="number"
                        value={form.prixJour}
                        onChange={e => setForm(f => ({ ...f, prixJour: e.target.value }))}
                        className="w-full bg-surface-3/50 border-none rounded-2xl px-5 py-5 text-3xl font-black text-amber-700 focus:ring-2 ring-amber-500/20"
                        placeholder="15 000"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-fg">{t('publish.caution')}</label>
                      <input
                        type="number"
                        value={form.caution}
                        onChange={e => setForm(f => ({ ...f, caution: e.target.value }))}
                        className="w-full bg-surface-3/50 border-none rounded-2xl px-5 py-5 text-3xl font-black text-amber-900 focus:ring-2 ring-amber-500/20"
                        placeholder="50 000"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── SECTION 4 : PHOTO & DESCRIPTION ── */}
          <section className="animate-fade-up" style={{animationDelay: '300ms'}}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{t('publish.step_4')}</h2>
            </div>

            <div className="space-y-6">
              <label className="block cursor-pointer group">
                {photoPreview ? (
                  <div className="relative rounded-3xl overflow-hidden aspect-video border-4 border-white shadow-2xl group-hover:scale-[1.02] transition-transform">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={40} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-12 rounded-3xl border-2 border-dashed border-border bg-white flex flex-col items-center justify-center gap-3 hover:bg-primary-50/50 hover:border-primary-500/40 transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                      <Camera size={32} />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest text-muted-fg group-hover:text-primary-600">Ajouter une photo</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>

              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder={t('publish.placeholder_desc')}
                className="w-full bg-white rounded-3xl p-6 text-sm font-medium border-none shadow-sm focus:ring-2 ring-primary-500/10 placeholder:text-muted-fg/40"
              />
            </div>
          </section>

          {erreur && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 text-rose-700 text-sm font-black uppercase tracking-wide animate-in shake-in">
              <AlertCircle size={18} />
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className={`w-full h-18 rounded-[28px] text-white font-black text-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 ${
              mode === 'HARVEST' ? 'bg-primary-700 shadow-primary-500/20' : mode === 'LIVESTOCK' ? 'bg-rose-700 shadow-rose-500/20' : 'bg-amber-700 shadow-amber-500/20'
            }`}
          >
            {chargement ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Check size={24} strokeWidth={3} />
                {t('publish.submit')}
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}

export default function PageVendre() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    }>
      <VendreContent />
    </Suspense>
  );
}
