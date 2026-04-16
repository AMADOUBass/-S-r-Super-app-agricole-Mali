'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useConversation } from '@/lib/queries';
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

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col h-screen overflow-hidden">
      {/* Header Chat Spécialisé */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 relative z-30 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-2 rounded-full text-muted-fg">
          <ChevronLeft size={24} />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100 overflow-hidden flex-shrink-0">
          {partenaire?.photoUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={partenaire.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : <User size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">{partenaire?.nom}</h2>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En ligne
          </p>
        </div>

        <button className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-primary-700 active:scale-90 transition-transform">
          <Phone size={18} />
        </button>
      </div>

      {/* Info Produit */}
      {objet && (
        <div className="bg-white/70 backdrop-blur-md border-b border-border/50 px-4 py-2 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight">
              {objet.type}
            </span>
            <span className="text-muted-fg truncate">Négociation en cours...</span>
          </div>
          <p className="font-black text-foreground shrink-0 ml-2">
            {((objet as any)?.prixFcfa || (objet as any)?.prixJour)?.toLocaleString('fr')} F
          </p>
        </div>
      )}

      {/* Zone des messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <div className="text-center py-4 bg-white/40 backdrop-blur-sm border border-border/30 rounded-2xl mb-6">
          <p className="text-[10px] text-muted-fg uppercase tracking-widest font-black">Début de la discussion</p>
          <p className="text-[11px] text-muted-fg mt-1 px-4">Utilisez ce chat pour convenir d'un prix et d'un lieu de livraison.</p>
        </div>

        {messages.map((m: Message, i: number) => {
          const estMoi = m.expediteurId === utilisateur?.id;
          return (
            <div 
              key={m.id} 
              className={`flex ${estMoi ? 'justify-end' : 'justify-start'} animate-fade-up`}
              style={{ animationDelay: `${i === messages.length - 1 ? 0 : 50}ms` }}
            >
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm relative ${
                estMoi 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-white text-foreground rounded-tl-none border border-border'
              }`}>
                {m.type === 'VOCAL' && m.audioUrl ? (
                  <AudioPlayer src={m.audioUrl} isMien={estMoi} />
                ) : (
                  <p className="text-sm leading-relaxed">{m.contenu}</p>
                )}
                <div className={`flex items-center gap-1 mt-1 justify-end ${estMoi ? 'text-white/60' : 'text-muted-fg'}`}>
                  <span className="text-[9px]">
                    {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {estMoi && (
                    <span className="text-[10px]">
                      {m.lu ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input de saisie */}
      <div className="bg-white border-t border-border px-4 py-4 pb-10 sm:pb-4">
        {isRecording ? (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-full px-5 py-2 animate-pulse">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="text-sm font-bold">{formatDuration(recordingDuration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cancelRecording} className="p-2 text-muted-fg hover:text-rose-600 transition-colors">
                <Trash2 size={20} />
              </button>
              <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                <Square size={18} fill="white" />
              </button>
            </div>
          </div>
        ) : audioBlob ? (
          <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-full px-2 py-2">
             <div className="flex-1 px-4 py-1">
                <p className="text-xs font-bold text-primary-700">Vocal enregistré ({formatDuration(recordingDuration)})</p>
             </div>
             <button onClick={cancelRecording} className="p-2 text-muted-fg hover:text-rose-600">
                <Trash2 size={20} />
             </button>
             <button 
               onClick={() => handleSend()}
               disabled={envoiEnCours}
               className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
             >
               {envoiEnCours ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
             </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button 
              type="button"
              onClick={startRecording}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-surface-3 text-muted-fg hover:text-primary-600 transition-colors"
            >
              <Mic size={20} />
            </button>
            <input 
              type="text"
              value={nouveauMessage}
              onChange={(e) => setNouveauMessage(e.target.value)}
              placeholder="Écrivez un message..."
              className="flex-1 bg-surface-2 border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!nouveauMessage.trim() || envoiEnCours}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                nouveauMessage.trim() ? 'bg-primary-600 text-white shadow-lg' : 'bg-surface-3 text-muted-fg'
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
