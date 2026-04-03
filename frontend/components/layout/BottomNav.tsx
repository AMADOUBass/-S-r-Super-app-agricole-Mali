'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useStore from '@/store/useStore';
import { useCommandesVendeur } from '@/lib/queries';

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
      <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/produits',
    label: 'Récoltes',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12M12 12C12 7 7 4 2 6M12 12C12 7 17 4 22 6"/>
        <path d="M2 6c2 6 5 9 10 10M22 6c-2 6-5 9-10 10"/>
      </svg>
    ),
  },
  {
    href: '/materiel',
    label: 'Matériel',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/elevage',
    label: 'Élevage',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
];

const ongletAgriculteur: Onglet = {
  href: '/tableau-bord',
  label: 'Tableau',
  icon: (active) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
};

const ongletAcheteur: Onglet = {
  href: '/mon-espace',
  label: 'Mon espace',
  icon: (active) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const ongletConnexion: Onglet = {
  href: '/connexion',
  label: 'Connexion',
  icon: (active) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const { data: commandes } = useCommandesVendeur();

  // Badge commandes en attente — seulement si connecté en tant qu'agriculteur
  const nbEnAttente = token && utilisateur?.role === 'AGRICULTEUR'
    ? ((commandes as Array<{ statut: string }> | undefined)
        ?.filter(c => c.statut === 'EN_ATTENTE').length ?? 0)
    : 0;

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
      <div className="bg-white/96 backdrop-blur-2xl border border-black/[0.07] rounded-2xl shadow-nav overflow-hidden">
        <div className="flex h-[62px]">
          {onglets.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            const showBadge = href === '/tableau-bord' && nbEnAttente > 0;

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 tap-highlight-none transition-colors duration-150 ${
                  active ? 'text-primary-700' : 'text-muted hover:text-foreground-3'
                }`}
              >
                {/* Active pill background */}
                {active && (
                  <span className="absolute inset-x-2 inset-y-1.5 bg-primary-50 rounded-xl" />
                )}

                {/* Icon + badge */}
                <span className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {icon(active)}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50 animate-ping" />
                      <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-black border border-white">
                        {nbEnAttente > 9 ? '9+' : nbEnAttente}
                      </span>
                    </span>
                  )}
                </span>

                {/* Label */}
                <span className={`relative z-10 text-[10px] font-semibold leading-none ${active ? 'text-primary-700' : ''}`}>
                  {label}
                </span>

                {/* Active dot below label */}
                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
