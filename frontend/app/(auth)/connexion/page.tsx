'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';

export default function PageConnexion() {
  const router = useRouter();
  const setTelephone = useStore(s => s.setTelephone);

  const [telephone, setTel] = useState('+223');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    try {
      // Tente un register (upsert) — fonctionne pour connexion ET inscription
      await api.post('/auth/register', {
        telephone,
        nom: 'Utilisateur',   // valeur par défaut si nouveau compte
        role: 'AGRICULTEUR',
        commune: 'Bamako',
        region: 'BAMAKO',
      });
      setTelephone(telephone);
      router.push('/verification');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Numéro introuvable ou erreur réseau');
    } finally {
      setChargement(false);
    }
  };

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
          <Image src="/images/logo-soro.png" alt="Sɔrɔ" width={34} height={34} className="object-contain" priority />
          <span className="font-black text-lg text-foreground">Sɔrɔ</span>
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/images/logo-soro.png" alt="Sɔrɔ" width={88} height={88} className="object-contain drop-shadow-sm" priority />
          </div>

          <h1 className="text-2xl font-black text-foreground text-center mb-1">Se connecter</h1>
          <p className="text-muted-fg text-sm text-center mb-8">
            Entrez votre numéro pour recevoir un code SMS
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Numéro de téléphone</label>
              <input
                type="tel"
                value={telephone}
                onChange={e => setTel(e.target.value)}
                placeholder="+22360000000"
                className="input font-mono text-lg text-center tracking-widest"
                required
                autoFocus
              />
              <p className="text-xs text-muted-fg mt-1.5 text-center">Format : +223 suivi de 8 chiffres</p>
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
                  Envoi du code…
                </>
              ) : (
                <>
                  Recevoir mon code SMS
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-fg">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="text-primary-700 font-bold hover:underline">
                S'inscrire gratuitement
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/admin/connexion" className="text-xs text-muted-fg/50 hover:text-muted-fg transition-colors">
              Accès administration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
