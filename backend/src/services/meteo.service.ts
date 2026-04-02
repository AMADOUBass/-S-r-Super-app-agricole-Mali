// Service météo — utilise Open-Meteo (gratuite, pas de clé API)
// Coordonnées GPS des principales communes maliennes incluses

import axios from 'axios';
import { MeteoResponse } from '../types';

const BASE_URL = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';

// Coordonnées GPS des principales communes/villes maliennes
const COORDONNEES_MALI: Record<string, { lat: number; lon: number }> = {
  bamako: { lat: 12.6392, lon: -8.0029 },
  sikasso: { lat: 11.3176, lon: -5.6667 },
  segou: { lat: 13.4317, lon: -6.2667 },
  mopti: { lat: 14.4943, lon: -4.1974 },
  kayes: { lat: 14.4476, lon: -11.4377 },
  koulikoro: { lat: 12.8672, lon: -7.5573 },
  tombouctou: { lat: 16.7735, lon: -3.0074 },
  gao: { lat: 16.2712, lon: -0.0423 },
  kidal: { lat: 18.4411, lon: 1.4078 },
  bougouni: { lat: 11.4167, lon: -7.4833 },
  kati: { lat: 12.75, lon: -8.0667 },
  niono: { lat: 14.25, lon: -5.9833 },
  san: { lat: 13.3, lon: -4.9 },
  markala: { lat: 13.6833, lon: -6.0833 },
  koutiala: { lat: 12.3833, lon: -5.4667 },
};

// Description météo en français à partir du code WMO
const getDescriptionMeteo = (code: number): string => {
  if (code === 0) return 'Ciel dégagé';
  if (code <= 2) return 'Partiellement nuageux';
  if (code <= 3) return 'Nuageux';
  if (code <= 9) return 'Brouillard';
  if (code <= 19) return 'Précipitations légères';
  if (code <= 29) return 'Orage';
  if (code <= 39) return 'Tempête de sable';
  if (code <= 49) return 'Brouillard givrant';
  if (code <= 59) return 'Bruine';
  if (code <= 69) return 'Pluie';
  if (code <= 79) return 'Neige';
  if (code <= 84) return 'Averses';
  if (code <= 94) return 'Orage';
  return 'Orage violent';
};

// ─────────────────────────────────────────────────────────────
// Récupérer la météo pour une commune malienne
// ─────────────────────────────────────────────────────────────
export const getMeteoParCommune = async (commune: string): Promise<MeteoResponse> => {
  const cleRecherche = commune.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const coords = COORDONNEES_MALI[cleRecherche] || COORDONNEES_MALI['bamako'];

  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      latitude: coords.lat,
      longitude: coords.lon,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode',
      timezone: 'Africa/Bamako',
      forecast_days: 7,
    },
  });

  const { daily } = response.data;

  const previsions = daily.time.map((date: string, i: number) => ({
    date,
    tempMax: Math.round(daily.temperature_2m_max[i]),
    tempMin: Math.round(daily.temperature_2m_min[i]),
    precipitation: daily.precipitation_sum[i] || 0,
    vent: Math.round(daily.windspeed_10m_max[i]),
    description: getDescriptionMeteo(daily.weathercode[i]),
  }));

  return {
    commune,
    latitude: coords.lat,
    longitude: coords.lon,
    previsions,
  };
};
