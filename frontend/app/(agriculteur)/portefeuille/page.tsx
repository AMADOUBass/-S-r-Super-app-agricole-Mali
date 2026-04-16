'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePortefeuille } from '@/lib/queries';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info,
  TrendingUp,
  History,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function PagePortefeuille() {
  const { data: wallet, isLoading } = usePortefeuille();
  const [onglet, setOnglet] = useState<'transactions' | 'retraits'>('transactions');
  const [modalRetrait, setModalRetrait] = useState(false);
  const [montant, setMontant] = useState('');
  const [numero, setNumero] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const queryClient = useQueryClient();

  const handleRetrait = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    setSucces('');

    try {
      await api.post('/portefeuille/retrait', {
        montant: parseInt(montant),
        numeroPhone: numero,
      });
      setSucces('Demande de retrait envoyée avec succès !');
      setModalRetrait(false);
      setMontant('');
      queryClient.invalidateQueries({ queryKey: ['portefeuille'] });
    } catch (err: any) {
      setErreur(err.response?.data?.error || 'Erreur lors du retrait');
    } finally {
      setChargement(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col">
        <Header titre="Mon Portefeuille" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
        <BottomNav />
      </div>
    );
  }

  const transactions = wallet?.transactions || [];
  const retraits = wallet?.retraits || [];

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header titre="Mon Portefeuille" retour="/tableau-bord" />

      <main className="flex-1 pb-24 max-w-xl mx-auto w-full px-4 py-6 space-y-6">
        
        {/* Card Solde */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={120} />
          </div>
          
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">Solde disponible</p>
            <h2 className="text-4xl font-black mb-6">
              {wallet?.solde?.toLocaleString('fr') || 0} <span className="text-xl font-medium text-white/60 uppercase">FCFA</span>
            </h2>
            
            <button 
              onClick={() => { setErreur(''); setSucces(''); setModalRetrait(true); }}
              className="w-full bg-white text-primary-900 font-bold py-3.5 rounded-2xl shadow-lg hover:bg-primary-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowUpRight size={18} strokeWidth={2.5} />
              Retirer des fonds
            </button>
          </div>
        </div>

        {/* Info Zone */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-bold mb-0.5">Note sur les retraits</p>
            Les demandes sont traitées sous 24h à 48h. Le montant minimum est de 2 000 FCFA. Les fonds sont envoyés via Orange Money ou Wave.
          </div>
        </div>

        {/* Historique Tabs */}
        <div className="space-y-4">
          <div className="flex bg-white p-1 rounded-2xl border border-border">
            <button 
              onClick={() => setOnglet('transactions')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${onglet === 'transactions' ? 'bg-primary-600 text-white shadow-md' : 'text-muted-fg hover:bg-surface-3'}`}
            >
              <TrendingUp size={14} />
              Ventes & Gains
            </button>
            <button 
              onClick={() => setOnglet('retraits')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${onglet === 'retraits' ? 'bg-primary-600 text-white shadow-md' : 'text-muted-fg hover:bg-surface-3'}`}
            >
              <History size={14} />
              Mes Retraits
            </button>
          </div>

          <div className="space-y-3">
            {onglet === 'transactions' ? (
              transactions.length === 0 ? (
                <div className="card p-10 text-center text-muted-fg italic text-sm">
                  Aucun gain enregistré pour le moment.
                </div>
              ) : (
                transactions.map((tx: any) => (
                  <div key={tx.id} className="card p-4 flex items-center gap-4 animate-fade-in">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.montant > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.montant > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        {tx.type === 'VENTE' ? 'Vente confirmée' : tx.type === 'RETRAIT' ? 'Retrait' : tx.type}
                      </p>
                      <p className="text-[10px] text-muted-fg">{new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className={`text-sm font-black ${tx.montant > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tx.montant > 0 ? '+' : ''}{tx.montant.toLocaleString('fr')} F
                    </div>
                  </div>
                ))
              )
            ) : (
              retraits.length === 0 ? (
                <div className="card p-10 text-center text-muted-fg italic text-sm">
                  Aucun retrait demandé.
                </div>
              ) : (
                retraits.map((r: any) => (
                  <div key={r.id} className="card p-4 flex items-center gap-4 animate-fade-in text-sm">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        r.statut === 'VALIDE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        r.statut === 'REJETE' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {r.statut === 'VALIDE' ? <CheckCircle2 size={18} /> : 
                         r.statut === 'REJETE' ? <XCircle size={18} /> : 
                         <Clock size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{r.montant.toLocaleString('fr')} FCFA</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                             r.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-700' : 
                             r.statut === 'REJETE' ? 'bg-rose-100 text-rose-700' : 
                             'bg-amber-100 text-amber-700'
                          }`}>
                            {r.statut}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-fg mt-0.5">
                          Sur {r.numeroPhone} · {new Date(r.createdAt).toLocaleDateString('fr')}
                        </p>
                      </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </main>

      {/* Modale Retrait */}
      {modalRetrait && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-fade-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-foreground">Demander un retrait</h3>
              <button onClick={() => setModalRetrait(false)} className="p-2 hover:bg-surface-2 rounded-full">
                <XCircle className="text-muted-fg" />
              </button>
            </div>

            <form onSubmit={handleRetrait} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Montant à retirer (FCFA)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-fg">F</span>
                  <input 
                    type="number" 
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="Min 2000" 
                    className="input text-xl font-black pl-8" 
                    required 
                    min="2000"
                  />
                </div>
                <p className="text-[10px] text-muted-fg mt-1">Disponible : {wallet?.solde?.toLocaleString('fr') || 0} F</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Numéro Orange Money / Wave</label>
                <input 
                  type="tel" 
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex: 76001122" 
                  className="input font-bold" 
                  required 
                />
              </div>

              {erreur && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {erreur}
                </div>
              )}

              <button 
                type="submit" 
                disabled={chargement}
                className="btn btn-primary w-full btn-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95"
              >
                {chargement ? (
                   <Loader2 className="animate-spin" size={20} />
                ) : (
                  'Confirmer le retrait'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Success */}
      {succes && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-up">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between">
            <p className="text-sm font-bold">{succes}</p>
            <button onClick={() => setSucces('')} className="bg-white/20 p-1 rounded-full">
              <XCircle size={14} />
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
