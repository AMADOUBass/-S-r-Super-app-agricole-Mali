'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wheat, Wrench, PawPrint, LayoutDashboard, UserCircle, ShieldCheck, LogIn } from 'lucide-react';
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
    icon: (active) => <Home size={22} strokeWidth={active ? 2.5 : 1.75} fill={active ? 'currentColor' : 'none'} />,
  },
  {
    href: '/produits',
    label: 'Récoltes',
    icon: (active) => <Wheat size={22} strokeWidth={active ? 2.5 : 1.75} />,
  },
  {
    href: '/materiel',
    label: 'Matériel',
    icon: (active) => <Wrench size={22} strokeWidth={active ? 2.5 : 1.75} />,
  },
  {
    href: '/elevage',
    label: 'Élevage',
    icon: (active) => <PawPrint size={22} strokeWidth={active ? 2.5 : 1.75} fill={active ? 'currentColor' : 'none'} />,
  },
];

const ongletAgriculteur: Onglet = {
  href: '/tableau-bord',
  label: 'Tableau',
  icon: (active) => <LayoutDashboard size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletAcheteur: Onglet = {
  href: '/mon-espace',
  label: 'Mon espace',
  icon: (active) => <UserCircle size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletAdmin: Onglet = {
  href: '/admin',
  label: 'Admin',
  icon: (active) => <ShieldCheck size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletConnexion: Onglet = {
  href: '/connexion',
  label: 'Connexion',
  icon: (active) => <LogIn size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

export function BottomNav() {
  const pathname = usePathname();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const { data: commandes } = useCommandesVendeur(utilisateur?.role === 'AGRICULTEUR');

  const nbEnAttente = token && utilisateur?.role === 'AGRICULTEUR'
    ? ((commandes as Array<{ statut: string }> | undefined)
        ?.filter(c => c.statut === 'EN_ATTENTE').length ?? 0)
    : 0;

  let dernierOnglet: Onglet;
  if (!utilisateur) {
    dernierOnglet = ongletConnexion;
  } else if (utilisateur.role === 'ADMIN') {
    dernierOnglet = ongletAdmin;
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
                {active && (
                  <span className="absolute inset-x-2 inset-y-1.5 bg-primary-50 rounded-xl" />
                )}

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

                <span className={`relative z-10 text-[10px] font-semibold leading-none ${active ? 'text-primary-700' : ''}`}>
                  {label}
                </span>

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
