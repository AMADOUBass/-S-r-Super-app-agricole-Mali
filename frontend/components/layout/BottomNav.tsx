'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useStore from '@/store/useStore';

type Onglet = {
  href: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
};

const ongletsPrincipaux: Onglet[] = [
  {
    href: '/',
    label: 'Accueil',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/produits',
    label: 'Récoltes',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12M12 12C12 7 7 4 2 6M12 12C12 7 17 4 22 6"/>
        <path d="M2 6c2 6 5 9 10 10M22 6c-2 6-5 9-10 10"/>
      </svg>
    ),
  },
  {
    href: '/materiel',
    label: 'Matériel',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/marche',
    label: 'Prix',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

// 5e onglet dynamique selon rôle
const ongletAgriculteur: Onglet = {
  href: '/tableau-bord',
  label: 'Mon espace',
  icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
};

const ongletAcheteur: Onglet = {
  href: '/elevage',
  label: 'Élevage',
  icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
};

const ongletConnexion: Onglet = {
  href: '/connexion',
  label: 'Connexion',
  icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();
  const utilisateur = useStore(s => s.utilisateur);

  // 5e onglet selon l'état
  let dernierOnglet: Onglet;
  if (!utilisateur) {
    dernierOnglet = ongletConnexion;
  } else if (utilisateur.role === 'AGRICULTEUR') {
    dernierOnglet = ongletAgriculteur;
  } else {
    dernierOnglet = ongletAcheteur;
  }

  const onglets = [...ongletsPrincipaux, dernierOnglet];

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-2xl shadow-nav overflow-hidden">
        <div className="flex h-[60px]">
          {onglets.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 tap-highlight-none transition-all duration-200 ${
                  active ? 'text-primary-700' : 'text-muted hover:text-foreground-3'
                }`}
              >
                {active && (
                  <span className="absolute inset-x-1.5 inset-y-1.5 bg-primary-50 rounded-xl animate-scale-in" />
                )}
                <span className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {icon(active)}
                </span>
                <span className={`relative z-10 text-[10px] font-semibold ${active ? 'text-primary-700' : ''}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
