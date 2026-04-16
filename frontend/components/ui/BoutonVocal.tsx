'use client';

import { useState } from 'react';
import { Volume2, Square } from 'lucide-react';

interface BoutonVocalProps {
  texte: string;
  className?: string;
}

export function BoutonVocal({ texte, className = '' }: BoutonVocalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const lireTexte = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Évite de cliquer sur le lien parent (ex: CarteAnnonce)

    if (!('speechSynthesis' in window)) {
      alert("Votre téléphone ne supporte pas la lecture vocale.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(texte);
    utterance.lang = 'fr-FR'; // Le Bambara n'est pas nativement supporté par l'API Web, on utilise un Français clair
    utterance.rate = 0.9; // Légèrement plus lent pour une meilleure compréhension

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={lireTexte}
      className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-colors
        ${isPlaying ? 'bg-primary-100 text-primary-700 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
        ${className}
      `}
      title="Écouter l'annonce"
      aria-label="Écouter l'annonce"
    >
      {isPlaying ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
    </button>
  );
}
