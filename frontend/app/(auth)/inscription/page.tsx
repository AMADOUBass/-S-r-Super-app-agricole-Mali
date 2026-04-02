'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL',
];

const ROLES = [
  { value: 'AGRICULTEUR', label: 'Agriculteur', emoji: '🌱', desc: 'Je vends mes récoltes', color: 'from-primary-600 to-emerald-600' },
  { value: 'ACHETEUR', label: 'Acheteur', emoji: '🛒', desc: 'Je cherche des produits', color: 'from-blue-500 to-blue-700' },
  { value: 'BOUTIQUE', label: 'Boutique / Pro', emoji: '🏪', desc: 'Approvisionnement régulier', color: 'from-amber-500 to-orange-600' },
];

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="#15803d"/>
      <path d="M21 10.5 Q21 8 17.5 8 Q13 8 13 11.5 Q13 15 17.5 15.5 Q22 16 22 20 Q22 24.5 17.5 24.5 Q13 24.5 11 22.5"
        stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 10.5 Q24 8.5 25 10 Q24 11.5 21 10.5Z" fill="#4ade80"/>
    </svg>
  );
}

export default function PageInscription() {
  const router = useRouter();
  const setTelephone = useStore(s => s.setTelephone);

  const [form, setForm] = useState({ telephone: '+223', nom: '', role: 'AGRICULTEUR', commune: '', region: 'BAMAKO' });
  const [step, setStep] = useState<1 | 2>(1);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    try {
      await api.post('/auth/register', form);
      setTelephone(form.telephone);
      router.push('/verification');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setChargement(false);
    }
  };

  const roleActif = ROLES.find(r => r.value === form.role);

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">

      {/* Background décoratif */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 h-14 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-black text-lg text-foreground">Sɔrɔ</span>
        </Link>
        <span className="text-xs font-semibold text-muted-fg bg-surface-3 px-3 py-1.5 rounded-full">
          Étape {step} / 2
        </span>
      </div>

      <div className="relative z-10 flex-1 flex items-start justify-center px-4 py-6 md:py-12">
        <div className="w-full max-w-md">

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-8">
            <div className="flex-1 h-1 rounded-full bg-primary-600 transition-all duration-500" />
            <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary-600' : 'bg-border'}`} />
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>

            {/* ── Étape 1 : Rôle ── */}
            {step === 1 && (
              <div className="animate-slide-up space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-foreground">Créer mon compte</h1>
                  <p className="text-muted-fg text-sm mt-1.5">Inscription 100% gratuite · aucun email requis</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-3">Je suis…</label>
                  <div className="space-y-2.5">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                          form.role === r.value
                            ? 'border-primary-500 bg-primary-50 shadow-sm'
                            : 'border-border bg-white hover:border-border-strong hover:shadow-sm'
                        }`}
                      >
                        {/* Emoji dans un cercle coloré si actif */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200 ${
                          form.role === r.value
                            ? `bg-gradient-to-br ${r.color} shadow-sm`
                            : 'bg-surface-3'
                        }`}>
                          {r.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm transition-colors ${form.role === r.value ? 'text-primary-700' : 'text-foreground'}`}>
                            {r.label}
                          </div>
                          <div className="text-xs text-muted-fg mt-0.5">{r.desc}</div>
                        </div>
                        {/* Check */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          form.role === r.value ? 'border-primary-600 bg-primary-600' : 'border-border'
                        }`}>
                          {form.role === r.value && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full btn-lg">
                  Continuer
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>

                <p className="text-center text-xs text-muted-fg">
                  Déjà inscrit ?{' '}
                  <Link href="/connexion" className="text-primary-600 font-semibold hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            )}

            {/* ── Étape 2 : Infos ── */}
            {step === 2 && (
              <div className="animate-slide-up space-y-5">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-muted-fg text-sm mb-5 hover:text-foreground transition-colors group"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
                      <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                    Retour
                  </button>

                  {/* Rôle sélectionné — badge récapitulatif */}
                  {roleActif && (
                    <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5 mb-4">
                      <span>{roleActif.emoji}</span>
                      <span className="text-xs font-semibold text-primary-700">{roleActif.label}</span>
                    </div>
                  )}

                  <h1 className="text-2xl font-black text-foreground">Vos informations</h1>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Mamadou Coulibaly"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="+22360000000"
                    className="input font-mono"
                    required
                  />
                  <p className="text-xs text-muted-fg mt-1.5 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Format : +223 suivi de 8 chiffres
                  </p>
                </div>

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
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                      Envoi du code…
                    </>
                  ) : (
                    <>
                      Recevoir mon code SMS
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
