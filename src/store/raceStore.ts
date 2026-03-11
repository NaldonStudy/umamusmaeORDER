import { create } from 'zustand';
import type { Team, RaceState, RacePhase } from '../types/race';
import {
  createInitialRaceState,
  tickRace,
  generateTeamColor,
  generateTeamEmoji,
} from '../lib/raceEngine';
import { getRandomSkills } from '../data/skills';

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
  reset: () => void;
  tickCountdown: () => void;
}

function createTeam(name: string, index: number): Team {
  const speedTiers = [4.8, 5.2, 5.5, 5.8, 6.1, 6.4];
  const baseSpeed = speedTiers[Math.floor(Math.random() * speedTiers.length)] + (Math.random() - 0.5) * 0.3;
  return {
    id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    color: generateTeamColor(index),
    emoji: generateTeamEmoji(index),
    baseSpeed,
    acceleration: 0.8 + Math.random() * 0.4,
    stamina: 65 + Math.floor(Math.random() * 36),
    condition: 0.85 + Math.random() * 0.15,
    skills: getRandomSkills(2 + Math.floor(Math.random() * 3)),
  };
}

export const useRaceStore = create<RaceStore>((set, get) => ({
  raceState: null,
  pendingTeams: [],
  countdownValue: 3,

  addTeam: (name: string) => {
    const { pendingTeams } = get();
    if (pendingTeams.length >= 12) return;
    const team = createTeam(name, pendingTeams.length);
    set({ pendingTeams: [...pendingTeams, team] });
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
    const state = createInitialRaceState(pendingTeams);
    set({ raceState: state, countdownValue: 3 });
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
    set({ raceState: null, pendingTeams: [], countdownValue: 3 });
  },
}));
