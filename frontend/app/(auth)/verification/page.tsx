'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

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

export default function PageVerification() {
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

  // Focus le premier input au montage
  useEffect(() => {
    setTimeout(() => refs.current[0]?.focus(), 300);
  }, []);

  // Countdown renvoi
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
        router.push(utilisateur.role === 'AGRICULTEUR' ? '/tableau-bord' : '/');
      }, 800);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Code incorrect. Réessayez.');
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
    <div className="min-h-screen flex flex-col bg-surface-2">

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 h-14 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <Link href="/inscription" className="flex items-center gap-2 text-muted-fg hover:text-foreground transition-colors group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span className="text-sm font-medium">Retour</span>
        </Link>
        <Logo />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">

          {/* Icône SMS */}
          <div className="flex justify-center mb-6">
            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
              succes ? 'bg-primary-600' : 'bg-primary-50 border border-primary-200'
            }`}>
              {succes ? (
                <svg className="animate-bounce-in" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.5 1.23 2 2 0 012.48.01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              )}
              {/* Ping décoratif */}
              {!succes && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary-500 border-2 border-white"></span>
                </span>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-black text-foreground text-center mb-2 animate-fade-up">
            {succes ? 'Connecté !' : 'Vérifiez votre numéro'}
          </h1>
          {!succes && (
            <>
              <p className="text-muted-fg text-sm text-center mb-1 animate-fade-up delay-75">
                Code à 6 chiffres envoyé au
              </p>
              <p className="text-center font-bold text-foreground mb-8 animate-fade-up delay-100">
                {telephone}
              </p>
            </>
          )}

          {/* 6 cases OTP */}
          {!succes && (
            <div className="flex gap-2 justify-center mb-6 animate-fade-up delay-150" onPaste={handlePaste}>
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
                  className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all duration-200 ${
                    erreur
                      ? 'border-red-400 bg-red-50 text-red-700 animate-bounce'
                      : digit
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-glow-green'
                        : 'border-border bg-white focus:border-primary-400 focus:bg-primary-50/50 focus:shadow-sm'
                  }`}
                />
              ))}
            </div>
          )}

          {erreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-4 animate-scale-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {erreur}
            </div>
          )}

          {!succes && (
            <button
              onClick={() => codeComplet && verifier(digits.join(''))}
              disabled={!codeComplet || chargement}
              className="btn btn-primary w-full btn-lg mb-4 animate-fade-up delay-200"
            >
              {chargement ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Vérification…
                </>
              ) : 'Confirmer le code'}
            </button>
          )}

          {!succes && (
            <button
              onClick={renvoyer}
              disabled={renvoye}
              className="w-full text-center text-sm font-medium transition-colors animate-fade-up delay-300
                         disabled:text-muted-fg disabled:cursor-not-allowed text-primary-700 hover:text-primary-800"
            >
              {renvoye
                ? `✓ Code renvoyé — encore ${countdown}s`
                : 'Renvoyer le code SMS'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
