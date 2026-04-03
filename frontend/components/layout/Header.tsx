'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import useStore from '@/store/useStore';

interface HeaderProps {
  titre?: string;
  retour?: string;
}

const navLinks = [
  { href: '/produits', label: 'Récoltes' },
  { href: '/materiel', label: 'Matériel' },
  { href: '/elevage', label: 'Élevage' },
  { href: '/marche', label: 'Prix marché' },
  { href: '/meteo', label: 'Météo' },
];

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#15803d"/>
      <path d="M21 10.5 Q21 8 17.5 8 Q13 8 13 11.5 Q13 15 17.5 15.5 Q22 16 22 20 Q22 24.5 17.5 24.5 Q13 24.5 11 22.5"
        stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 10.5 Q24 8.5 25 10 Q24 11.5 21 10.5Z" fill="#4ade80"/>
    </svg>
  );
}

export function Header({ titre, retour }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { utilisateur, deconnecter } = useStore(s => ({ utilisateur: s.utilisateur, deconnecter: s.deconnecter }));
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ferme le menu si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDeconnecter = () => {
    deconnecter();
    setMenuOuvert(false);
    router.push('/');
  };

  const lienTableau = utilisateur?.role === 'AGRICULTEUR' ? '/tableau-bord' :
    utilisateur?.role === 'ADMIN' ? '/admin' : '/mon-espace';

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-black/[0.06] shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">

        {/* Gauche */}
        <div className="flex items-center gap-3">
          {retour ? (
            <button
              onClick={() => router.push(retour)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-3 active:scale-95 transition-all text-foreground-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="transition-transform group-hover:scale-105 duration-200"><Logo /></div>
              <span className="font-black text-lg text-foreground tracking-tight">Sɔrɔ</span>
            </Link>
          )}

          {titre && <h1 className="font-semibold text-base text-foreground">{titre}</h1>}

          {/* Nav desktop */}
          {!retour && !titre && (
            <nav className="hidden md:flex items-center gap-0.5 ml-3">
              {navLinks.map(link => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href}
                    className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active ? 'text-primary-700 bg-primary-50' : 'text-muted-fg hover:text-foreground hover:bg-surface-3'
                    }`}
                  >
                    {active && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600" />}
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Droite */}
        <div className="flex items-center gap-2">
          {utilisateur ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOuvert(o => !o)}
                className="flex items-center gap-2.5 bg-surface-2 hover:bg-surface-3 border border-border/60 rounded-full pl-1.5 pr-3 py-1.5 transition-all duration-200 hover:shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-xs font-bold">{utilisateur.nom.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-semibold text-foreground-2 hidden sm:inline">
                  {utilisateur.nom.split(' ')[0]}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`text-muted-fg transition-transform duration-200 ${menuOuvert ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOuvert && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-float border border-border/40 overflow-hidden animate-scale-in z-50">
                  {/* Infos utilisateur */}
                  <div className="px-4 py-3 border-b border-border/50 bg-surface-2">
                    <p className="text-xs font-semibold text-foreground truncate">{utilisateur.nom}</p>
                    <p className="text-xs text-muted-fg">{utilisateur.telephone}</p>
                    <span className="inline-flex items-center mt-1.5 text-[10px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                      {utilisateur.role}
                    </span>
                  </div>

                  <div className="py-1.5">
                    {utilisateur?.role !== 'ADMIN' && (
                      <Link href={lienTableau} onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-2 hover:bg-surface-2 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        Mon espace
                      </Link>
                    )}

                    {utilisateur?.role !== 'ADMIN' && (
                      <Link href="/mon-profil" onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-2 hover:bg-surface-2 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        Mon profil
                      </Link>
                    )}

                    {utilisateur?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-semibold">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Administration
                      </Link>
                    )}

                    {utilisateur.role === 'AGRICULTEUR' && (
                      <Link href="/vendre" onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-2 hover:bg-surface-2 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Publier une annonce
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-border/50 py-1.5">
                    <button onClick={handleDeconnecter}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/connexion"
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-foreground-3 hover:text-foreground px-3 py-2 rounded-xl hover:bg-surface-3 transition-all">
                Connexion
              </Link>
              <Link href="/inscription"
                className="inline-flex items-center gap-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-95">
                S'inscrire
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
