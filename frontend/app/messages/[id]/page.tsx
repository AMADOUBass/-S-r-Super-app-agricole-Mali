'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useConversation } from '@/lib/queries';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { Send, User, ChevronLeft, Phone, Info, Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { AudioPlayer } from '@/components/ui/AudioPlayer';

interface Message {
  id: string;
  expediteurId: string;
  type: 'TEXTE' | 'VOCAL';
  contenu?: string;
  audioUrl?: string;
  lu: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  acheteurId: string;
  vendeurId: string;
  acheteur: { nom: string; photoUrl?: string };
  vendeur: { nom: string; photoUrl?: string };
  produit?: { type: string; prixFcfa: number; photoUrl?: string };
  animal?: { type: string; prixFcfa: number; photoUrl?: string };
  materiel?: { type: string; prixJour: number; photoUrl?: string };
}

export default function PageChat() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const { data, isLoading } = useConversation(id, true); // true = polling actif
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // État pour le vocal
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = data?.conversation;
  const messages = data?.messages || [];
  
  const estAcheteur = conversation?.acheteurId === utilisateur?.id;
  const partenaire = estAcheteur ? conversation?.vendeur : conversation?.acheteur;
  const objet = conversation?.produit || conversation?.animal || conversation?.materiel;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur micro:', err);
      alert('Impossible d’accéder au micro');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!nouveauMessage.trim() && !audioBlob) || envoiEnCours) return;

    setEnvoiEnCours(true);
    const formData = new FormData();
    
    if (audioBlob) {
      formData.append('audio', audioBlob, 'vocal.webm');
    } else {
      formData.append('contenu', nouveauMessage);
    }

    setNouveauMessage('');
    setAudioBlob(null);

    try {
      await api.post(`/conversations/${id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      console.error('Erreur envoi:', err);
      alert('Erreur lors de l’envoi du message');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Helper pour les séparateurs de date
  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return t('messages.today');
    if (d.toDateString() === yesterday.toDateString()) return t('messages.yesterday');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin shadow-lg" />
          <p className="text-xs font-black text-primary-600/50 uppercase tracking-widest animate-pulse">Chargement Sɔrɔ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col h-screen overflow-hidden">
      {/* Header Chat Spécialisé - Immersif */}
      <div className="bg-white/80 backdrop-blur-2xl border-b border-black/[0.03] px-4 py-3 pb-4 flex items-center gap-3 relative z-30 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <button 
          onClick={() => router.push('/messages')} 
          className="w-10 h-10 flex items-center justify-center -ml-2 hover:bg-surface-2 rounded-2xl text-foreground-3 transition-colors active:scale-90"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 border border-primary-200/50 overflow-hidden flex-shrink-0 shadow-sm">
            {partenaire?.photoUrl ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={partenaire.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : <span className="font-black text-lg">{partenaire?.nom?.charAt(0)}</span>}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-black text-foreground leading-tight truncate">{partenaire?.nom}</h2>
          <p className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">
            En ligne
          </p>
        </div>

        <button className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center text-primary-700 active:scale-90 transition-all shadow-sm border border-black/[0.02]">
          <Phone size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Info Produit - Glass Effect */}
      {objet && (
        <div className="bg-white/40 backdrop-blur-md border-b border-black/[0.02] px-4 py-2 flex items-center justify-between text-[10px] animate-fade-in z-20">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-black text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
              {objet.type}
            </span>
            <span className="text-muted-fg font-bold truncate tracking-tight uppercase">Négociation en cours</span>
          </div>
          <p className="font-black text-primary-700 shrink-0 ml-2 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
            {((objet as any)?.prixFcfa || (objet as any)?.prixJour)?.toLocaleString('fr')} F
          </p>
        </div>
      )}

      {/* Zone des messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed pb-10"
      >
        <div className="text-center py-6 px-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-[32px] mb-8 shadow-inner">
          <p className="text-[10px] text-primary-600/60 uppercase tracking-[0.2em] font-black">Discussion sécurisée</p>
          <p className="text-[11px] text-muted-fg mt-2 max-w-[240px] mx-auto leading-relaxed">Convenez d'un prix et d'un lieu de rendez-vous en toute confiance.</p>
        </div>

        {messages.map((m: Message, i: number) => {
          const estMoi = m.expediteurId === utilisateur?.id;
          const showDate = i === 0 || 
            new Date(m.createdAt).toDateString() !== new Date(messages[i-1].createdAt).toDateString();

          return (
            <div key={m.id} className="space-y-4">
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="bg-surface-3/50 backdrop-blur-md text-[10px] font-black text-muted-fg/70 uppercase tracking-widest px-4 py-1.5 rounded-full border border-black/[0.03]">
                    {formatDateSeparator(m.createdAt)}
                  </span>
                </div>
              )}
              
              <div 
                className={`flex ${estMoi ? 'justify-end' : 'justify-start'} animate-fade-up`}
                style={{ animationDelay: '50ms' }}
              >
                <div className={`max-w-[85%] px-5 py-3.5 rounded-[24px] shadow-sm relative transition-all hover:shadow-md ${
                  estMoi 
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-none shadow-primary-500/10' 
                    : 'bg-white text-foreground rounded-tl-none border border-black/[0.04]'
                }`}>
                  {m.type === 'VOCAL' && m.audioUrl ? (
                    <AudioPlayer src={m.audioUrl} isMien={estMoi} />
                  ) : (
                    <p className="text-[15px] leading-relaxed font-medium">{m.contenu}</p>
                  )}
                  <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${estMoi ? 'text-white/60' : 'text-muted-fg/60'}`}>
                    <span className="text-[9px] font-bold">
                      {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {estMoi && (
                      <span className="text-[10px] font-black">
                        {m.lu ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone de saisie Premium */}
      <div className="bg-white/90 backdrop-blur-2xl border-t border-black/[0.04] px-4 py-4 pb-10 sm:pb-6 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-30">
        {isRecording ? (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-[24px] px-5 py-2.5 animate-pulse">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="text-sm font-black tracking-tighter">{formatDuration(recordingDuration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cancelRecording} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
                <Trash2 size={22} />
              </button>
              <button onClick={stopRecording} className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-90 transition-transform">
                <Square size={20} fill="white" />
              </button>
            </div>
          </div>
        ) : audioBlob ? (
          <div className="flex items-center gap-3 bg-primary-50 border border-primary-200/50 rounded-[24px] p-2 pr-3">
             <div className="flex-1 px-4 py-1">
                <p className="text-[10px] font-black text-primary-700 uppercase tracking-widest">Vocal prêt ({formatDuration(recordingDuration)})</p>
             </div>
             <button onClick={cancelRecording} className="p-2 text-muted-fg hover:text-rose-600 transition-colors">
                <Trash2 size={20} />
             </button>
             <button 
               onClick={() => handleSend()}
               disabled={envoiEnCours}
               className="w-11 h-11 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
             >
               {envoiEnCours ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} strokeWidth={2.5} />}
             </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={startRecording}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-2 text-foreground-3 hover:text-primary-600 hover:bg-primary-50 transition-all active:scale-90"
            >
              <Mic size={22} strokeWidth={2.5} />
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text"
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                placeholder="Message..."
                className="w-full bg-surface-2 border border-black/[0.03] rounded-[22px] px-6 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500/30 transition-all placeholder:text-muted-fg/60"
              />
            </div>

            <button 
              type="submit"
              disabled={!nouveauMessage.trim() || envoiEnCours}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                nouveauMessage.trim() 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                  : 'bg-surface-2 text-muted-fg/40'
              }`}
            >
              {envoiEnCours ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} strokeWidth={2.5} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
