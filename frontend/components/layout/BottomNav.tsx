'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wheat, Wrench, PawPrint, LayoutDashboard, UserCircle, ShieldCheck, LogIn, MessageSquare } from 'lucide-react';
import useStore from '@/store/useStore';
import { useCommandesVendeur, useConversations } from '@/lib/queries';
import { useTranslation } from '@/lib/i18n';

type Onglet = {
  href: string;
  labelKey: string;
  icon: (active: boolean) => React.ReactNode;
};

const ongletsPrincipaux: Onglet[] = [
  {
    href: '/',
    labelKey: 'nav.home',
    icon: (active) => <Home size={22} strokeWidth={active ? 2.5 : 1.75} fill={active ? 'currentColor' : 'none'} />,
  },
  {
    href: '/produits',
    labelKey: 'nav.harvest',
    icon: (active) => <Wheat size={22} strokeWidth={active ? 2.5 : 1.75} />,
  },
  {
    href: '/materiel',
    labelKey: 'nav.equipment',
    icon: (active) => <Wrench size={22} strokeWidth={active ? 2.5 : 1.75} />,
  },
  {
    href: '/elevage',
    labelKey: 'nav.livestock',
    icon: (active) => <PawPrint size={22} strokeWidth={active ? 2.5 : 1.75} fill={active ? 'currentColor' : 'none'} />,
  },
];

const ongletAgriculteur = {
  href: '/tableau-bord',
  labelKey: 'nav.dashboard',
  icon: (active: boolean) => <LayoutDashboard size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletAcheteur = {
  href: '/mon-espace',
  labelKey: 'nav.profile',
  icon: (active: boolean) => <UserCircle size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletAdmin = {
  href: '/admin',
  labelKey: 'nav.dashboard', // Admin often sees dashboard
  icon: (active: boolean) => <ShieldCheck size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletConnexion = {
  href: '/connexion',
  labelKey: 'nav.login',
  icon: (active: boolean) => <LogIn size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

const ongletMessages = {
  href: '/messages',
  labelKey: 'nav.messages',
  icon: (active: boolean) => <MessageSquare size={22} strokeWidth={active ? 2.5 : 1.75} />,
};

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const { data: commandes } = useCommandesVendeur(utilisateur?.role === 'AGRICULTEUR');
  const { data: conversations } = useConversations();

  const nbMessagesNonLus = token && Array.isArray(conversations)
    ? conversations.filter((c: any) => 
        c.messages[0] && !c.messages[0].lu && c.messages[0].expediteurId !== utilisateur?.id
      ).length
    : 0;


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

  const onglets = [...ongletsPrincipaux];
  if (token) {
    onglets.push(ongletMessages);
  }
  onglets.push(dernierOnglet);

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="flex h-[68px]">
          {onglets.map(({ href, labelKey, icon }: Onglet) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            const showBadgeCommandes = href === '/tableau-bord' && nbEnAttente > 0;
            const showBadgeMessages = href === '/messages' && nbMessagesNonLus > 0;

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 tap-highlight-none transition-all duration-300 ${
                  active ? 'text-primary-700' : 'text-muted-fg hover:text-foreground'
                }`}
              >
                {active && (
                   <div className="absolute inset-x-1.5 inset-y-2 bg-primary-100/50 rounded-2xl animate-in fade-in zoom-in duration-300" />
                )}

                <span className={`relative z-10 transition-all duration-300 ${active ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                  {icon(active)}
                  {(showBadgeCommandes || showBadgeMessages) && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping ${showBadgeMessages ? 'bg-primary-400' : 'bg-red-400'}`} />
                      <span className={`relative flex h-4 w-4 items-center justify-center rounded-full text-white text-[9px] font-black border-2 border-white ${showBadgeMessages ? 'bg-primary-600' : 'bg-red-600 shadow-sm'}`}>
                        {showBadgeMessages ? (nbMessagesNonLus > 9 ? '9+' : nbMessagesNonLus) : (nbEnAttente > 9 ? '9+' : nbEnAttente)}
                      </span>
                    </span>
                  )}
                </span>

                <span className={`relative z-10 text-[10px] font-bold tracking-tight transition-colors duration-300 ${active ? 'text-primary-800' : 'text-muted-fg'}`}>
                  {t(labelKey)}
                </span>

                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary-600 animate-in fade-in slide-in-from-bottom-1" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
