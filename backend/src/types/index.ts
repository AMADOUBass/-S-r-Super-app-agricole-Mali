// Types TypeScript partagés pour le backend Sɔrɔ

import { Request } from 'express';

// ─────────────────────────────────────────────────────────────
// AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  telephone: string;
  role: string;
}

// Étend Request d'Express pour inclure l'utilisateur authentifié
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─────────────────────────────────────────────────────────────
// RÉPONSES API STANDARDISÉES
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────────────────────
// PARAMÈTRES DE REQUÊTE
// ─────────────────────────────────────────────────────────────

export interface ProduitsQuery {
  type?: string;
  region?: string;
  commune?: string;
  search?: string;
  page?: string;
  limit?: string;
  minPrix?: string;
  maxPrix?: string;
}

export interface ElevageQuery {
  type?: string;
  region?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface MaterielQuery {
  type?: string;
  region?: string;
  search?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: string;
  limit?: string;
}

// ─────────────────────────────────────────────────────────────
// SERVICES EXTERNES
// ─────────────────────────────────────────────────────────────

export interface SmsSendParams {
  to: string | string[];   // numéros au format +22360000000
  message: string;
}

export interface CinetPayInitParams {
  transaction_id: string;
  amount: number;           // en FCFA
  currency: 'XOF';
  customer_name: string;
  customer_phone_number: string;
  description: string;
  return_url: string;
  notify_url: string;
}

export interface MeteoResponse {
  commune: string;
  latitude: number;
  longitude: number;
  previsions: {
    date: string;
    tempMax: number;
    tempMin: number;
    precipitation: number;
    vent: number;
    description: string;
  }[];
}
