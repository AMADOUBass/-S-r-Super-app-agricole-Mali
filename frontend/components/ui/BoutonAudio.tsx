// Composant BoutonAudio — lecture audio en bambara
// Permet aux utilisateurs non-lecteurs d'écouter les instructions importantes
// Un seul audio joue à la fois dans l'app

'use client';

import { useState, useRef, useEffect } from 'react';

interface BoutonAudioProps {
  audioSrc: string;
  label?: string;
}

// Instance globale pour arrêter l'audio précédent
let audioActuel: HTMLAudioElement | null = null;

export function BoutonAudio({ audioSrc, label = 'Écouter en bambara' }: BoutonAudioProps) {
  const [lecture, setLecture] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Créer l'élément audio
    audioRef.current = new Audio(audioSrc);
    audioRef.current.addEventListener('ended', () => setLecture(false));

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioSrc]);

  const basculer = () => {
    if (!audioRef.current) return;

    if (lecture) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setLecture(false);
    } else {
      // Arrêter l'audio en cours dans d'autres composants
      if (audioActuel && audioActuel !== audioRef.current) {
        audioActuel.pause();
        audioActuel.currentTime = 0;
      }
      audioActuel = audioRef.current;
      audioRef.current.play().catch(console.error);
      setLecture(true);
    }
  };

  return (
    <button
      onClick={basculer}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-touch ${
        lecture
          ? 'bg-soro-or text-white animate-pulse'
          : 'bg-soro-or/10 text-soro-or-fonce border border-soro-or/30'
      }`}
      aria-label={label}
    >
      <span className="text-lg">{lecture ? '⏹️' : '🔊'}</span>
      <span className="hidden sm:inline">{lecture ? 'Stop' : label}</span>
    </button>
  );
}
