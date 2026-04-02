// Store Zustand — état global de l'application Sɔrɔ
// Persisté dans localStorage pour survivre aux rechargements de page

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Utilisateur {
  id: string;
  nom: string;
  telephone: string;
  role: string;
  region: string;
  commune: string;
}

interface SoroState {
  // Authentification
  token: string | null;
  utilisateur: Utilisateur | null;
  telephone: string;        // stocké temporairement pendant la vérification OTP

  // Actions auth
  setToken: (token: string) => void;
  setUtilisateur: (utilisateur: Utilisateur) => void;
  setTelephone: (telephone: string) => void;
  deconnecter: () => void;

  // UI
  regionSelectee: string;
  setRegion: (region: string) => void;

  // Mode offline
  estOffline: boolean;
  setEstOffline: (offline: boolean) => void;
}

const useStore = create<SoroState>()(
  persist(
    (set) => ({
      // ── Auth ────────────────────────────────────────────────
      token: null,
      utilisateur: null,
      telephone: '',

      setToken: (token) => set({ token }),
      setUtilisateur: (utilisateur) => set({ utilisateur }),
      setTelephone: (telephone) => set({ telephone }),
      deconnecter: () => set({ token: null, utilisateur: null }),

      // ── UI ──────────────────────────────────────────────────
      regionSelectee: 'BAMAKO',
      setRegion: (region) => set({ regionSelectee: region }),

      // ── Offline ─────────────────────────────────────────────
      estOffline: false,
      setEstOffline: (estOffline) => set({ estOffline }),
    }),
    {
      name: 'soro-store',
      // Ne persiste que l'essentiel — pas l'état UI temporaire
      partialize: (state) => ({
        token: state.token,
        utilisateur: state.utilisateur,
        regionSelectee: state.regionSelectee,
      }),
    }
  )
);

export default useStore;
