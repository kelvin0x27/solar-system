import { create } from 'zustand';

interface SolarSystemState {
  selectedPlanetId: string | null;
  speedMultiplier: number;
  showOrbits: boolean;
  showLabels: boolean;
  showGlow: boolean;
  showMoons: boolean;
  isComparing: boolean;
  comparePlanets: [string | null, string | null];
  isRealTime: boolean;

  selectPlanet: (id: string | null) => void;
  setSpeed: (speed: number) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleGlow: () => void;
  toggleMoons: () => void;
  setComparing: (v: boolean) => void;
  setComparePlanet: (index: 0 | 1, id: string | null) => void;
  setRealTime: (v: boolean) => void;
}

export const useSolarSystemStore = create<SolarSystemState>((set) => ({
  selectedPlanetId: null,
  speedMultiplier: 1,
  showOrbits: true,
  showLabels: true,
  showGlow: true,
  showMoons: true,
  isComparing: false,
  comparePlanets: [null, null],
  isRealTime: false,

  selectPlanet: (id) => set({ selectedPlanetId: id }),
  setSpeed: (speed) => set({ speedMultiplier: speed }),
  toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleGlow: () => set((s) => ({ showGlow: !s.showGlow })),
  toggleMoons: () => set((s) => ({ showMoons: !s.showMoons })),
  setComparing: (v) => set({ isComparing: v }),
  setComparePlanet: (index, id) =>
    set((s) => {
      const cp = [...s.comparePlanets] as [string | null, string | null];
      cp[index] = id;
      return { comparePlanets: cp };
    }),
  setRealTime: (v) => set({ isRealTime: v }),
}));
