'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  /** Thumbnail gradient background (shown while lightbox loads) */
  gradient?: string;
  /** className on the trigger wrapper */
  className?: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function ImageLightbox({
  src, alt, gradient = 'from-slate-700 to-slate-900',
  className = '', open, onOpen, onClose,
}: ImageLightboxProps) {

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  return (
    <>
      {/* ── Trigger ────────────────────────────────────────── */}
      <button
        onClick={onOpen}
        className={`relative group cursor-zoom-in ${className}`}
        aria-label="Agrandir la photo"
        type="button"
      >
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`} style={{ height: '260px' }}>
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </div>
        {/* Zoom hint */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={15} className="text-white" />
        </div>
      </button>

      {/* ── Lightbox overlay ───────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 transition-colors"
            aria-label="Fermer"
            type="button"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Image — stop propagation so clicking the image doesn't close */}
          <div
            className="relative w-full max-w-2xl mx-4"
            style={{ maxHeight: '85dvh' }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={800}
              height={800}
              className="object-contain w-full rounded-2xl shadow-2xl"
              style={{ maxHeight: '85dvh' }}
              sizes="(max-width: 640px) 100vw, 800px"
              priority
            />
          </div>

          {/* Swipe down hint on mobile */}
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/40 text-xs font-medium select-none">
            Appuyez en dehors pour fermer
          </p>
        </div>
      )}
    </>
  );
}
