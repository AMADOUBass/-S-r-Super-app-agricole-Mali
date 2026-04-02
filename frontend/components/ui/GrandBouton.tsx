import Link from 'next/link';
import Image from 'next/image';

interface GrandBoutonProps {
  href: string;
  emoji: string;
  titre: string;
  sousTitre?: string;
  gradient: string;
  badge?: string;
  imageSrc?: string;
}

export function GrandBouton({ href, emoji, titre, sousTitre, gradient, badge, imageSrc }: GrandBoutonProps) {
  return (
    <Link
      href={href}
      className="relative rounded-2xl overflow-hidden flex flex-col justify-end
                 aspect-[4/3] active:scale-[0.96] transition-all duration-300
                 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 group"
    >
      {imageSrc ? (
        <>
          <Image
            src={imageSrc}
            alt={titre}
            fill
            className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 45vw, 220px"
          />
          {/* Dark overlay — lighter on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 group-hover:from-black/70 transition-all duration-300" />
        </>
      ) : (
        <div className={`absolute inset-0 ${gradient}`}>
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-black/10 group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}

      {/* Badge */}
      {badge && (
        <span className="absolute top-3 right-3 bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 border border-white/20">
          {badge}
        </span>
      )}

      {/* Emoji (sans photo) */}
      {!imageSrc && (
        <span className="absolute top-3.5 left-3.5 text-2xl group-hover:scale-110 transition-transform duration-300 z-10">
          {emoji}
        </span>
      )}

      {/* Contenu bas */}
      <div className="relative z-10 p-3.5 flex items-end justify-between">
        <div>
          <div className="text-white font-bold text-sm leading-tight drop-shadow">{titre}</div>
          {sousTitre && (
            <div className="text-white/70 text-xs mt-0.5 drop-shadow">{sousTitre}</div>
          )}
        </div>
        {/* Arrow — appears on hover */}
        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0
                        opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0
                        transition-all duration-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
