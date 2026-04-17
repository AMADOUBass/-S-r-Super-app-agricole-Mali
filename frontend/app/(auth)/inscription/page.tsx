'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { ChevronRight, ArrowLeft, Loader2, CheckCircle2, User, Phone, Mail, MapPin } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

const REGIONS = [
  'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
  'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL',
];

function Logo() {
  return <Image src="/images/logo-soro.png" alt="Sɔrô" width={38} height={38} className="object-contain drop-shadow-sm" priority />;
}

export default function PageInscription() {
  const { t } = useTranslation();
  const router = useRouter();
  const setTelephone = useStore(s => s.setTelephone);
  const setUtilisateur = useStore(s => s.setUtilisateur);
  const setToken = useStore(s => s.setToken);

  const [authType, setAuthType] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [form, setForm] = useState({ 
    telephone: '+223', 
    email: '',
    motDePasse: '',
    nom: '', 
    role: 'AGRICULTEUR', 
    commune: '', 
    region: 'BAMAKO' 
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const ROLES = [
    { value: 'AGRICULTEUR', label: t('auth.roles.AGRICULTEUR'), emoji: '🌱', desc: t('auth.roles.AGRICULTEUR_DESC'), color: 'from-emerald-500 to-primary-600' },
    { value: 'ACHETEUR', label: t('auth.roles.ACHETEUR'), emoji: '🛒', desc: t('auth.roles.ACHETEUR_DESC'), color: 'from-blue-500 to-indigo-600' },
    { value: 'BOUTIQUE', label: t('auth.roles.BOUTIQUE'), emoji: '🏪', desc: t('auth.roles.BOUTIQUE_DESC'), color: 'from-amber-400 to-orange-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');

    const normalizedForm = {
      ...form,
      telephone: form.telephone.trim().replace(/[\s\-()]/g, ''),
      email: form.email.trim().toLowerCase(),
    };

    if (authType === 'PHONE') {
      if (!normalizedForm.telephone.startsWith('+')) {
        normalizedForm.telephone = '+223' + normalizedForm.telephone;
      }
      if (normalizedForm.telephone.length < 8) {
        setErreur(t('common.error'));
        setChargement(false);
        return;
      }
    }

    try {
      if (authType === 'PHONE') {
        await api.post('/auth/register', normalizedForm);
        setTelephone(normalizedForm.telephone);
        router.push('/verification');
      } else {
        const { data } = await api.post('/auth/register-email', normalizedForm);
        setToken(data.data.token);
        setUtilisateur(data.data.utilisateur);
        router.push('/mon-espace');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.error || t('common.error');
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  const roleActif = ROLES.find(r => r.value === form.role);

  return (
    <div className="min-h-screen flex flex-col bg-surface-2 selection:bg-primary-100">
      {/* Background immersif */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-100/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-100/20 blur-[100px]" />
      </div>

      {/* Header Étapes */}
      <div className="relative z-20 flex items-center justify-between px-6 h-16 bg-white/40 backdrop-blur-xl border-b border-white/20">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-black text-xl tracking-tighter text-foreground">Sɔrô</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-3/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-black/[0.03]">
            <span className="text-[10px] font-black text-muted-fg uppercase tracking-widest">
              {t('auth.step')} {step} / 2
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-start justify-center px-4 py-8 md:py-16">
        <div className="w-full max-w-[480px]">
          {/* Progress bar Premium */}
          <div className="flex gap-2 mb-10 px-2">
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-primary-600 shadow-sm shadow-primary-500/20' : 'bg-black/[0.05]'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${step === 2 ? 'bg-primary-600 shadow-sm shadow-primary-500/20' : 'bg-black/[0.05]'}`} />
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="card-glass p-8 md:p-10 shadow-2xl shadow-black/5 animate-fade-up">
            {/* ── Étape 1 : Rôle ── */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div>
                  <h1 className="text-3xl font-black text-foreground tracking-tight">{t('auth.signup_title')}</h1>
                  <p className="text-muted-fg font-medium text-sm mt-2">{t('auth.signup_subtitle')}</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black text-muted-fg uppercase tracking-widest ml-1">{t('auth.im')}</label>
                  <div className="grid gap-3">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`group relative flex items-center gap-5 p-5 rounded-[24px] border-2 transition-all duration-300 text-left overflow-hidden ${
                          form.role === r.value
                            ? 'border-primary-500 bg-primary-50/30'
                            : 'border-transparent bg-white/50 hover:bg-white hover:border-black/[0.05]'
                        }`}
                      >
                        {form.role === r.value && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${r.color} opacity-[0.03] transition-opacity`} />
                        )}
                        
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-500 ${
                          form.role === r.value
                            ? `bg-gradient-to-br ${r.color} text-white shadow-lg rotate-0`
                            : 'bg-surface-3 text-muted-fg/40 scale-95 grayscale'
                        }`}>
                          {r.emoji}
                        </div>

                        <div className="flex-1 min-w-0 z-10">
                          <div className={`font-black text-sm transition-colors ${form.role === r.value ? 'text-primary-700' : 'text-foreground-2'}`}>
                            {r.label}
                          </div>
                          <div className="text-xs font-medium text-muted-fg/80 mt-1 line-clamp-1">{r.desc}</div>
                        </div>

                        {form.role === r.value && (
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                            <CheckCircle2 size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-[22px] shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                  <span className="text-sm uppercase tracking-widest">{t('auth.continue')}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-sm font-medium text-muted-fg">
                  {t('auth.already_registered')}{' '}
                  <Link href="/connexion" className="text-primary-600 font-black hover:text-primary-700 transition-all">
                    {t('auth.login_btn')}
                  </Link>
                </p>
              </div>
            )}

            {/* ── Étape 2 : Infos ── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-primary-600 text-xs font-black uppercase tracking-widest mb-6 hover:text-primary-700 group transition-all"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    {t('auth.back')}
                  </button>

                  <div className="flex items-center gap-4 mb-8">
                     <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleActif?.color} text-white flex items-center justify-center text-2xl shadow-lg`}>
                        {roleActif?.emoji}
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">{t('auth.full_name')}</h2>
                        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">{roleActif?.label}</p>
                     </div>
                  </div>
                  
                  <div className="flex bg-surface-3/50 backdrop-blur-md p-1.5 rounded-2xl mb-8">
                    <button
                      type="button"
                      onClick={() => setAuthType('PHONE')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl transition-all ${
                        authType === 'PHONE' ? 'bg-white shadow-md text-primary-700' : 'text-muted-fg hover:text-foreground'
                      }`}
                    >
                      <Phone size={14} />
                      {t('auth.phone')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthType('EMAIL')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl transition-all ${
                        authType === 'EMAIL' ? 'bg-white shadow-md text-primary-700' : 'text-muted-fg hover:text-foreground'
                      }`}
                    >
                      <Mail size={14} />
                      {t('auth.email_premium')}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-muted-fg uppercase tracking-[0.15em] ml-1">{t('auth.full_name')}</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg group-focus-within:text-primary-600 transition-colors" />
                      <input
                        type="text"
                        value={form.nom}
                        onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                        placeholder="Mamadou Coulibaly"
                        className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[18px] pl-11 pr-5 py-4 text-sm font-bold transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  {authType === 'PHONE' ? (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <label className="block text-[10px] font-black text-muted-fg uppercase tracking-[0.15em] ml-1">{t('auth.phone_label')}</label>
                      <input
                        type="tel"
                        value={form.telephone}
                        onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                        placeholder="+223 60 00 00 00"
                        className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[18px] px-6 py-4 text-sm font-black tracking-widest transition-all outline-none"
                        required
                      />
                      <p className="text-[9px] font-medium text-muted-fg ml-1 text-center pt-1 italic opacity-60">Format: +223 + 8 chiffres</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-muted-fg uppercase tracking-[0.15em] ml-1">{t('auth.email_label')}</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="votre@email.com"
                          className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[18px] px-6 py-4 text-sm font-bold transition-all outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-muted-fg uppercase tracking-[0.15em] ml-1">{t('auth.password_label')}</label>
                        <input
                          type="password"
                          value={form.motDePasse}
                          onChange={e => setForm(f => ({ ...f, motDePasse: e.target.value }))}
                          placeholder={t('auth.password_placeholder')}
                          className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[18px] px-6 py-4 text-sm font-bold transition-all outline-none"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-muted-fg uppercase tracking-[0.15em] ml-1">{t('auth.region')}</label>
                      <select
                        value={form.region}
                        onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                        className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[18px] px-5 py-4 text-sm font-bold transition-all outline-none appearance-none"
                      >
                        {REGIONS.map(r => (
                          <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-muted-fg uppercase tracking-[0.15em] ml-1">{t('auth.commune')}</label>
                      <div className="relative group">
                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                         <input
                           type="text"
                           value={form.commune}
                           onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                           placeholder="Niono…"
                           className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[18px] pl-11 pr-5 py-4 text-sm font-bold transition-all outline-none"
                           required
                         />
                      </div>
                    </div>
                  </div>
                </div>

                {erreur && (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3.5 text-rose-700 text-xs font-bold animate-in zoom-in-95">
                    <CheckCircle2 size={18} className="shrink-0 rotate-180" />
                    {erreur}
                  </div>
                )}

                <button type="submit" disabled={chargement} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-[22px] shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                  {chargement ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="text-sm uppercase tracking-widest">
                        {authType === 'PHONE' ? t('auth.verify_btn') : t('auth.signup_title')}
                      </span>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
