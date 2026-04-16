'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { StarRating } from '@/components/ui/StarRating';
import { useTranslation } from '@/lib/i18n';
import { useCreateAvis } from '@/lib/queries';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function PageNoterVendeur() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const createAvis = useCreateAvis();

  // On récupère la commande pour avoir l'ID du vendeur
  const { data: commande, isLoading } = useQuery({
    queryKey: ['commande-noter', id],
    queryFn: async () => {
      const res = await api.get(`/commandes/mes-commandes`);
      return res.data.data.find((c: any) => c.id === id);
    },
    enabled: !!id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commande) return;

    createAvis.mutate({
      note,
      commentaire,
      destinataireId: commande.vendeur.id,
      commandeId: id as string,
    }, {
      onSuccess: () => {
        router.push('/commandes');
      }
    });
  };

  if (isLoading) return <div className="p-10 text-center">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/commandes" titre={t('common.review')} />

      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-8">
        <div className="card p-6 animate-fade-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🌟
            </div>
            <h1 className="text-xl font-black text-foreground mb-2">
              Comment s'est passée votre transaction ?
            </h1>
            <p className="text-sm text-muted-fg leading-relaxed">
              Votre avis aide les autres agriculteurs à choisir les meilleurs partenaires sur Sɔrɔ.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center gap-4 py-6 bg-surface-1 rounded-3xl border border-border/40">
              <p className="text-sm font-bold text-foreground-3 uppercase tracking-wider">
                {t('common.rating')}
              </p>
              <StarRating 
                rating={note} 
                interactive 
                size={40} 
                onRatingChange={setNote} 
              />
              <span className="text-lg font-black text-amber-600">
                {note}/5
              </span>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground-2 flex items-center gap-2">
                {t('common.add_comment')}
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ex: Produit de très bonne qualité, livraison rapide..."
                rows={4}
                className="w-full bg-surface-2 border border-border/60 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={createAvis.isPending}
              className="w-full btn btn-primary btn-lg py-4 text-base font-bold shadow-xl shadow-primary-200"
            >
              {createAvis.isPending ? t('common.loading') : t('common.send_review')}
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
