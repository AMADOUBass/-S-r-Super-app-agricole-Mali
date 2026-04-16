'use client';

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useConversations } from '@/lib/queries';
import useStore from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { MessageSquare, Inbox, ChevronRight, User } from 'lucide-react';

export default function PageMessages() {
  const { t } = useTranslation();
  const { data: conversations, isLoading } = useConversations();
  const utilisateur = useStore(s => s.utilisateur);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col">
        <Header titre={t('nav.messages')} />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
           <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
           <p className="text-muted-fg animate-pulse">{t('common.loading')}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre={t('nav.messages')} />

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 py-6">
        <h1 className="text-2xl font-black text-foreground mb-6">{t('messages.title')}</h1>

        {!conversations || conversations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm animate-fade-up">
            <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-muted-fg" />
            </div>
            <p className="font-bold text-foreground-3 text-lg">{t('messages.no_messages')}</p>
            <p className="text-sm text-muted-fg mt-1">{t('messages.start_chat')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv: any, i: number) => {
              const estAcheteur = conv.acheteurId === utilisateur?.id;
              const partenaire = estAcheteur ? conv.vendeur : conv.acheteur;
              const dernierMsg = conv.messages[0];
              const objet = conv.produit || conv.animal || conv.materiel;
              const contextLabel = objet?.type || 'Annonce';
              const sɔngɔ = objet?.prixFcfa || objet?.prixJour;
              
              return (
                <Link 
                  key={conv.id} 
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-border hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.98] animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Avatar simple */}
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0 text-primary-600 border border-primary-100 overflow-hidden">
                    {partenaire.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={partenaire.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-foreground truncate">{partenaire.nom}</h3>
                      <span className="text-[10px] text-muted-fg whitespace-nowrap">
                        {dernierMsg ? new Date(dernierMsg.createdAt).toLocaleDateString('fr', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        estAcheteur ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {estAcheteur ? t('messages.buying') : t('messages.selling')}
                      </span>
                      <span className="text-[9px] font-bold text-muted-fg uppercase tracking-tight">
                        • {contextLabel} {sɔngɔ ? `(${sɔngɔ.toLocaleString('fr')} F)` : ''}
                      </span>
                      {dernierMsg && !dernierMsg.lu && dernierMsg.expediteurId !== utilisateur?.id && (
                        <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse ml-auto" />
                      )}
                    </div>

                    <p className={`text-sm truncate ${dernierMsg && !dernierMsg.lu && dernierMsg.expediteurId !== utilisateur?.id ? 'text-foreground font-bold' : 'text-muted-fg'}`}>
                      {dernierMsg ? (dernierMsg.expediteurId === utilisateur?.id ? 'Vous : ' : '') + (dernierMsg.type === 'VOCAL' ? `🎤 ${t('messages.vocal')}` : dernierMsg.contenu) : t('messages.start_chat')}
                    </p>
                  </div>

                  <ChevronRight size={18} className="text-border" />
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
