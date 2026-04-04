// Hooks TanStack Query pour tous les appels API Sɔrɔ
// Centralise la logique de fetching, mise en cache et pagination

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from './api';

// ─────────────────────────────────────────────────────────────
// PRODUITS
// ─────────────────────────────────────────────────────────────

export const useProduits = (filtres?: { type?: string; region?: string; commune?: string; search?: string }) => {
  return useInfiniteQuery({
    queryKey: ['produits', filtres],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/produits', {
        params: { ...filtres, page: pageParam, limit: 20 },
      });
      return res.data;
    },
    getNextPageParam: (lastPage: { pagination: { page: number; totalPages: number } }) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useProduit = (id: string) => {
  return useQuery({
    queryKey: ['produit', id],
    queryFn: async () => {
      const res = await api.get(`/produits/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useMesProduitsActifs = () => {
  return useQuery({
    queryKey: ['mes-produits'],
    queryFn: async () => {
      const res = await api.get('/produits/mes-annonces');
      return res.data.data;
    },
  });
};

// ─────────────────────────────────────────────────────────────
// MATÉRIEL
// ─────────────────────────────────────────────────────────────

export const useMateriel = (filtres?: { type?: string; region?: string; search?: string }) => {
  return useInfiniteQuery({
    queryKey: ['materiel', filtres],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/materiel', {
        params: { ...filtres, page: pageParam, limit: 20 },
      });
      return res.data;
    },
    getNextPageParam: (lastPage: { pagination: { page: number; totalPages: number } }) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// ─────────────────────────────────────────────────────────────
// ÉLEVAGE
// ─────────────────────────────────────────────────────────────

export const useElevage = (filtres?: { type?: string; region?: string; search?: string }) => {
  return useInfiniteQuery({
    queryKey: ['elevage', filtres],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/elevage', {
        params: { ...filtres, page: pageParam, limit: 20 },
      });
      return res.data;
    },
    getNextPageParam: (lastPage: { pagination: { page: number; totalPages: number } }) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// ─────────────────────────────────────────────────────────────
// PRIX DU MARCHÉ
// ─────────────────────────────────────────────────────────────

export const usePrixDuJour = (region?: string) => {
  return useQuery({
    queryKey: ['prix', region],
    queryFn: async () => {
      const res = await api.get('/prix', { params: region ? { region } : {} });
      return res.data.data;
    },
    staleTime: 30 * 60 * 1000, // Prix frais pendant 30 minutes
  });
};

export const useHistoriquePrix = (produit: string, region: string) => {
  return useQuery({
    queryKey: ['prix-historique', produit, region],
    queryFn: async () => {
      const res = await api.get('/prix/historique', { params: { produit, region } });
      return res.data.data;
    },
    enabled: !!produit && !!region,
  });
};

// ─────────────────────────────────────────────────────────────
// MÉTÉO
// ─────────────────────────────────────────────────────────────

export const useMeteo = (commune: string) => {
  return useQuery({
    queryKey: ['meteo', commune],
    queryFn: async () => {
      const res = await api.get(`/meteo/${encodeURIComponent(commune)}`);
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000, // Météo fraîche pendant 1 heure
    enabled: !!commune,
  });
};

// ─────────────────────────────────────────────────────────────
// COMMANDES
// ─────────────────────────────────────────────────────────────

export const useCommandesVendeur = (active = true) => {
  const token = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('soro-store') || '{}')?.state?.token; } catch { return null; } })()
    : null;

  return useQuery({
    queryKey: ['commandes-vendeur'],
    queryFn: async () => {
      const res = await api.get('/commandes/mes-commandes');
      return res.data.data;
    },
    enabled: !!token && active,
  });
};
