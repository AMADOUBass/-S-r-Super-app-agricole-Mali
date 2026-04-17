'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

function Logo() {
  return <Image src="/images/logo-soro.png" alt="Sɔrɔ" width={38} height={38} className="object-contain drop-shadow-sm" priority />;
}

export default function PageVerification() {
  const { t } = useTranslation();
  const router = useRouter();
  const { telephone, setUtilisateur, setToken } = useStore(s => ({
    telephone: s.telephone,
    setUtilisateur: s.setUtilisateur,
    setToken: s.setToken,
  }));

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState('');
  const [renvoye, setRenvoye] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setTimeout(() => refs.current[0]?.focus(), 300);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setErreur('');
    if (value && index < 5) refs.current[index + 1]?.focus();
    if (index === 5 && value) {
      const code = [...next.slice(0, 5), value].join('');
      if (code.length === 6) verifier(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      const arr = text.split('');
      setDigits(arr);
      refs.current[5]?.focus();
      verifier(text);
    }
  };

  const verifier = async (code: string) => {
    setChargement(true);
    setErreur('');
    try {
      const res = await api.post('/auth/verify', { telephone, code });
      const { token, utilisateur } = res.data.data;
      setSucces(true);
      setToken(token);
      setUtilisateur(utilisateur);
      setTimeout(() => {
        router.push(utilisateur.role === 'AGRICULTEUR' ? '/mon-espace' : '/');
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || t('common.error'));
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 100);
    } finally {
      setChargement(false);
    }
  };

  const renvoyer = async () => {
    await api.post('/auth/resend', { telephone });
    setRenvoye(true);
    setCountdown(30);
    setTimeout(() => setRenvoye(false), 30000);
  };

  const codeComplet = digits.join('').length === 6;

  return (
    <div className="min-h-screen flex flex-col bg-surface-2 selection:bg-primary-100">
      {/* Background immersif */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary-100/40 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-6 h-16 bg-white/40 backdrop-blur-xl border-b border-white/20">
        <Link href="/inscription" className="flex items-center gap-2 text-primary-600 text-xs font-black uppercase tracking-widest hover:text-primary-700 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('auth.back')}
        </Link>
        <div className="flex items-center gap-4">
          <Logo />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="card-glass p-8 md:p-10 shadow-2xl shadow-black/5 flex flex-col items-center text-center">
            
            {/* L'icône de statut animée */}
            <div className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center transition-all duration-700 ${
              succes ? 'bg-primary-600 shadow-2xl shadow-primary-500/40' : 'bg-primary-50/50 border-2 border-primary-100'
            }`}>
              {succes ? (
                <CheckCircle2 size={48} className="text-white animate-in zoom-in-50 duration-500" />
              ) : chargement ? (
                <Loader2 size={40} className="text-primary-600 animate-spin" />
              ) : (
                <div className="relative">
                  <MessageCircle size={40} className="text-primary-600" />
                  <div className="absolute -top-1 -right-1 flex h-4 w-4">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                    <div className="relative inline-flex rounded-full h-4 w-4 bg-primary-500 border-2 border-white" />
                  </div>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">
              {succes ? t('auth.verify_success') : t('auth.verify_title')}
            </h1>

            {!succes && (
              <div className="mb-10">
                <p className="text-muted-fg font-medium text-sm leading-relaxed max-w-[280px]">
                  {t('auth.verify_sent')} 
                  <span className="block text-foreground font-black mt-1 text-lg tracking-wider">
                    {telephone}
                  </span>
                </p>
              </div>
            )}

            {!succes && (
              <div className="w-full space-y-8">
                {/* Grille OTP Premium */}
                <div className="flex gap-2.5 justify-center relative" onPaste={handlePaste}>
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { refs.current[i] = el; }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className={`w-12 md:w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all duration-300 ${
                        erreur
                          ? 'border-rose-400 bg-rose-50/50 text-rose-700 animate-in shake-in'
                          : digit
                            ? 'border-primary-500 bg-primary-50/30 text-primary-700 shadow-lg shadow-primary-500/10 scale-105'
                            : 'border-white bg-white/50 focus:border-primary-400 focus:bg-white focus:shadow-xl'
                      }`}
                    />
                  ))}
                </div>

                {erreur && (
                  <div className="flex items-center justify-center gap-2 text-rose-600 text-xs font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                    <AlertCircle size={16} />
                    {erreur}
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <button
                    onClick={renvoyer}
                    disabled={renvoye}
                    className="w-full text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-40 text-primary-600 hover:text-primary-700 active:scale-95"
                  >
                    {renvoye
                      ? `${t('auth.resend_sent')} ${countdown}s`
                      : t('auth.resend_code')}
                  </button>

                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-black/[0.04]" />
                    <span className="text-[10px] font-black text-muted-fg/30 uppercase tracking-[0.3em]">Ou</span>
                    <div className="flex-1 h-px bg-black/[0.04]" />
                  </div>

                  <a
                    href={`https://wa.me/223...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-[22px] bg-[#25D366] text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-[#20bd5c] active:scale-[0.98] transition-all group"
                  >
                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .081 5.391.079 11.99c0 2.112.553 4.177 1.601 6.035L0 24l6.142-1.611a11.82 11.82 0 005.908 1.569h.005c6.604 0 11.967-5.391 11.97-11.99a11.85 11.85 0 00-3.476-8.473" />
                      </svg>
                    </div>
                    {t('auth.whatsapp_help')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
