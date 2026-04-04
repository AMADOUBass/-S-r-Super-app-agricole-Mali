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
  {
    href: '/meteo',
    emoji: '⛅',
    titre: 'Météo agricole',
    sousTitre: 'Prévisions 7 jours',
    gradient: 'bg-gradient-to-br from-sky-500 to-blue-700',
    imageSrc: '/images/reunion-village.png',
  },
];

const stats = [
  { valeur: '0%', label: 'Commission agriculteur' },
  { valeur: '3%', label: 'Commission acheteur' },
  { valeur: '11', label: 'Régions du Mali' },
];

const etapes = [
  { num: '1', titre: 'Inscrivez-vous', desc: 'Avec votre numéro de téléphone — aucun email requis', color: 'bg-primary-600' },
  { num: '2', titre: 'Publiez votre stock', desc: 'Photo + quantité + prix en moins de 2 minutes', color: 'bg-emerald-500' },
  { num: '3', titre: 'Recevez des commandes', desc: 'Les acheteurs vous contactent directement', color: 'bg-teal-500' },
  { num: '4', titre: 'Paiement sécurisé', desc: "Orange Money — bloqué jusqu'à livraison", color: 'bg-amber-500' },
];

const temoignages = [
  {
    image: '/images/dame-testimo-phone.png',
    quote: "Maintenant je connais le vrai prix avant de vendre. Je gagne 30% de plus.",
    nom: 'Fatoumata K.', lieu: 'Agricultrice à Ségou',
    position: 'object-[center_20%]',
  },
  {
    image: '/images/group-testimo.png',
    quote: "Tout notre groupement utilise Sɔrɔ pour vendre ensemble au meilleur prix.",
    nom: 'Coopérative de Mopti', lieu: 'Groupement de 12 agriculteurs',
    position: 'object-[center_30%]',
  },
  {
    image: '/images/kids.png',
    quote: "Grâce aux revenus de Sɔrɔ, mes enfants peuvent aller à l'école.",
    nom: 'Mamadou S.', lieu: 'Agriculteur à Sikasso',
    position: 'object-[center_40%]',
  },
];

const impacts = [
  { image: '/images/panneau.png', titre: 'Points de collecte', desc: 'Réseau dans tout le Mali' },
  { image: '/images/vehicule.png', titre: 'Livraison sécurisée', desc: 'Transport jusqu\'à l\'acheteur' },
  { image: '/images/salle-reunion.png', titre: 'Équipe terrain', desc: 'Support dans chaque région' },
  { image: '/images/Tel-Marche.png', titre: 'Accessible partout', desc: 'Depuis n\'importe quel téléphone' },
];

export default function Accueil() {
  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden" style={{ height: 'clamp(380px, 65vw, 620px)' }}>
          <Image
            src="/images/transaction-agri-elev.png"
            alt="Agriculteurs maliens avec Sɔrɔ"
            fill
            className="object-cover object-[center_35%]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/60 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-6xl mx-auto w-full px-5 pb-8 md:pb-16">

              <div className="animate-fade-up inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5 mb-4 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-white/90 text-xs font-semibold tracking-wide">Plateforme agricole Mali</span>
              </div>

              <h1 className="animate-fade-up text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-3 max-w-2xl" style={{textShadow:'0 2px 20px rgba(0,0,0,0.5)'}}>
                Vendez vos récoltes<br />
                <span className="text-green-300">au meilleur prix</span>
              </h1>
              <p className="animate-fade-up text-white/70 text-sm md:text-base mb-6 max-w-md">
                0% de commission pour les agriculteurs. Paiement sécurisé Orange Money. Connecté à tout le Mali.
              </p>

              <div className="animate-fade-up flex flex-col sm:flex-row gap-3">
                <Link href="/inscription"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-800 font-bold px-6 py-3.5 rounded-xl shadow-lg text-sm md:text-base hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                  S'inscrire gratuitement
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/produits"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white font-semibold px-6 py-3.5 rounded-xl text-sm md:text-base hover:bg-white/25 transition-all duration-200">
                  Voir les annonces
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 w-full">

          {/* ── Stats flottantes ─────────────────────────────── */}
          <div className="-mt-6 mb-12 relative z-10 animate-fade-up">
            <div className="bg-white rounded-2xl shadow-float border border-border/30 px-4 md:px-8 py-4 md:py-5 grid grid-cols-3 divide-x divide-border/50">
              {stats.map((s) => (
                <div key={s.label} className="text-center px-3 md:px-8">
                  <div className="text-2xl md:text-4xl font-black text-primary-700 tracking-tight">{s.valeur}</div>
                  <div className="text-[11px] md:text-xs text-muted-fg mt-0.5 leading-tight font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5 Modules ────────────────────────────────────── */}
          <section className="mb-14">
            <div className="mb-5">
              <p className="section-label mb-0.5">Modules</p>
              <h2 className="section-title">Que voulez-vous faire ?</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {modules.slice(0, 4).map((m) => (
                  <GrandBouton key={m.href} {...m} />
                ))}
              </div>
              {/* Météo — bannière horizontale */}
              <Link href="/meteo"
                className="relative flex items-center gap-4 rounded-2xl overflow-hidden px-5 py-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] group bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700"
                style={{ minHeight: '80px' }}>
                {/* Décorations */}
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute right-24 bottom-0 w-20 h-20 rounded-full bg-white/[0.07]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] leading-none opacity-10 select-none pointer-events-none">☀️</div>
                {/* Contenu */}
                <span className="relative z-10 text-3xl flex-shrink-0 drop-shadow">⛅</span>
                <div className="relative z-10 flex-1">
                  <p className="text-white font-bold text-sm drop-shadow">Météo agricole</p>
                  <p className="text-white/75 text-xs">Prévisions 7 jours · Conseils pour vos cultures</p>
                </div>
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </Link>
            </div>
          </section>

          {/* ── SMS sur le terrain ───────────────────────────── */}
          <section className="mb-14">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Grande image gauche */}
              <div className="relative rounded-2xl overflow-hidden shadow-card-hover" style={{ minHeight: '280px' }}>
                <Image
                  src="/images/dame-testimo-phone.png"
                  alt="Agricultrice recevant SMS Sɔrɔ"
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 mb-3 text-white text-xs font-mono leading-relaxed">
                    📱 SMS reçu :<br/>
                    <span className="text-green-300 font-bold">Sɔrɔ:</span> Prix Mil à Bamako : 320 FCFA/kg.<br/>Votre récolte est précieuse. Vendez plus.
                  </div>
                  <p className="text-white font-bold text-sm">Alertes prix par SMS</p>
                  <p className="text-white/60 text-xs">Sans internet — fonctionne sur tout téléphone</p>
                </div>
              </div>

              {/* Droite : 2 images empilées */}
              <div className="flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden shadow-card" style={{ minHeight: '130px' }}>
                  <Image
                    src="/images/group-testimo.png"
                    alt="Groupe d'agriculteurs Sɔrɔ"
                    fill
                    className="object-cover object-[center_30%]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm">Réseau de 10 000+ agriculteurs</p>
                    <p className="text-white/60 text-xs">Coopératives et groupements connectés</p>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-card" style={{ minHeight: '130px' }}>
                  <Image
                    src="/images/panneau.png"
                    alt="Point de collecte Sɔrɔ"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm">Points de collecte partout</p>
                    <p className="text-white/60 text-xs">Dans les 11 régions du Mali</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Comment ça marche ────────────────────────────── */}
          <section className="mb-14">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="section-label mb-2">Guide rapide</p>
                <h2 className="section-title mb-6">Comment ça marche ?</h2>
                <div className="space-y-3">
                  {etapes.map((step, i) => (
                    <div key={step.titre}
                      className="card flex items-center gap-4 p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                      style={{animationDelay:`${i*70}ms`}}>
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

              <div className="relative rounded-2xl overflow-hidden shadow-card-hover" style={{ minHeight: '360px' }}>
                <Image
                  src="/images/Tel-Marche.png"
                  alt="Sɔrɔ au marché de Bamako"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold">Accessible depuis n'importe où</p>
                  <p className="text-white/60 text-sm">Marché, village, champ — Sɔrɔ vous suit</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Témoignages ──────────────────────────────────── */}
          <section className="mb-14">
            <p className="section-label mb-1">Témoignages</p>
            <h2 className="section-title mb-6">Ils utilisent Sɔrɔ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {temoignages.map((t) => (
                <div key={t.nom} className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300" style={{ minHeight: '260px' }}>
                  <Image
                    src={t.image}
                    alt={t.nom}
                    fill
                    className={`object-cover ${t.position}`}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <svg className="w-6 h-6 text-white/30 mb-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                    <p className="text-white text-sm font-semibold leading-snug mb-2">{`"${t.quote}"`}</p>
                    <p className="text-white font-bold text-xs">{t.nom}</p>
                    <p className="text-white/55 text-xs">{t.lieu}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Impact terrain ───────────────────────────────── */}
          <section className="mb-14">
            <p className="section-label mb-1">Impact</p>
            <h2 className="section-title mb-6">Sɔrɔ sur le terrain</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {impacts.map((item) => (
                <div key={item.titre} className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300" style={{ minHeight: '180px' }}>
                  <Image
                    src={item.image}
                    alt={item.titre}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-xs">{item.titre}</p>
                    <p className="text-white/60 text-[11px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA final ────────────────────────────────────── */}
          <section className="mb-10">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-card-hover" style={{ minHeight: '200px' }}>
              <Image
                src="/images/reunion.png"
                alt="Communauté Sɔrɔ"
                fill
                className="object-cover object-[center_40%]"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-primary-950/80 backdrop-blur-[2px]" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 py-10 gap-6">
                <div>
                  <h3 className="text-white font-black text-xl md:text-3xl mb-1">Prêt à commencer ?</h3>
                  <p className="text-white/55 text-sm md:text-base">Rejoignez des milliers d'agriculteurs maliens</p>
                </div>
                <Link href="/inscription"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-primary-800 font-bold px-7 py-3.5 rounded-xl text-sm md:text-base hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95">
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
