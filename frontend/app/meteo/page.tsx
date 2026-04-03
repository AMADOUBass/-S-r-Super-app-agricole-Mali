'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useMeteo } from '@/lib/queries';
import useStore from '@/store/useStore';

// Code météo WMO → emoji
function getEmoji(description: string): string {
  if (description.includes('dégagé')) return '☀️';
  if (description.includes('Partiellement')) return '⛅';
  if (description.includes('Nuageux')) return '☁️';
  if (description.includes('Brouillard')) return '🌫️';
  if (description.includes('Bruine')) return '🌦️';
  if (description.includes('Pluie')) return '🌧️';
  if (description.includes('Averses')) return '🌦️';
  if (description.includes('Orage violent')) return '⛈️';
  if (description.includes('Orage')) return '🌩️';
  if (description.includes('Tempête')) return '🌪️';
  if (description.includes('Neige')) return '❄️';
  return '🌤️';
}

// Niveau de risque agricole selon précipitations + vent
function getRisqueAgricole(precipitation: number, vent: number, description: string): { niveau: string; couleur: string; conseil: string } | null {
  if (description.includes('Orage')) {
    return {
      niveau: 'Alerte',
      couleur: 'bg-red-50 border-red-200 text-red-700',
      conseil: 'Évitez les travaux en plein air. Abritez le matériel.',
    };
  }
  if (precipitation > 20) {
    return {
      niveau: 'Risque pluie',
      couleur: 'bg-blue-50 border-blue-200 text-blue-700',
      conseil: 'Fortes pluies prévues — bon pour l\'irrigation, attention aux inondations.',
    };
  }
  if (vent > 40) {
    return {
      niveau: 'Vent fort',
      couleur: 'bg-amber-50 border-amber-200 text-amber-700',
      conseil: 'Vent fort — risque pour les cultures hautes et les semences légères.',
    };
  }
  if (precipitation === 0 && description.includes('dégagé')) {
    return {
      niveau: 'Bon pour récolter',
      couleur: 'bg-primary-50 border-primary-200 text-primary-700',
      conseil: 'Conditions idéales pour les travaux agricoles.',
    };
  }
  return null;
}

const COMMUNES_MALI = [
  'Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes',
  'Koulikoro', 'Tombouctou', 'Gao', 'Bougouni', 'Kati',
  'Niono', 'San', 'Markala', 'Koutiala',
];

const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface Prevision {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  vent: number;
  description: string;
}

export default function PageMeteo() {
  const utilisateur = useStore(s => s.utilisateur);
  const communeDefaut = utilisateur?.commune || 'Bamako';
  const [commune, setCommune] = useState(communeDefaut);
  const [communeInput, setCommuneInput] = useState(commune);

  const { data, isLoading, isError } = useMeteo(commune);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (communeInput.trim()) setCommune(communeInput.trim());
  };

  const aujourd = data?.previsions?.[0] as Prevision | undefined;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">

        {/* Hero météo */}
        <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 px-4 pt-8 pb-20 relative overflow-hidden">
          {/* Décoration */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute right-16 bottom-4 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute left-4 bottom-6 w-24 h-24 rounded-full bg-white/[0.04]" />

          <div className="max-w-2xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="text-white/80 text-xs font-semibold tracking-wide">Prévisions 7 jours</span>
            </div>

            {/* Gros affichage météo du jour */}
            {aujourd && !isLoading ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium mb-0.5">{commune}</p>
                  <div className="flex items-end gap-3">
                    <span className="text-7xl font-black text-white leading-none">{aujourd.tempMax}°</span>
                    <span className="text-2xl text-white/60 font-bold pb-1">{aujourd.tempMin}°</span>
                  </div>
                  <p className="text-white/80 text-base font-semibold mt-1">{aujourd.description}</p>
                </div>
                <div className="text-8xl animate-float drop-shadow-lg">
                  {getEmoji(aujourd.description)}
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-16 w-48 bg-white/10 rounded-2xl animate-pulse" />
                <div className="h-5 w-32 bg-white/10 rounded-full animate-pulse" />
              </div>
            ) : null}

            {/* Barre de recherche commune */}
            <form onSubmit={handleSearch} className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input
                  type="text"
                  value={communeInput}
                  onChange={e => setCommuneInput(e.target.value)}
                  placeholder="Commune (ex: Niono, Sikasso…)"
                  className="w-full bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder:text-white/50 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium outline-none focus:bg-white/25 focus:border-white/40 transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-sky-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition-colors shadow-sm flex-shrink-0"
              >
                Voir
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 space-y-4">

          {/* Raccourcis communes */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {COMMUNES_MALI.map(c => (
              <button
                key={c}
                onClick={() => { setCommune(c); setCommuneInput(c); }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all duration-200 shadow-sm ${
                  commune === c
                    ? 'bg-sky-600 text-white scale-105'
                    : 'bg-white text-foreground-3 border border-border hover:bg-surface-2 hover:border-border-strong'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {isError && (
            <div className="card p-4 flex items-center gap-3 border-red-200 bg-red-50 animate-fade-up">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-sm font-semibold text-red-700">Impossible de charger la météo. Vérifiez votre connexion.</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="card p-4 flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                  <div className="skeleton h-8 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : data?.previsions ? (
            <>
              {/* Conseil du jour si risque */}
              {aujourd && (() => {
                const risque = getRisqueAgricole(aujourd.precipitation, aujourd.vent, aujourd.description);
                return risque ? (
                  <div className={`card p-4 flex items-start gap-3 border ${risque.couleur} animate-fade-up`}>
                    <div className="text-2xl flex-shrink-0">💡</div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 opacity-70`}>{risque.niveau}</p>
                      <p className="text-sm font-medium leading-relaxed">{risque.conseil}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Prévisions 7 jours */}
              <div className="card overflow-hidden animate-fade-up">
                <div className="px-5 py-4 border-b border-border/50">
                  <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-0.5">Prévisions</p>
                  <h2 className="font-bold text-foreground">7 prochains jours — {commune}</h2>
                </div>
                <div className="divide-y divide-border/40">
                  {(data.previsions as Prevision[]).map((jour, i) => {
                    const date = new Date(jour.date);
                    const jourLabel = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : JOURS_FR[date.getDay()];
                    const dateLabel = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    const risque = getRisqueAgricole(jour.precipitation, jour.vent, jour.description);

                    return (
                      <div
                        key={jour.date}
                        className={`flex items-center gap-3.5 px-5 py-3.5 animate-fade-up ${i === 0 ? 'bg-sky-50/50' : ''}`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        {/* Emoji */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${i === 0 ? 'bg-sky-100' : 'bg-surface-3'}`}>
                          {getEmoji(jour.description)}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${i === 0 ? 'text-sky-700' : 'text-foreground'}`}>{jourLabel}</span>
                            <span className="text-xs text-muted-fg">{dateLabel}</span>
                            {risque && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risque.couleur}`}>
                                {risque.niveau}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-fg font-medium mt-0.5 truncate">{jour.description}</p>
                        </div>

                        {/* Températures + précipitations */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground">{jour.tempMax}°</span>
                            <span className="text-sm text-muted-fg font-medium">{jour.tempMin}°</span>
                          </div>
                          {jour.precipitation > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-sky-600 font-semibold">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6 2 2 8.5 2 13a10 10 0 0020 0C22 8.5 18 2 12 2z"/></svg>
                              {jour.precipitation} mm
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Détails du jour */}
              {aujourd && (
                <div className="card p-5 animate-fade-up">
                  <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-4">Détails — aujourd'hui</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">🌡️</div>
                      <div className="text-base font-black text-sky-700">{aujourd.tempMax}°/{aujourd.tempMin}°</div>
                      <div className="text-[10px] font-semibold text-muted-fg mt-0.5">Températures</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">💧</div>
                      <div className="text-base font-black text-blue-700">{aujourd.precipitation} mm</div>
                      <div className="text-[10px] font-semibold text-muted-fg mt-0.5">Précipitations</div>
                    </div>
                    <div className="bg-surface-3 border border-border rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">💨</div>
                      <div className="text-base font-black text-foreground-3">{aujourd.vent} km/h</div>
                      <div className="text-[10px] font-semibold text-muted-fg mt-0.5">Vent max</div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-muted-fg flex items-center justify-center gap-1.5 pb-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Données Open-Meteo · Gratuites · Mises à jour toutes les heures
              </p>
            </>
          ) : null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
