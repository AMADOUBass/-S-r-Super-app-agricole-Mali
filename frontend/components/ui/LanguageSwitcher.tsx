'use client';

import { useState, useRef, useEffect } from 'react';
import useStore from '@/store/useStore';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useStore(s => ({
    locale: s.locale,
    setLocale: s.setLocale,
  }));
  const [langOuvert, setLangOuvert] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={langRef}>
      <button
        onClick={() => setLangOuvert(!langOuvert)}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 hover:bg-white/60 transition-all text-foreground active:scale-95 shadow-sm"
        aria-label="Changer de langue"
      >
        <span className="text-xs font-black tracking-tighter">{locale}</span>
      </button>

      {langOuvert && (
        <div className="absolute right-0 top-full mt-3 w-36 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-black/[0.05] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100] py-1.5">
          {(['FR', 'EN', 'BM'] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setLangOuvert(false); }}
              className={`w-full flex items-center justify-between px-5 py-3 text-xs font-black transition-all ${
                locale === l 
                  ? 'text-primary-700 bg-primary-50/80 shadow-inner' 
                  : 'text-muted-fg hover:text-foreground hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="opacity-40">{l === 'FR' ? '🇫🇷' : l === 'EN' ? '🇺🇸' : '🇲🇱'}</span>
                {l === 'FR' ? 'Français' : l === 'EN' ? 'English' : 'Bamanankan'}
              </div>
              {locale === l && <div className="w-1.5 h-1.5 rounded-full bg-primary-600 shadow-sm shadow-primary-500/40" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
