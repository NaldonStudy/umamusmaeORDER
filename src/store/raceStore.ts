import { create } from 'zustand';
import type { Team, RaceState, RacePhase } from '../types';
import {
  createInitialRaceState,
  createTeam,
  tickRace,
} from '../lib/raceEngine';
import { COUNTDOWN_START, MAX_TEAMS } from '../constants/race';

interface RaceStore {
  raceState: RaceState | null;
  pendingTeams: Team[];
  countdownValue: number;

  addTeam: (name: string) => void;
  removeTeam: (id: string) => void;
  updateTeamName: (id: string, name: string) => void;
  clearTeams: () => void;
  startCountdown: () => void;
  setPhase: (phase: RacePhase) => void;
  tickRace: () => void;
  tickCountdown: () => void;
  reset: () => void;
}

export const useRaceStore = create<RaceStore>((set, get) => ({
  raceState: null,
  pendingTeams: [],
  countdownValue: COUNTDOWN_START,

  addTeam: (name: string) => {
    const { pendingTeams } = get();
    if (pendingTeams.length >= MAX_TEAMS) return;
    set({ pendingTeams: [...pendingTeams, createTeam(name, pendingTeams.length)] });
  },

  removeTeam: (id: string) => {
    set((s) => ({ pendingTeams: s.pendingTeams.filter((t) => t.id !== id) }));
  },

  updateTeamName: (id: string, name: string) => {
    set((s) => ({
      pendingTeams: s.pendingTeams.map((t) => (t.id === id ? { ...t, name } : t)),
    }));
  },

  clearTeams: () => set({ pendingTeams: [] }),

  startCountdown: () => {
    const { pendingTeams } = get();
    set({ raceState: createInitialRaceState(pendingTeams), countdownValue: COUNTDOWN_START });
  },

  setPhase: (phase: RacePhase) => {
    set((s) => {
      if (!s.raceState) return s;
      return { raceState: { ...s.raceState, phase } };
    });
  },

  tickRace: () => {
    set((s) => {
      if (!s.raceState || s.raceState.phase !== 'racing') return s;
      return { raceState: tickRace(s.raceState) };
    });
  },

  tickCountdown: () => {
    set((s) => {
      const next = s.countdownValue - 1;
      if (next <= 0) {
        return {
          countdownValue: 0,
          raceState: s.raceState ? { ...s.raceState, phase: 'racing' } : s.raceState,
        };
      }
      return { countdownValue: next };
    });
  },

  reset: () => {
    set({ raceState: null, pendingTeams: [], countdownValue: COUNTDOWN_START });
  },
}));
