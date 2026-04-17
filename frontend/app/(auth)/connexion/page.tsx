'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { Phone, Mail, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function PageConnexion() {
  const { t } = useTranslation();
  const router = useRouter();
  const setTelephone = useStore(s => s.setTelephone);
  const setUtilisateur = useStore(s => s.setUtilisateur);
  const setToken = useStore(s => s.setToken);

  const [mode, setMode] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [telephone, setTel] = useState('+223');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    try {
      if (mode === 'PHONE') {
        let normalizedPhone = telephone.trim().replace(/[\s\-()]/g, '');
        if (!normalizedPhone.startsWith('+')) {
          normalizedPhone = '+223' + normalizedPhone;
        }

        await api.post('/auth/register', {
          telephone: normalizedPhone,
          nom: 'Utilisateur',
          role: 'AGRICULTEUR',
          commune: 'Bamako',
          region: 'BAMAKO',
        });
        setTelephone(normalizedPhone);
        router.push('/verification');
      } else {
        const { data } = await api.post('/auth/login-email', { 
          email: email.trim().toLowerCase(), 
          motDePasse 
        });
        setToken(data.data.token);
        setUtilisateur(data.data.utilisateur);
        router.push('/mon-espace');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.error || t('common.error');
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-2 selection:bg-primary-100">
      {/* Background immersif */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-100/40 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[100px]" />
      </div>

      {/* Header Minimaliste */}
      <div className="relative z-20 flex items-center justify-between px-6 h-16 bg-white/40 backdrop-blur-xl border-b border-white/20">
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform">
          <Image src="/images/logo-soro.png" alt="Sɔrɔ" width={38} height={38} className="object-contain drop-shadow-sm" priority />
          <span className="font-black text-xl tracking-tighter text-foreground">Sɔrɔ</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="card-glass p-8 md:p-10 border-2 border-white/40 shadow-2xl shadow-black/5">
            {/* Titre & Sous-titre */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                {t('auth.login_title')}
              </h1>
              <p className="text-muted-fg font-medium text-sm">
                {t('auth.login_subtitle')}
              </p>
            </div>
            
            {/* Sélecteur de mode Premium */}
            <div className="flex bg-surface-3/50 backdrop-blur-md p-1.5 rounded-2xl mb-8">
              <button
                onClick={() => setMode('PHONE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
                  mode === 'PHONE' 
                    ? 'bg-white shadow-lg shadow-black/5 text-primary-700 translate-y-[-1px]' 
                    : 'text-muted-fg hover:text-foreground'
                }`}
              >
                <Phone size={14} strokeWidth={2.5} />
                {t('auth.phone')}
              </button>
              <button
                onClick={() => setMode('EMAIL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
                  mode === 'EMAIL' 
                    ? 'bg-white shadow-lg shadow-black/5 text-primary-700 translate-y-[-1px]' 
                    : 'text-muted-fg hover:text-foreground'
                }`}
              >
                <Mail size={14} strokeWidth={2.5} />
                {t('auth.email_premium')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'PHONE' ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <label className="block text-xs font-black text-muted-fg uppercase tracking-widest ml-1">
                    {t('auth.phone_label')}
                  </label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={e => setTel(e.target.value)}
                    placeholder="+223 60 00 00 00"
                    className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[20px] px-6 py-4 text-xl font-black text-center tracking-widest transition-all outline-none shadow-sm"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] font-black text-primary-600/60 uppercase tracking-tighter text-center pt-1">
                    {t('auth.phone_helper')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-muted-fg uppercase tracking-widest ml-1">
                      {t('auth.email_label')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="mamadou@gmail.com"
                      className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[20px] px-6 py-4 text-sm font-bold transition-all outline-none shadow-sm"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-muted-fg uppercase tracking-widest ml-1">
                      {t('auth.password_label')}
                    </label>
                    <input
                      type="password"
                      value={motDePasse}
                      onChange={e => setMotDePasse(e.target.value)}
                      placeholder={t('auth.password_placeholder')}
                      className="w-full bg-white/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white rounded-[20px] px-6 py-4 text-sm font-bold transition-all outline-none shadow-sm"
                      required
                    />
                  </div>
                </div>
              )}

              {erreur && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3.5 text-rose-700 text-xs font-bold animate-in zoom-in-95">
                  <AlertCircle size={18} className="shrink-0" />
                  {erreur}
                </div>
              )}

              <button 
                type="submit" 
                disabled={chargement} 
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-[22px] shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {chargement ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-sm uppercase tracking-widest">
                      {mode === 'PHONE' ? t('auth.verify_btn') : t('auth.login_btn')}
                    </span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-sm font-medium text-muted-fg">
                {t('auth.no_account')}{' '}
                <Link href="/inscription" className="text-primary-600 font-black hover:text-primary-700 hover:underline underline-offset-4 transition-all">
                  {t('auth.register_free')}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/admin/connexion" className="text-[10px] font-black uppercase tracking-widest text-muted-fg/40 hover:text-primary-600 transition-colors">
              Gestion de la plateforme
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
