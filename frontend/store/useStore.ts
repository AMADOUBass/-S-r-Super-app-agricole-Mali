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
  telephone: string;

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

  // Hydratation — vrai une fois que localStorage est rechargé
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
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

      // ── Hydratation ─────────────────────────────────────────
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'soro-store',
      partialize: (state) => ({
        token: state.token,
        utilisateur: state.utilisateur,
        regionSelectee: state.regionSelectee,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useStore;
