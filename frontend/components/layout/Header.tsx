'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ArrowRight, LayoutDashboard, User, ShieldCheck, Plus, LogOut } from 'lucide-react';
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
    <Image
      src="/images/logo-soro.png"
      alt="Sɔrɔ"
      width={36}
      height={36}
      className="object-contain"
      priority
    />
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
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="transition-transform group-hover:scale-105 duration-200"><Logo /></div>
              <span className="font-black text-lg text-foreground tracking-tight hidden sm:inline">Sɔrɔ</span>
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
                <ChevronDown size={14} strokeWidth={2.5} className={`text-muted-fg transition-transform duration-200 ${menuOuvert ? 'rotate-180' : ''}`} />
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
                        <LayoutDashboard size={15} strokeWidth={2} />
                        Mon espace
                      </Link>
                    )}

                    {utilisateur?.role !== 'ADMIN' && (
                      <Link href="/mon-profil" onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-2 hover:bg-surface-2 transition-colors">
                        <User size={15} strokeWidth={2} />
                        Mon profil
                      </Link>
                    )}

                    {utilisateur?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-semibold">
                        <ShieldCheck size={15} strokeWidth={2} />
                        Administration
                      </Link>
                    )}

                    {utilisateur.role === 'AGRICULTEUR' && (
                      <Link href="/vendre" onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-2 hover:bg-surface-2 transition-colors">
                        <Plus size={15} strokeWidth={2} />
                        Publier une annonce
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-border/50 py-1.5">
                    <button onClick={handleDeconnecter}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} strokeWidth={2} />
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
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
