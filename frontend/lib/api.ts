// Client Axios configuré pour l'API Sɔrɔ
// Injecte automatiquement le token JWT depuis Zustand sur chaque requête

import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 15000, // 15 secondes timeout (réseau 3G lent au Mali)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur requête : injecter le token JWT
api.interceptors.request.use(config => {
  // Lire le token depuis localStorage (Zustand persiste là)
  if (typeof window !== 'undefined') {
    try {
      const state = JSON.parse(localStorage.getItem('soro-store') || '{}');
      const token = state?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Pas de token — requête anonyme
    }
  }
  return config;
});

// Intercepteur réponse : gérer les 401 (token expiré)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Ne rediriger que si un token existait (session expirée)
      // Si pas de token, c'est une requête anonyme normale — ne pas rediriger
      try {
        const state = JSON.parse(localStorage.getItem('soro-store') || '{}');
        const token = state?.state?.token;
        if (token) {
          localStorage.removeItem('soro-store');
          window.location.href = '/connexion';
        }
      } catch {
        // Ignorer
      }
    }
    return Promise.reject(error);
  }
);
