'use client';

import { Header } from '@/components/layout/Header';
import { usePortefeuille } from '@/lib/queries';
import { api } from '@/lib/api';
import { useState } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
  XCircle, AlertCircle, Loader2, Landmark, 
  ChevronRight, History, Info
} from 'lucide-react';
import useStore from '@/store/useStore';
import { useRouter } from 'next/navigation';

export default function PortefeuillePage() {
  const { data: wallet, isLoading, refetch } = usePortefeuille();
  const { token } = useStore();
  const router = useRouter();
  
  const [showRetrait, setShowRetrait] = useState(false);
  const [montant, setMontant] = useState('');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!token) {
    if (typeof window !== 'undefined') router.push('/connexion');
    return null;
  }

  const handleRetrait = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await api.post('/portefeuille/retrait', {
        montant: parseInt(montant),
        numeroPhone: numero
      });
      setMessage({ type: 'success', text: 'Demande de retrait envoyée !' });
      setMontant('');
      setShowRetrait(false);
      refetch();
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Erreur lors du retrait' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col pb-20">
      <Header retour="/tableau-bord" titre="Mon Portefeuille" />
      
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-6">
        
        {/* Carte Solde */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-emerald-700 rounded-[2rem] p-7 text-white shadow-xl shadow-primary-900/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center py-4">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-2">Solde disponible</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">
                {isLoading ? '---' : wallet?.solde?.toLocaleString('fr')}
              </span>
              <span className="text-xl font-bold opacity-80 uppercase">FCFA</span>
            </div>
          </div>
          
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowRetrait(true)}
              className="flex items-center justify-center gap-2 bg-white text-primary-700 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:bg-white/90 active:scale-95 transition-all"
            >
              <ArrowUpRight size={18} />
              Retirer
            </button>
            <button 
              disabled
              className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white py-3.5 rounded-2xl font-bold text-sm opacity-50 cursor-not-allowed"
            >
              <Landmark size={18} />
              Virement
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
          } animate-fade-in`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        {/* Informations */}
        <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Les fonds de vos ventes sont ajoutés à votre solde dès que l'acheteur confirme la livraison. Les retraits vers <b>Orange Money</b> ou <b>Wave</b> sont traités sous 24h.
          </p>
        </div>

        {/* Historique */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-foreground-3 flex items-center gap-2">
              <History size={20} className="text-primary-600" />
              Historique
            </h2>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl w-full" />)
            ) : wallet?.transactions?.length > 0 ? (
              wallet.transactions.map((tx: any) => (
                <div key={tx.id} className="card p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      tx.montant > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {tx.montant > 0 ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                    </div>
                    <div>
                      <p className="font-black text-foreground-2">
                        {tx.type === 'VENTE' ? 'Vente récolte' : tx.type === 'RETRAIT' ? 'Demande retrait' : tx.type}
                      </p>
                      <p className="text-xs text-muted-fg font-semibold">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${tx.montant > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.montant > 0 ? '+' : ''}{tx.montant.toLocaleString('fr')}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-muted-fg mt-0.5 tracking-wider">FCFA</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center text-center px-6">
                <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mb-4">
                  <Clock size={32} className="text-muted-fg/40" />
                </div>
                <p className="text-foreground-3 font-bold">Aucune transaction</p>
                <p className="text-sm text-muted-fg mt-1">Vos ventes apparaîtront ici dès confirmation.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Retrait */}
      {showRetrait && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-foreground-3">Demander un retrait</h3>
              <button 
                onClick={() => setShowRetrait(false)}
                className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-muted-fg"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleRetrait} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-fg mb-2 ml-1">Montant à retirer (FCFA)</label>
                <input 
                  type="number"
                  placeholder="Ex: 50000"
                  required
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  className="w-full bg-surface-2 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl p-4 text-xl font-black outline-none transition-all"
                />
                <p className="text-[10px] text-muted-fg mt-2 ml-1 italic">
                  Solde max : {wallet?.solde?.toLocaleString('fr')} FCFA
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-fg mb-2 ml-1">Numéro Orange Money / Wave</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-fg font-bold">+223</span>
                  <input 
                    type="tel"
                    placeholder="66 00 00 00"
                    required
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                    className="w-full bg-surface-2 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl p-4 pl-14 text-lg font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !montant || parseInt(montant) > (wallet?.solde || 0)}
                className="w-full btn btn-primary py-4 rounded-2xl shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Confirmer le retrait'}
              </button>
              
              <p className="text-center text-[10px] text-muted-fg px-4">
                En confirmant, le montant sera déduit de votre solde et envoyé après vérification manuelle par l'équipe Sɔrɔ.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
