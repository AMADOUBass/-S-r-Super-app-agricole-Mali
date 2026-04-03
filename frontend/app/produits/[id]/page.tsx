// Page détail d'une annonce de récolte
// Contact direct + bouton commander

'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { useProduit } from '@/lib/queries';
import { api } from '@/lib/api';
import { useState } from 'react';
import useStore from '@/store/useStore';

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️', GOMBO: '🥦',
  PATATE_DOUCE: '🍠', IGNAME: '🥔',
};

const EMOJI_BG: Record<string, string> = {
  MIL: 'from-primary-100 to-emerald-50',
  SORGHO: 'from-primary-100 to-emerald-50',
  MAIS: 'from-yellow-100 to-amber-50',
  RIZ: 'from-slate-100 to-gray-50',
  ARACHIDE: 'from-amber-100 to-yellow-50',
  NIEBE: 'from-orange-100 to-amber-50',
  MANGUE: 'from-yellow-100 to-orange-50',
  OIGNON: 'from-purple-100 to-pink-50',
  TOMATE: 'from-red-100 to-rose-50',
  KARITE: 'from-primary-100 to-teal-50',
  SESAME: 'from-amber-100 to-yellow-50',
  COTON: 'from-sky-100 to-blue-50',
};

export default function PageDetailProduit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useStore(s => s.token);
  const { data: produit, isLoading } = useProduit(id);
  const [quantite, setQuantite] = useState(1);
  const [chargement, setChargement] = useState(false);

  const commander = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      const res = await api.post('/commandes', { produitId: id, quantiteKg: quantite });
      router.push(`/commandes/${res.data.data.id}/payer`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setChargement(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/produits" />
      <div className="skeleton h-52 w-full" />
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4 w-full">
        <div className="card p-5 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className="skeleton h-7 w-1/2" />
              <div className="skeleton h-4 w-1/3" />
            </div>
            <div className="skeleton h-10 w-24 rounded-xl" />
          </div>
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
        <div className="card p-4 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
        <div className="card p-4 space-y-3">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (!produit) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/produits" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center text-3xl">🌾</div>
        <p className="font-bold text-foreground-3 text-lg">Annonce introuvable</p>
        <button onClick={() => router.push('/produits')} className="btn btn-secondary btn-sm mt-1">
          Retour aux récoltes
        </button>
      </div>
    </div>
  );

  const montantTotal = Math.round(produit.prixFcfa * quantite);
  const commission = Math.round(montantTotal * 0.03);
  const typeLabel = produit.type.charAt(0) + produit.type.slice(1).toLowerCase();
  const regionLabel = produit.region.charAt(0) + produit.region.slice(1).toLowerCase();
  const emoji = EMOJI[produit.type] || '📦';
  const emojiGrad = EMOJI_BG[produit.type] || 'from-primary-100 to-emerald-50';

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/produits" />

      <main className="flex-1 pb-32">
        {/* Photo / hero */}
        {produit.photoUrl ? (
          <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '4/3', maxHeight: '420px' }}>
            <Image src={produit.photoUrl} alt={produit.type} fill className="object-contain bg-surface-3" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className={`h-52 bg-gradient-to-br ${emojiGrad} flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/30" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20" />
            <span className="text-9xl drop-shadow-lg relative z-10">{emoji}</span>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* En-tête */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-black text-foreground">{typeLabel}</h1>
                <p className="text-sm text-muted-fg flex items-center gap-1.5 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {produit.commune}, {regionLabel}
                </p>
              </div>
              <div className="text-right flex-shrink-0 bg-primary-50 border border-primary-200 rounded-xl px-3 py-2">
                <div className="text-2xl font-black text-primary-700 leading-none">{produit.prixFcfa.toLocaleString('fr')}</div>
                <div className="text-xs text-primary-500 font-semibold mt-0.5">FCFA/kg</div>
              </div>
            </div>

            {produit.disponible && produit.quantiteKg > 0 ? (
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
                <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="text-primary-800 font-bold text-sm">
                  {produit.quantiteKg.toLocaleString('fr')} kg disponibles
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <span className="text-red-700 font-bold text-sm">Rupture de stock</span>
              </div>
            )}
          </div>

          {/* Description */}
          {produit.description && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-foreground-2 leading-relaxed">{produit.description}</p>
            </div>
          )}

          {/* Vendeur */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Agriculteur</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-black text-base">{produit.agriculteur.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-[15px]">{produit.agriculteur.nom}</p>
                  <p className="text-xs text-muted-fg font-medium">{produit.agriculteur.commune}</p>
                </div>
              </div>
              <a
                href={`tel:${produit.agriculteur.telephone}`}
                className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center hover:bg-primary-100 transition-colors hover:scale-105 duration-200"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
              </a>
            </div>
          </div>

          {/* Calculateur commande */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-4">Commander</p>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-bold text-foreground flex-1">Quantité (kg)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantite(q => Math.max(1, q - 10))}
                  className="w-9 h-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center hover:bg-surface-2 font-black text-lg transition-all hover:scale-105"
                >−</button>
                <input
                  type="number"
                  value={quantite}
                  onChange={e => setQuantite(Math.max(1, Math.min(produit.quantiteKg, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={produit.quantiteKg}
                  className="w-20 text-center text-lg font-black border-2 border-border rounded-xl px-2 py-1.5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setQuantite(q => Math.min(produit.quantiteKg, q + 10))}
                  className="w-9 h-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center hover:bg-surface-2 font-black text-lg transition-all hover:scale-105"
                >+</button>
              </div>
            </div>

            <div className="bg-surface-2 rounded-xl p-3.5 space-y-2.5 text-sm border border-border/60">
              <div className="flex justify-between text-foreground-2">
                <span className="font-medium">{quantite} kg × {produit.prixFcfa.toLocaleString('fr')} FCFA</span>
                <span className="font-bold">{montantTotal.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-fg">
                <span>Commission plateforme (3%)</span>
                <span>{commission.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between font-black text-foreground border-t border-border pt-2.5">
                <span>Total</span>
                <span className="text-primary-700 text-base">{(montantTotal + commission).toLocaleString('fr')} FCFA</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-fg">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-primary-600 font-medium">L'agriculteur reçoit 100%</span>
              <span>— commission payée par l'acheteur</span>
            </div>
          </div>
        </div>
      </main>

      {/* Boutons fixes */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border/60 px-4 py-3.5 flex gap-3 max-w-xl mx-auto">
        <a
          href={`https://wa.me/${produit.agriculteur.telephone.replace('+', '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre annonce de ${typeLabel} (${produit.prixFcfa.toLocaleString('fr')} FCFA/kg) sur Sɔrɔ.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn min-h-[52px] text-white bg-[#25D366] hover:bg-[#20ba5a] border-0 shadow-sm hover:shadow-md gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <button
          onClick={commander}
          disabled={chargement || !produit.disponible || produit.quantiteKg === 0}
          className="flex-1 btn btn-primary min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {chargement ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
              Commande…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
              Commander
            </>
          )}
        </button>
      </div>
    </div>
  );
}
