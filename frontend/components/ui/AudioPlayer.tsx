'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export function AudioPlayer({ src, isMien }: { src: string; isMien: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 py-1 min-w-[160px] ${isMien ? 'text-white' : 'text-primary-700'}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        preload="metadata"
      />
      
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          isMien ? 'bg-white/20 hover:bg-white/30' : 'bg-primary-100 hover:bg-primary-200'
        }`}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className={`h-1 rounded-full relative ${isMien ? 'bg-white/30' : 'bg-primary-100'}`}>
          <div
            className={`absolute top-0 left-0 h-full rounded-full ${isMien ? 'bg-white' : 'bg-primary-600'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold opacity-70">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
