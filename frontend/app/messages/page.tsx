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
      <Header titre={t('nav.messages')} retour="/" />

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 py-6">
        <h1 className="text-2xl font-black text-foreground mb-6">{t('messages.title')}</h1>

        {!conversations || conversations.length === 0 ? (
          <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/50 shadow-xl shadow-black/5 animate-fade-up">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <MessageSquare size={40} className="text-primary-600/40" />
            </div>
            <h2 className="font-black text-xl text-foreground px-6">{t('messages.no_messages')}</h2>
            <p className="text-sm text-muted-fg mt-2 px-10">{t('messages.start_chat')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv: any, i: number) => {
              const estAcheteur = conv.acheteurId === utilisateur?.id;
              const partenaire = estAcheteur ? conv.vendeur : conv.acheteur;
              const dernierMsg = conv.messages[0];
              const objet = conv.produit || conv.animal || conv.materiel;
              const contextLabel = objet?.type || 'Annonce';
              const sɔngɔ = objet?.prixFcfa || objet?.prixJour;
              const aNouveau = dernierMsg && !dernierMsg.lu && dernierMsg.expediteurId !== utilisateur?.id;
              
              return (
                <Link 
                  key={conv.id} 
                  href={`/messages/${conv.id}`}
                  className={`flex items-center gap-4 p-4 rounded-[28px] transition-all duration-300 active:scale-[0.97] animate-fade-up card-glass border-2 ${
                    aNouveau 
                      ? 'border-primary-500/20 bg-primary-50/10 shadow-lg shadow-primary-500/5' 
                      : 'border-transparent'
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Avatar Premium */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 flex items-center justify-center flex-shrink-0 text-primary-600 border border-border/40 overflow-hidden shadow-sm">
                      {partenaire.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={partenaire.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <User size={28} strokeWidth={1.5} className="text-primary-300" />
                          <span className="text-[10px] font-black">{partenaire.nom.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    {aNouveau && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 border-2 border-white rounded-full animate-pulse shadow-md shadow-primary-500/50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-black tracking-tight truncate ${aNouveau ? 'text-foreground' : 'text-foreground-2'}`}>
                        {partenaire.nom}
                      </h3>
                      <span className="text-[10px] font-bold text-muted-fg uppercase tracking-tighter">
                        {dernierMsg ? new Date(dernierMsg.createdAt).toLocaleDateString('fr', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1.5 grayscale-[0.3]">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        estAcheteur ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                      }`}>
                        {estAcheteur ? t('messages.buying') : t('messages.selling')}
                      </span>
                      <span className="text-[10px] font-bold text-muted-fg/80 truncate">
                        {contextLabel} • <span className="text-foreground-3">{sɔngɔ ? `${sɔngɔ.toLocaleString('fr')} F` : ''}</span>
                      </span>
                    </div>

                    <p className={`text-sm truncate leading-tight ${aNouveau ? 'text-foreground font-bold' : 'text-muted-fg'}`}>
                      {dernierMsg ? (
                        <>
                          {dernierMsg.expediteurId === utilisateur?.id && <span className="text-[10px] font-black text-primary-500 mr-1">VOUS :</span>}
                          {dernierMsg.type === 'VOCAL' ? `🎤 ${t('messages.vocal')}` : dernierMsg.contenu}
                        </>
                      ) : t('messages.start_chat')}
                    </p>
                  </div>

                  <ChevronRight size={20} className="text-muted-fg/30 flex-shrink-0" />
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
