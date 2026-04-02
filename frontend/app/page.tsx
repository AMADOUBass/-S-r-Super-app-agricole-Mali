import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { GrandBouton } from '@/components/ui/GrandBouton';

const modules = [
  {
    href: '/produits',
    emoji: '🌾',
    titre: 'Vendre ma récolte',
    sousTitre: 'Mil, arachide, mangue…',
    gradient: 'bg-gradient-to-br from-primary-700 to-primary-900',
    imageSrc: '/images/produit.png',
    badge: 'Populaire',
  },
  {
    href: '/marche',
    emoji: '📊',
    titre: 'Prix du marché',
    sousTitre: 'Mis à jour chaque matin',
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-700',
  },
  {
    href: '/materiel',
    emoji: '🚜',
    titre: 'Louer du matériel',
    sousTitre: 'Tracteur, motopompe…',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    imageSrc: '/images/tracteur.png',
  },
  {
    href: '/elevage',
    emoji: '🐑',
    titre: 'Élevage',
    sousTitre: 'Moutons, bœufs…',
    gradient: 'bg-gradient-to-br from-rose-500 to-red-700',
    imageSrc: '/images/betail.png',
  },
];

const stats = [
  { valeur: '0%', label: 'Commission agriculteur', icon: '✦' },
  { valeur: '3%', label: 'Commission acheteur', icon: '✦' },
  { valeur: '11', label: 'Régions du Mali', icon: '✦' },
];

const etapes = [
  { num: '1', titre: 'Inscrivez-vous', desc: 'Avec votre numéro de téléphone — aucun email requis', color: 'bg-primary-600' },
  { num: '2', titre: 'Publiez votre stock', desc: 'Photo + quantité + prix en moins de 2 minutes', color: 'bg-emerald-500' },
  { num: '3', titre: 'Recevez des commandes', desc: 'Les acheteurs vous contactent directement', color: 'bg-teal-500' },
  { num: '4', titre: 'Paiement sécurisé', desc: "Orange Money — bloqué jusqu'à livraison", color: 'bg-amber-500' },
];

export default function Accueil() {
  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden" style={{ height: 'clamp(300px, 48vw, 560px)' }}>
          <Image
            src="/images/hero-jeune.png"
            alt="Agriculteur malien avec Sɔrɔ"
            fill
            className="object-cover object-[center_20%]"
            priority
            sizes="100vw"
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/50 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-6xl mx-auto w-full px-4 pb-10 md:pb-14">

              {/* Live badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5 mb-4 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-white/90 text-xs font-semibold tracking-wide">Plateforme agricole Mali</span>
              </div>

              <h1 className="animate-fade-up delay-100 text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-3 max-w-2xl" style={{textShadow:'0 2px 16px rgba(0,0,0,0.4)'}}>
                Vendez vos récoltes<br />
                <span className="text-green-300">au meilleur prix</span>
              </h1>
              <p className="animate-fade-up delay-200 text-white/70 text-sm md:text-base mb-6 max-w-sm">
                0% de commission. Paiement sécurisé Orange Money.
              </p>

              <div className="animate-fade-up delay-300 flex gap-3 flex-wrap">
                <Link href="/inscription"
                  className="inline-flex items-center gap-2 bg-white text-primary-800 font-bold px-6 py-3.5 rounded-xl shadow-lg text-sm md:text-base hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                  S'inscrire gratuitement
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/produits"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white font-semibold px-6 py-3.5 rounded-xl text-sm md:text-base hover:bg-white/25 transition-all duration-200">
                  Voir les annonces
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 w-full">

          {/* ── Stats flottantes ──────────────────────────────── */}
          <div className="-mt-6 mb-10 relative z-10 animate-fade-up delay-400">
            <div className="bg-white rounded-2xl shadow-float border border-border/30 px-4 md:px-8 py-4 md:py-5 grid grid-cols-3 divide-x divide-border/50">
              {stats.map((s, i) => (
                <div key={s.label} className={`text-center px-3 md:px-8 animate-fade-up`} style={{animationDelay:`${400 + i*80}ms`}}>
                  <div className="text-2xl md:text-4xl font-black text-primary-700 tracking-tight">{s.valeur}</div>
                  <div className="text-[11px] md:text-xs text-muted-fg mt-0.5 leading-tight font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 4 Modules ─────────────────────────────────────── */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-label mb-0.5">Modules</p>
                <h2 className="section-title">Que voulez-vous faire ?</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {modules.map((m, i) => (
                <div key={m.href} className="animate-fade-up" style={{animationDelay:`${i*80}ms`}}>
                  <GrandBouton {...m} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Témoignage + Étapes ───────────────────────────── */}
          <section className="mb-12 grid md:grid-cols-2 gap-6 md:gap-8 items-start">

            {/* Témoignage */}
            <div className="animate-fade-up delay-100">
              <p className="section-label mb-2">Témoignage</p>
              <h2 className="section-title mb-4">Ils utilisent Sɔrɔ</h2>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-card-hover" style={{ aspectRatio: '4/3' }}>
                <Image
                  src="/images/vieux-tel.png"
                  alt="Agriculteur malien"
                  fill
                  className="object-cover object-[center_30%]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  {/* Quote icon */}
                  <svg className="w-8 h-8 text-white/30 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <p className="text-white font-semibold text-base md:text-lg leading-snug drop-shadow">
                    "Maintenant je connais le vrai prix avant de vendre."
                  </p>
                  <p className="text-white/55 text-sm mt-2">Boubacar D. — Agriculteur à Ségou</p>
                </div>
              </div>
            </div>

            {/* Comment ça marche */}
            <div className="animate-fade-up delay-200">
              <p className="section-label mb-2">Guide rapide</p>
              <h2 className="section-title mb-4">Comment ça marche ?</h2>
              <div className="space-y-3">
                {etapes.map((step, i) => (
                  <div key={step.titre}
                    className="card flex items-center gap-4 p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                    style={{animationDelay:`${200 + i*70}ms`}}>
                    <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-white font-black text-sm">{step.num}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{step.titre}</div>
                      <div className="text-xs text-muted-fg mt-0.5 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA final ─────────────────────────────────────── */}
          <section className="mb-10 animate-fade-up">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-card-hover" style={{ minHeight: '160px' }}>
              <Image
                src="/images/produit.png"
                alt="Produits agricoles Mali"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 1152px"
              />
              <div className="absolute inset-0 bg-primary-950/80 backdrop-blur-[2px]" />

              {/* Decorative rings */}
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-2 border-white/5" />
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-white/5" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 py-10 gap-6">
                <div>
                  <h3 className="text-white font-black text-xl md:text-3xl mb-1">Prêt à commencer ?</h3>
                  <p className="text-white/55 text-sm md:text-base">Rejoignez des milliers d'agriculteurs maliens</p>
                </div>
                <Link href="/inscription"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-primary-800 font-bold px-7 py-3.5 rounded-xl text-sm md:text-base hover:shadow-glow-green hover:-translate-y-1 transition-all duration-300 active:scale-95">
                  S'inscrire maintenant — Gratuit
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
